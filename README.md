# RM Comandas

Sistema web para gerenciamento de comandas de restaurante. A aplicação cobre o fluxo entre
garçom, cozinha, caixa e administração, usando React no frontend e Supabase para autenticação,
banco de dados, políticas de acesso e operações transacionais.

## Funcionalidades

- Login por e-mail/senha ou PIN numérico.
- Controle de acesso por função: garçom, cozinha, caixa e proprietário.
- Abertura de mesas e comandas.
- Lançamento de produtos para cozinha ou bar.
- Acompanhamento do preparo dos itens em tempo real.
- Solicitação de fechamento da comanda.
- Pagamentos parciais por diferentes formas de pagamento.
- Bloqueio do fechamento enquanto existir saldo pendente.
- Cadastro e manutenção de produtos e usuários.
- Proteção das tabelas com Row Level Security (RLS).
- Operações críticas executadas de forma transacional no PostgreSQL.

## Tecnologias

- React 19
- Vite 8
- React Router
- Supabase Auth, PostgreSQL, Realtime e Edge Functions
- Vitest
- ESLint

## Estrutura principal

```text
src/
├── components/       Componentes reutilizáveis
├── contexts/         Sessão e perfil do usuário
├── domain/           Regras puras e testes unitários
├── pages/            Telas do sistema
├── services/         Comunicação com Supabase e RPCs
└── lib/supabase.js   Cliente Supabase

supabase/
├── functions/        Edge Functions de autenticação e usuários
├── migrations/       Evolução do banco, RLS e funções transacionais
└── tests/            Testes SQL de segurança
```

## Pré-requisitos

- Node.js 22 ou superior
- npm
- Um projeto Supabase
- Supabase CLI para alterações no backend

## Configuração local

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/romulomax47/comandas-de-restaurante.git
cd comandas-de-restaurante
npm ci
```

Crie o arquivo `.env.local` na raiz:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

Use apenas a chave pública no frontend. Nunca coloque `SUPABASE_SERVICE_ROLE_KEY`, senha do
banco ou tokens pessoais em arquivos versionados.

Inicie o servidor:

```bash
npm run dev
```

O Vite exibirá o endereço local, normalmente `http://localhost:5173`.

## Banco de dados e autenticação

Antes de usar a versão atual do frontend, é necessário aplicar a migration de segurança e
publicar as Edge Functions. Faça backup do banco e siga o guia completo em
[docs/IMPLANTACAO_SEGURA.md](docs/IMPLANTACAO_SEGURA.md).

Resumo dos comandos, depois de autenticar e vincular a CLI ao projeto correto:

```bash
npx supabase db push
npx supabase functions deploy pin-login --no-verify-jwt
npx supabase functions deploy user-admin
```

O primeiro proprietário precisa ser criado no Supabase Auth e vinculado ao registro
correspondente de `garcons`, conforme explicado no guia de implantação.

## Segurança

- A autorização não depende de `localStorage`.
- A sessão é emitida pelo Supabase Auth.
- PINs são armazenados somente como hash e devem ser únicos.
- O login por PIN possui limite de tentativas.
- A função do usuário é validada no banco, não apenas na interface.
- Usuários anônimos não possuem acesso às tabelas operacionais.
- Lançamentos, pagamentos e fechamentos usam funções transacionais.

## Qualidade e testes

Execute as verificações do frontend:

```bash
npm run lint
npm test
npm run build
```

Com o Supabase local em execução, valide também as políticas e RPCs:

```bash
npx supabase test db
```

## Fluxo operacional

1. O garçom acessa ou cria uma mesa e abre sua comanda.
2. Os itens são gravados com os preços atuais do banco em uma única transação.
3. A cozinha acompanha cada item e atualiza seu estado até a entrega.
4. O garçom solicita o fechamento da conta.
5. O caixa registra um ou mais pagamentos.
6. A comanda e a mesa são encerradas juntas quando o saldo chega a zero.

## Situação das migrations antigas

O histórico inicial de migrations precisa ser reconciliado com o esquema já existente no
Supabase antes de ser consolidado. Não apague nem reescreva migrations aplicadas no projeto
remoto. Consulte o guia de implantação antes de executar um reset ou squash.

## Licença

O repositório ainda não possui uma licença definida. Adicione um arquivo `LICENSE` antes de
distribuir ou reutilizar o projeto publicamente.
