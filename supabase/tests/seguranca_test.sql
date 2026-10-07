begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

select ok(relrowsecurity, 'RLS ativo em garcons') from pg_class where oid = 'public.garcons'::regclass;
select ok(relrowsecurity, 'RLS ativo em produtos') from pg_class where oid = 'public.produtos'::regclass;
select ok(relrowsecurity, 'RLS ativo em mesas') from pg_class where oid = 'public.mesas'::regclass;
select ok(relrowsecurity, 'RLS ativo em comandas') from pg_class where oid = 'public.comandas'::regclass;
select ok(relrowsecurity, 'RLS ativo em lancamentos') from pg_class where oid = 'public.lancamentos'::regclass;
select ok(relrowsecurity, 'RLS ativo em itens_pedido') from pg_class where oid = 'public.itens_pedido'::regclass;
select ok(relrowsecurity, 'RLS ativo em pagamentos') from pg_class where oid = 'public.pagamentos'::regclass;

select is(has_table_privilege('anon', 'public.garcons', 'SELECT'), false, 'anon sem acesso a garcons');
select is(has_table_privilege('anon', 'public.produtos', 'SELECT'), false, 'anon sem acesso a produtos');
select is(has_table_privilege('anon', 'public.mesas', 'SELECT'), false, 'anon sem acesso a mesas');
select is(has_table_privilege('anon', 'public.comandas', 'SELECT'), false, 'anon sem acesso a comandas');
select is(has_table_privilege('anon', 'public.lancamentos', 'SELECT'), false, 'anon sem acesso a lancamentos');
select is(has_table_privilege('anon', 'public.itens_pedido', 'SELECT'), false, 'anon sem acesso a itens');
select is(has_table_privilege('anon', 'public.pagamentos', 'SELECT'), false, 'anon sem acesso a pagamentos');

select has_function('public', 'buscar_ou_criar_mesa', array['integer'], 'RPC de mesa existe');
select has_function('public', 'lancar_pedido', array['bigint', 'jsonb'], 'RPC de lançamento existe');
select has_function('public', 'solicitar_fechamento_atomico', array['bigint'], 'RPC de fechamento existe');
select has_function('public', 'registrar_pagamento_atomico', array['bigint', 'numeric', 'text'], 'RPC de pagamento existe');
select has_function('public', 'finalizar_comanda_atomico', array['bigint', 'text'], 'RPC de finalização existe');
select has_function('public', 'definir_pin_garcom', array['bigint', 'text'], 'RPC segura de PIN existe');

select * from finish();
rollback;
