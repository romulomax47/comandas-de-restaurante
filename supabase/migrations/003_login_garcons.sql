create table public.garcons (
   id bigint generated always as identity primary key,
   nome text not null,
   pin text not null,
   ativo boolean default true,
   created_at timestamptz default now()
);
insert into public.garcons (nome, pin)
values ('Romulo', '1234'),
   ('Carlos', '4321'),
   ('Ana', '9999');