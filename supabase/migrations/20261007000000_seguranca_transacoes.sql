-- Segurança, autenticação e operações atômicas.
-- Esta migration pressupõe o esquema operacional atual (garcons, mesas,
-- produtos, comandas, lancamentos, itens_pedido e pagamentos).

create extension if not exists pgcrypto with schema extensions;

alter table public.garcons add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
alter table public.garcons add column if not exists email text;
alter table public.garcons add column if not exists pin_hash text;
alter table public.garcons alter column chave drop not null;

do $$
declare v_grupos_duplicados integer;
begin
  select count(*) into v_grupos_duplicados
  from (
    select chave from public.garcons
    where chave is not null
    group by chave having count(*) > 1
  ) duplicados;

  if v_grupos_duplicados > 0 then
    raise exception 'Existem % grupo(s) de PINs duplicados em garcons. Corrija-os antes de aplicar a migration.',
      v_grupos_duplicados;
  end if;
end;
$$;

update public.garcons
set pin_hash = extensions.crypt(chave, extensions.gen_salt('bf', 10))
where chave is not null and pin_hash is null;

update public.garcons set chave = null where chave is not null;

alter table public.garcons drop constraint if exists garcons_funcao_check;
alter table public.garcons add constraint garcons_funcao_check
check (funcao in ('garcom', 'cozinha', 'caixa', 'proprietario'));

create or replace function public.usuario_ativo()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.garcons
    where auth_user_id = auth.uid() and ativo = true
  );
$$;

