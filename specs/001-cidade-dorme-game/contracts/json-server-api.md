# Contrato: API do JSON Server

**Feature**: `001-cidade-dorme-game`
**Tipo**: API HTTP local simulada
**Base do cliente**: `/api`
**Servidor real**: JSON Server em `http://localhost:3001`
**Formato**: JSON

## 1. Visão geral

O cliente acessa `/api/*`. O Vite faz proxy para o JSON Server, removendo o prefixo `/api`. Exemplo:

```text
Cliente:  GET /api/participants
JSON Server: GET http://localhost:3001/participants
```

O contrato usa IDs UUID fornecidos pelo cliente. Não há autenticação. A API é de uso local e não deve ser exposta publicamente.

## 2. Recursos

```text
participants: Participant[]
matches: Match[]        # somente partidas finalizadas na estratégia atual
```

Não existem recursos para turnos, ações noturnas, investigações, votos ou ranking.

## 3. Participant

```json
{
  "id": "2f8c9e6a-1b2c-4d5e-8f90-123456789abc",
  "name": "Ana"
}
```

Validações do cliente:

- `id`: UUID.
- `name`: string não vazia após `trim`, única sem diferenciar maiúsculas/minúsculas.

## 4. Match

```json
{
  "id": "7c1f3d20-9a8b-4c6d-8e2f-abcdef123456",
  "status": "FINISHED",
  "closureReason": "VICTORY",
  "winner": "INNOCENTS",
  "startedAt": "2026-11-14T20:00:00.000Z",
  "endedAt": "2026-11-14T20:35:00.000Z",
  "turnCount": 3,
  "participants": [
    {
      "id": "a1b2c3d4-e5f6-4a7b-8c9d-0123456789ab",
      "participantId": "2f8c9e6a-1b2c-4d5e-8f90-123456789abc",
      "role": "INNOCENT",
      "status": "ALIVE",
      "eliminatedAt": null
    },
    {
      "id": "b2c3d4e5-f6a7-4b8c-9d0e-123456789abc",
      "participantId": "3a9d0f7b-2c3d-4e5f-9a0b-abcdef123456",
      "role": "ASSASSIN",
      "status": "DEAD",
      "eliminatedAt": { "turn": 3, "phase": "VOTE" }
    }
  ]
}
```

- `status`: `FINISHED` nos documentos persistidos.
- `closureReason`: `VICTORY` ou `MANUAL`.
- `winner`: `INNOCENTS`, `ASSASSINS` ou `null` (manual).
- `turnCount`: inteiro ≥ 0.
- `participants`: um ou mais `MatchParticipant`.
- Os nomes não são duplicados; apenas `participantId` é armazenado.

## 5. Endpoints

### 5.1 Listar participantes

```http
GET /api/participants
```

Resposta `200`:

```json
[
  { "id": "uuid-1", "name": "Ana" },
  { "id": "uuid-2", "name": "Bruno" }
]
```

O cliente ordena alfabeticamente para exibição.

### 5.2 Criar participante

```http
POST /api/participants
Content-Type: application/json

{
  "id": "uuid-1",
  "name": "Ana"
}
```

Resposta `201` com o participante criado.

Erros de regra: o JSON Server não valida nome único. O cliente bloqueia antes do envio. Falha de rede/formato vira `ApiError`.

### 5.3 Editar participante

```http
PATCH /api/participants/:id
Content-Type: application/json

{
  "name": "Ana Maria"
}
```

Resposta `200` com o participante atualizado.

- O cliente valida nome obrigatório e único, excluindo o próprio registro.
- O `id` não é alterado.
- O vínculo com partidas antigas permanece porque as partidas referenciam `participantId`.

### 5.4 Listar partidas finalizadas

```http
GET /api/matches?status=FINISHED&_sort=endedAt&_order=desc
```

Resposta `200`: array de `Match`.

Usado pelo histórico e pelo ranking. O cliente deve ignorar defensivamente qualquer documento cujo `status` não seja `FINISHED`.

### 5.5 Consultar partida

```http
GET /api/matches/:id
```

Resposta `200`: um `Match`.
Resposta `404`: partida inexistente.

Usado no detalhe do histórico. O histórico também pode usar os dados já carregados pela listagem.

### 5.6 Gravar partida finalizada

```http
PUT /api/matches/:id
Content-Type: application/json

{ ...Match... }
```

Resposta `200` (substituído) ou `201` (criado).

- O `id` é gerado no início da partida e enviado no corpo e na URL.
- A operação é um upsert idempotente: repetir com o mesmo corpo não duplica a partida.
- Deve ser chamada apenas quando a partida estiver `FINISHED`.
- O documento inclui os `MatchParticipant` embutidos.
- Se falhar, o cliente mantém o resultado em tela e oferece “Tentar novamente”.

### 5.7 Diagnóstico de existência

```http
GET /api/matches/:id
```

Pode ser usado para verificar se uma gravação anterior já existe. Não é necessário no fluxo normal, pois `PUT` é idempotente.

## 6. Códigos e tratamento de erros

| Situação | HTTP esperado | Tratamento no cliente |
|---|---|---|
| Leitura bem-sucedida | `200` | Resposta usada. |
| Criação bem-sucedida | `201` | Item atualizado na lista. |
| Participante inexistente no `PATCH` | `404` | `ApiError` com mensagem “Participante não encontrado”. |
| Partida inexistente no `GET` | `404` | `ApiError`/estado vazio no histórico. |
| JSON inválido ou erro interno | `400`/`500` | `ApiError` genérico com opção de nova tentativa. |
| Servidor indisponível | erro de rede | `ApiError` de conexão; instrução para iniciar o JSON Server. |

O cliente encapsula todas as chamadas em `shared/api/httpClient.js`:

- verifica `response.ok`;
- lança `ApiError` com `status` e mensagem segura;
- não expõe detalhes internos ao narrador;
- usa `VITE_API_BASE_URL` como override opcional, com padrão `/api`.

## 7. Regras que não pertencem à API

- Quantidade mínima de participantes.
- Existência de assassino.
- Atribuição de papéis.
- Ordem das fases.
- Processamento de eliminações.
- Condições de vitória.
- Cálculo de ranking.
- Unicidade de nome (validada no cliente).

Essas regras ficam no domínio e no ViewModel, nunca no JSON Server.

## 8. Limitações

- Sem autenticação e sem autorização.
- Sem transações entre recursos; mitigado pelo documento de partida embutido.
- Sem constraint de unicidade de nome.
- Sem validação de esquema.
- Sem paginação; volume pequeno.
- Alterações são gravadas em `db.json`; o arquivo é a fonte persistida local.
- O servidor deve ser iniciado separadamente ou via script `dev:all`.
