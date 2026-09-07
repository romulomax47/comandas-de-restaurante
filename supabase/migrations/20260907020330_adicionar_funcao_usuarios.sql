alter table public.garcons
add column if not exists funcao text not null default 'garcom';

alter table public.garcons
add constraint garcons_funcao_check
check (
  funcao in ('garcom', 'caixa', 'proprietario')
);