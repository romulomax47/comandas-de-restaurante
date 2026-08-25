-- Quem abriu a comanda
alter table public.comandas
rename column garcom_id to aberta_por;

-- Quem realizou cada lançamento
alter table public.itens_pedido
rename column garcom_id to lancado_por;