create or replace function public.usuario_tem_funcao(funcoes text[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.garcons
    where auth_user_id = auth.uid()
      and ativo = true
      and funcao = any(funcoes)
  );
$$;

create or replace function public.garcom_atual_id()
returns bigint
language sql stable security definer
set search_path = ''
as $$
  select id from public.garcons
  where auth_user_id = auth.uid() and ativo = true
  limit 1;
$$;

revoke all on function public.usuario_ativo() from public;
revoke all on function public.usuario_tem_funcao(text[]) from public;
revoke all on function public.garcom_atual_id() from public;
grant execute on function public.usuario_ativo() to authenticated;
grant execute on function public.usuario_tem_funcao(text[]) to authenticated;
grant execute on function public.garcom_atual_id() to authenticated;

-- Uma mesa não pode ter duas comandas em andamento.
create unique index if not exists comandas_uma_ativa_por_mesa
on public.comandas (mesa_id)
where status in ('aberta', 'fechamento');

-- Login por PIN: somente a Edge Function (service_role) pode chamar.
create table if not exists public.pin_login_tentativas (
  identificador text primary key,
  janela_inicio timestamptz not null default now(),
  tentativas integer not null default 0,
  bloqueado_ate timestamptz
);

alter table public.pin_login_tentativas enable row level security;
revoke all on public.pin_login_tentativas from public, anon, authenticated;

create or replace function public.verificar_pin(p_pin text, p_identificador text)
returns table (auth_user_id uuid, email text)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_tentativa public.pin_login_tentativas;
  v_auth_user_id uuid;
  v_email text;
  v_correspondencias integer;
begin
  insert into public.pin_login_tentativas (identificador)
  values (p_identificador) on conflict (identificador) do nothing;
  select * into v_tentativa from public.pin_login_tentativas
  where identificador = p_identificador for update;

  if v_tentativa.bloqueado_ate > now() then raise exception 'Muitas tentativas. Aguarde alguns minutos.'; end if;
  if v_tentativa.janela_inicio < now() - interval '15 minutes' then
    update public.pin_login_tentativas set janela_inicio = now(), tentativas = 0, bloqueado_ate = null
    where identificador = p_identificador;
  end if;

  select count(*), min(g.auth_user_id::text)::uuid, min(g.email)
  into v_correspondencias, v_auth_user_id, v_email
  from public.garcons g where g.ativo = true and g.auth_user_id is not null
    and g.pin_hash is not null and g.pin_hash = extensions.crypt(p_pin, g.pin_hash);

  if v_correspondencias <> 1 then
    update public.pin_login_tentativas
    set tentativas = tentativas + 1,
        bloqueado_ate = case when tentativas + 1 >= 5 then now() + interval '15 minutes' end
    where identificador = p_identificador;
    return;
  end if;

  delete from public.pin_login_tentativas where identificador = p_identificador;
  return query select v_auth_user_id, v_email;
end;
$$;

revoke all on function public.verificar_pin(text, text) from public, anon, authenticated;
grant execute on function public.verificar_pin(text, text) to service_role;

create or replace function public.definir_pin_garcom(p_garcom_id bigint, p_pin text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_pin !~ '^[0-9]{4,8}$' then
    raise exception 'O PIN deve conter de 4 a 8 dígitos';
  end if;

  -- Serializa alterações de PIN para impedir duas gravações simultâneas iguais.
  perform pg_advisory_xact_lock(hashtextextended('garcons_pin', 0));

  if exists (
    select 1 from public.garcons
    where id <> p_garcom_id
      and pin_hash is not null
      and pin_hash = extensions.crypt(p_pin, pin_hash)
  ) then
    raise exception 'Este PIN já está em uso';
  end if;

  update public.garcons
  set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf', 10)), chave = null
  where id = p_garcom_id;

  if not found then raise exception 'Funcionário não encontrado'; end if;
end;
$$;

revoke all on function public.definir_pin_garcom(bigint, text) from public, anon, authenticated;
grant execute on function public.definir_pin_garcom(bigint, text) to service_role;

-- Abre ou retorna a comanda existente sob lock da mesa.
create or replace function public.buscar_ou_criar_mesa(p_numero integer)
returns public.mesas
language plpgsql security definer
set search_path = ''
as $$
declare v_mesa public.mesas;
begin
  if not public.usuario_tem_funcao(array['garcom', 'proprietario']) then raise exception 'Acesso negado'; end if;
  if p_numero <= 0 then raise exception 'Número de mesa inválido'; end if;
  perform pg_advisory_xact_lock(p_numero::bigint);
  select * into v_mesa from public.mesas where numero = p_numero limit 1;
  if v_mesa.id is null then
    insert into public.mesas (numero, status) values (p_numero, 'livre') returning * into v_mesa;
  end if;
  if v_mesa.status = 'fechamento' then raise exception 'Mesa em fechamento'; end if;
  return v_mesa;
end;
$$;

create or replace function public.obter_ou_abrir_comanda(p_mesa_id bigint)
returns public.comandas
language plpgsql security definer
set search_path = ''
as $$
declare
  v_comanda public.comandas;
  v_garcom_id bigint := public.garcom_atual_id();
begin
  if not public.usuario_tem_funcao(array['garcom', 'proprietario']) then
    raise exception 'Acesso negado';
  end if;

  perform pg_advisory_xact_lock(p_mesa_id);
  select * into v_comanda from public.comandas
  where mesa_id = p_mesa_id and status in ('aberta', 'fechamento')
  order by id desc limit 1;

  if v_comanda.id is null then
    insert into public.comandas (mesa_id, status, total, aberta_por)
    values (p_mesa_id, 'aberta', 0, v_garcom_id)
    returning * into v_comanda;
  end if;

  return v_comanda;
end;
$$;

-- Cria lançamento, itens, total e ocupação da mesa na mesma transação.
create or replace function public.lancar_pedido(p_comanda_id bigint, p_itens jsonb)
returns public.comandas
language plpgsql security definer
set search_path = ''
as $$
declare
  v_garcom_id bigint := public.garcom_atual_id();
  v_lancamento_id bigint;
  v_total numeric(12,2);
  v_comanda public.comandas;
begin
  if not public.usuario_tem_funcao(array['garcom', 'proprietario']) then raise exception 'Acesso negado'; end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then raise exception 'Pedido vazio'; end if;

  select * into v_comanda from public.comandas where id = p_comanda_id for update;
  if v_comanda.id is null or v_comanda.status <> 'aberta' then raise exception 'Comanda indisponível'; end if;

  insert into public.lancamentos (comanda_id, lancado_por)
  values (p_comanda_id, v_garcom_id) returning id into v_lancamento_id;

  with solicitados as (
    select (item->>'produto_id')::bigint produto_id, (item->>'quantidade')::integer quantidade,
           nullif(item->>'observacao', '') observacao
    from jsonb_array_elements(p_itens) item
  ), inseridos as (
    insert into public.itens_pedido
      (comanda_id, lancamento_id, produto_id, quantidade, preco_unitario, status, lancado_por, observacao)
    select p_comanda_id, v_lancamento_id, p.id, s.quantidade, p.preco, 'novo', v_garcom_id, s.observacao
    from solicitados s join public.produtos p on p.id = s.produto_id and p.ativo = true
    where s.quantidade > 0
    returning quantidade, preco_unitario
  ) select coalesce(sum(quantidade * preco_unitario), 0) into v_total from inseridos;

  if v_total <= 0 then raise exception 'Nenhum item válido'; end if;

  update public.comandas set total = coalesce(total, 0) + v_total
  where id = p_comanda_id returning * into v_comanda;
  update public.mesas set status = 'ocupada', comanda_ativa_id = p_comanda_id where id = v_comanda.mesa_id;
  return v_comanda;
end;
$$;

create or replace function public.solicitar_fechamento_atomico(p_comanda_id bigint)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare v_mesa_id bigint;
begin
  if not public.usuario_tem_funcao(array['garcom', 'proprietario']) then raise exception 'Acesso negado'; end if;
  update public.comandas set status = 'fechamento'
  where id = p_comanda_id and status = 'aberta' returning mesa_id into v_mesa_id;
  if v_mesa_id is null then raise exception 'Comanda indisponível'; end if;
  update public.mesas set status = 'fechamento' where id = v_mesa_id;
end;
$$;

create or replace function public.registrar_pagamento_atomico(p_comanda_id bigint, p_valor numeric, p_forma text)
returns public.pagamentos
language plpgsql security definer
set search_path = ''
as $$
declare v_total numeric; v_pago numeric; v_pagamento public.pagamentos;
begin
  if not public.usuario_tem_funcao(array['caixa', 'proprietario']) then raise exception 'Acesso negado'; end if;
  if p_valor <= 0 or p_forma not in ('dinheiro','pix','credito','debito') then raise exception 'Pagamento inválido'; end if;
  select greatest(total - desconto, 0) into v_total from public.comandas
  where id = p_comanda_id and status = 'fechamento' for update;
  if v_total is null then raise exception 'Comanda indisponível'; end if;
  select coalesce(sum(valor), 0) into v_pago from public.pagamentos where comanda_id = p_comanda_id;
  if p_valor > v_total - v_pago + 0.001 then raise exception 'Pagamento maior que o saldo'; end if;
  insert into public.pagamentos (comanda_id, valor, forma)
  values (p_comanda_id, p_valor, p_forma) returning * into v_pagamento;
  return v_pagamento;
end;
$$;

create or replace function public.finalizar_comanda_atomico(p_comanda_id bigint, p_forma text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare v_mesa_id bigint; v_total numeric; v_pago numeric;
begin
  if not public.usuario_tem_funcao(array['caixa', 'proprietario']) then raise exception 'Acesso negado'; end if;
  select mesa_id, greatest(total - desconto, 0) into v_mesa_id, v_total
  from public.comandas where id = p_comanda_id and status = 'fechamento' for update;
  if v_mesa_id is null then raise exception 'Comanda indisponível'; end if;
  select coalesce(sum(valor), 0) into v_pago from public.pagamentos where comanda_id = p_comanda_id;
  if v_pago + 0.001 < v_total then raise exception 'Ainda existe saldo pendente'; end if;
  update public.comandas set status = 'fechada', fechada_em = now(), forma_pagamento = p_forma
  where id = p_comanda_id;
  update public.mesas set status = 'livre', comanda_ativa_id = null where id = v_mesa_id;
end;
$$;

revoke all on function public.buscar_ou_criar_mesa(integer) from public, anon;
revoke all on function public.obter_ou_abrir_comanda(bigint) from public, anon;
revoke all on function public.lancar_pedido(bigint, jsonb) from public, anon;
revoke all on function public.solicitar_fechamento_atomico(bigint) from public, anon;
revoke all on function public.registrar_pagamento_atomico(bigint, numeric, text) from public, anon;
revoke all on function public.finalizar_comanda_atomico(bigint, text) from public, anon;
grant execute on function public.buscar_ou_criar_mesa(integer) to authenticated;
grant execute on function public.obter_ou_abrir_comanda(bigint) to authenticated;
grant execute on function public.lancar_pedido(bigint, jsonb) to authenticated;
grant execute on function public.solicitar_fechamento_atomico(bigint) to authenticated;
grant execute on function public.registrar_pagamento_atomico(bigint, numeric, text) to authenticated;
grant execute on function public.finalizar_comanda_atomico(bigint, text) to authenticated;

alter table public.garcons enable row level security;
alter table public.produtos enable row level security;
alter table public.mesas enable row level security;
alter table public.comandas enable row level security;
alter table public.lancamentos enable row level security;
alter table public.itens_pedido enable row level security;
alter table public.pagamentos enable row level security;

revoke all on public.garcons, public.produtos, public.mesas, public.comandas,
  public.lancamentos, public.itens_pedido, public.pagamentos from anon;
revoke select on public.garcons from authenticated;
grant select (id, nome, email, funcao, ativo, auth_user_id, criado_em)
  on public.garcons to authenticated;

create policy garcons_ler_proprio on public.garcons for select to authenticated
using (auth_user_id = auth.uid() or public.usuario_tem_funcao(array['proprietario']));
create policy produtos_ler on public.produtos for select to authenticated using (public.usuario_ativo());
create policy produtos_admin on public.produtos for all to authenticated
using (public.usuario_tem_funcao(array['proprietario'])) with check (public.usuario_tem_funcao(array['proprietario']));
create policy mesas_ler on public.mesas for select to authenticated using (public.usuario_ativo());
create policy comandas_ler on public.comandas for select to authenticated using (public.usuario_ativo());
create policy lancamentos_ler on public.lancamentos for select to authenticated using (public.usuario_ativo());
create policy itens_ler on public.itens_pedido for select to authenticated using (public.usuario_ativo());
create policy itens_cozinha_atualizar on public.itens_pedido for update to authenticated
using (public.usuario_tem_funcao(array['cozinha','proprietario']))
with check (
  public.usuario_tem_funcao(array['cozinha','proprietario'])
  and status in ('novo', 'em_preparo', 'pronto', 'entregue', 'cancelado')
);
create policy pagamentos_ler on public.pagamentos for select to authenticated
using (public.usuario_tem_funcao(array['caixa','proprietario']));

-- Escritas operacionais passam exclusivamente pelas funções acima.
revoke insert, update, delete on public.garcons from authenticated, anon;
revoke insert, update, delete on public.mesas from authenticated, anon;
revoke insert, update, delete on public.comandas from authenticated, anon;
revoke insert, update, delete on public.lancamentos from authenticated, anon;
revoke insert, update, delete on public.itens_pedido from authenticated, anon;
grant update (status) on public.itens_pedido to authenticated;
revoke insert, update, delete on public.pagamentos from authenticated, anon;
