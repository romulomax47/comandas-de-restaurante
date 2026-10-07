# Implantação da autenticação e segurança

As alterações desta versão dependem da migration `20261007000000_seguranca_transacoes.sql`
e das Edge Functions `pin-login` e `user-admin`. Faça backup do banco antes de aplicar.

## 1. Pré-validação do banco atual

Confirme no SQL Editor que não existem duas comandas ativas para a mesma mesa:

```sql
select mesa_id, count(*)
from public.comandas
where status in ('aberta', 'fechamento')
group by mesa_id
having count(*) > 1;
```

Resolva qualquer resultado antes de executar a migration, pois ela cria uma restrição única.

Confirme também que nenhum PIN legado está repetido:

```sql
select array_agg(id order by id) as usuarios_com_mesmo_pin, count(*)
from public.garcons
where chave is not null
group by chave
having count(*) > 1;
```

A migration será interrompida com uma mensagem explícita se encontrar duplicidade. Depois da
migração, novos PINs são comparados com os hashes existentes sob lock transacional, impedindo
que duas alterações simultâneas gravem o mesmo PIN.

## 2. Aplicar backend

Com a CLI autenticada e vinculada ao projeto correto:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
supabase functions deploy pin-login --no-verify-jwt
supabase functions deploy user-admin
```

Não coloque `SUPABASE_SERVICE_ROLE_KEY` no frontend. O Supabase fornece esse segredo
automaticamente dentro das Edge Functions hospedadas.

## 3. Criar o primeiro proprietário

Crie o primeiro usuário em **Authentication > Users** no painel do Supabase. Copie o UUID
desse usuário e vincule-o ao registro correto de `garcons` pelo SQL Editor:

```sql
update public.garcons
set auth_user_id = 'UUID_DO_AUTH_USER',
    email = 'EMAIL_DO_PROPRIETARIO',
    funcao = 'proprietario',
    ativo = true
where id = ID_DO_GARCOM;

select public.definir_pin_garcom(ID_DO_GARCOM, 'PIN_DE_4_A_8_DIGITOS');
```

Não versione nem compartilhe o UUID, o e-mail, a senha ou o PIN usados na implantação.
Depois do primeiro acesso, os demais usuários podem ser criados na tela administrativa.

## 4. Frontend

Configure somente as variáveis públicas:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

Valide antes do deploy:

```bash
npm ci
npm run lint
npm test
npm run build
```

## 5. Verificações funcionais obrigatórias

1. Login por e-mail e senha e por PIN.
2. Bloqueio do PIN após cinco tentativas incorretas no intervalo de 15 minutos.
3. Garçom sem acesso ao caixa, cozinha e administração.
4. Cozinha capaz de avançar apenas o status dos itens.
5. Pagamentos parciais preservados depois de recarregar a página.
6. Fechamento bloqueado enquanto houver saldo.
7. Dois lançamentos simultâneos sem perda do total da comanda.

## Histórico antigo de migrations

Não remova ou reescreva migrations já aplicadas no projeto remoto. O histórico anterior está
incompleto no repositório e precisa ser reconciliado com `supabase db pull` antes de um squash.
Somente depois de validar um `supabase db reset` em banco descartável deve-se substituir o
histórico por uma baseline consolidada.
