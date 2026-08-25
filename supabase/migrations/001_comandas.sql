-- ==========================================
-- MIGRATION 001
-- Sistema de Comandas
-- ==========================================
-- Adiciona datas na tabela pedidos
ALTER TABLE pedidos
ADD COLUMN aberta_em timestamptz DEFAULT now();
add column garcom_id bigint references garcons(id);
ALTER TABLE pedidos
ADD COLUMN fechada_em timestamptz;
ALTER TABLE pedidos
ALTER COLUMN status
SET DEFAULT 'aberta';
-- Adiciona comanda ativa na mesa
ALTER TABLE mesas
ADD COLUMN comanda_ativa_id bigint;
ALTER TABLE mesas
ADD CONSTRAINT fk_comanda_ativa FOREIGN KEY (comanda_ativa_id) REFERENCES pedidos(id);
-- Adiciona status do item
ALTER TABLE itens_pedido
ADD COLUMN status text DEFAULT 'novo';
alter table itens_comanda
add column garcom_id bigint references garcons(id);