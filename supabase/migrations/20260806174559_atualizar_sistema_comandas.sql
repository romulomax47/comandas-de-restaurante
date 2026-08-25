alter table public.pedidos
add column if not exists aberta_em timestamptz default now();
alter table public.pedidos
add column if not exists fechada_em timestamptz;
alter table public.pedidos
alter column status
set default 'aberta';
alter table public.mesas
add column if not exists comanda_ativa_id bigint;
alter table public.itens_pedido
add column if not exists status text default 'novo';
alter table public.mesas drop constraint if exists fk_comanda_ativa;
alter table public.mesas
add constraint fk_comanda_ativa foreign key (comanda_ativa_id) references public.pedidos(id);