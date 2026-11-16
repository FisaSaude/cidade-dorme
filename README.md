# Cidade Dorme — Apoio ao Narrador

Aplicação web local para conduzir partidas presenciais de Cidade Dorme. O narrador cadastra participantes, configura papéis manualmente, conduz as fases da noite e da votação, encerra a partida por vitória ou manualmente e consulta histórico e ranking.

## Pré-requisitos

- Node.js 24 ou compatível com Vite 8.
- npm.
- Portas livres: `5173` (Vite) e `3001` (JSON Server).

## Instalação

```bash
npm install
```

## Execução

Inicie o JSON Server e o Vite juntos:

```bash
npm run dev:all
```

Ou use dois terminais:

```bash
npm run dev:api
npm run dev
```

Abra `http://localhost:5173`. A API simulada responde em `http://localhost:3001`.

## Scripts

| Script | Função |
|---|---|
| `npm run dev` | Inicia o Vite em modo de desenvolvimento. |
| `npm run dev:api` | Inicia o JSON Server observando `db.json` na porta 3001. |
| `npm run dev:all` | Inicia JSON Server e Vite em paralelo. |
| `npm test` | Executa a suíte Vitest uma vez. |
| `npm run test:watch` | Executa o Vitest em modo observação. |
| `npm run lint` | Executa o Oxlint. |
| `npm run build` | Gera o build de produção. |
| `npm run preview` | Serve o build de produção localmente. |

## Persistência com `db.json`

O arquivo `db.json` na raiz é a fonte observada pelo JSON Server e começa vazio:

```json
{ "participants": [], "matches": [] }
```

- `participants`: participantes cadastrados (nome e ID).
- `matches`: partidas finalizadas, com os participantes da partida embutidos (`MatchParticipant`), resultado e turnos.
- Ações noturnas, investigações e votos individuais existem apenas em memória e não são enviados à API.
- Ao encerrar a partida, um único `PUT /matches/:id` idempotente grava o documento final. O script `dev:api` carrega `json-server.middleware.cjs`, que converte o primeiro `PUT` de uma partida nova em `POST` (o JSON Server 0.17 não faz upsert nativo); tentativas seguintes substituem o mesmo documento.
- Histórico e ranking são derivados das partidas finalizadas; não há coleção de ranking.

## Limitações conhecidas

- A partida em andamento vive apenas em memória. Recarregar ou fechar o navegador descarta a sessão; nenhum registro órfão é criado.
- Não há autenticação, exclusão de participantes nem sorteio automático de papéis.
- A aplicação foi projetada para um único narrador local.

## Testes e qualidade

```bash
npm test
npm run lint
npm run build
```

Os testes unitários e de integração usam repositórios e clientes HTTP falsos; não exigem o JSON Server em execução.
