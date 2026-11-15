# Modelo de Dados: Cidade Dorme

**Feature**: `001-cidade-dorme-game`
**Data**: 2026-11-14
**Referências**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md)

## 1. Convenções

- Identificadores: UUID em string, gerados no cliente. O motor recebe um gerador de ID injetável para testes.
- Datas: strings ISO 8601 UTC, geradas por um relógio injetável.
- Enums: constantes JavaScript congeladas, com valores em `SCREAMING_SNAKE_CASE` e nomes técnicos em inglês.
- Tipos em JavaScript: documentados com JSDoc (`@typedef`), sem TypeScript.
- Campos opcionais são explicitamente `null` quando não se aplicam, para manter o documento previsível.
- O domínio usa nomes em inglês (`Participant`, `Match`, `MatchParticipant`, `PlayerRole`); a interface usa rótulos em português.
- Nenhum dado derivável é persistido, exceto o resultado declarado da partida (`winner`/`closureReason`), que é um fato histórico.

## 2. Enums

### PlayerRole

| Valor | Significado | Rótulo de interface |
|---|---|---|
| `INNOCENT` | Participante sem papel especial. | Inocente |
| `ASSASSIN` | Participante que escolhe alvos durante a noite. | Assassino |
| `DETECTIVE` | Participante que investiga um alvo por noite. | Detetive |

### PlayerStatus

| Valor | Significado | Rótulo |
|---|---|---|
| `ALIVE` | Participante vivo. | Vivo |
| `DEAD` | Participante eliminado. | Morto |

### MatchStatus

| Valor | Significado |
|---|---|
| `IN_PROGRESS` | Partida em condução, existente apenas em memória na estratégia atual. |
| `FINISHED` | Partida encerrada por vitória ou manualmente; é o único status persistido. |

### MatchWinner

| Valor | Significado | Rótulo |
|---|---|---|
| `INNOCENTS` | Inocentes e detetives venceram. | Inocentes e Detetives |
| `ASSASSINS` | Assassinos venceram. | Assassinos |

O campo `winner` da partida aceita também `null`, usado no encerramento manual.

### MatchClosureReason

| Valor | Significado |
|---|---|
| `VICTORY` | Encerrada automaticamente por condição de vitória. |
| `MANUAL` | Encerrada pelo narrador, sem vencedor. |

### MatchPhase

| Valor | Descrição | Sobreposição associada |
|---|---|---|
| `TURN_START` | Início do turno. | “Cidade Dorme” |
| `ASSASSINS_ANNOUNCEMENT` | Anúncio dos assassinos. | “Assassinos Acordem” |
| `ASSASSINS_ACTIONS` | Registro das escolhas dos assassinos. | — |
| `DETECTIVES_ANNOUNCEMENT` | Anúncio dos detetives. | “Detetives Acordem” |
| `DETECTIVES_ACTIONS` | Registro das investigações. | — |
| `DAWN_ANNOUNCEMENT` | Anúncio do amanhecer. | “Cidade Acorda” |
| `DAWN_RESULT` | Resultado das eliminações noturnas. | — |
| `VOTING` | Registro do resultado da votação. | — |
| `FINISHED` | Resultado final disponível. | — |

### EliminationPhase

| Valor | Significado |
|---|---|
| `NIGHT` | Eliminação decorrente das ações dos assassinos. |
| `VOTE` | Eliminação decorrente da votação. |

## 3. Entidades

### 3.1 Participant

Representa uma pessoa cadastrada e reutilizável em partidas.

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `id` | string (UUID) | sim | Único, imutável. |
| `name` | string | sim | Não vazio após `trim`; único sem diferenciar maiúsculas/minúsculas; exibido com a grafia informada. |

Regras:

- Não há exclusão no escopo.
- A edição altera apenas `name` e preserva `id`.
- A identidade é preservada no histórico; o nome exibido é sempre o atual.
- Não há data de criação nem outros metadados, pois não são exigidos.

Exemplo:

```json
{ "id": "2f8c...", "name": "Ana" }
```

### 3.2 Match

Representa uma partida e seu resultado.

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `id` | string (UUID) | sim | Gerado no início da sessão; usado no `PUT` idempotente. |
| `status` | MatchStatus | sim | `IN_PROGRESS` somente em memória; persistido como `FINISHED`. |
| `closureReason` | MatchClosureReason | ao encerrar | `VICTORY` ou `MANUAL`. |
| `winner` | MatchWinner \| null | ao encerrar | `null` quando `closureReason` é `MANUAL`. |
| `startedAt` | string ISO | sim | Momento de início da partida. |
| `endedAt` | string ISO \| null | ao encerrar | Momento do encerramento; `null` em andamento. |
| `turnCount` | integer ≥ 0 | sim | Turnos encerrados. Ver seção 7.2. |
| `participants` | MatchParticipant[] | sim | Um registro por participante selecionado; exatamente um papel por pessoa. |

Invariantes:

- `participants.length >= 5`.
- Existe pelo menos um `MatchParticipant` com `role = ASSASSIN`.
- Todos os participantes começam com `status = ALIVE`.
- Não pode haver dois `MatchParticipant` com o mesmo `participantId`.
- `FINISHED` exige `endedAt`, `closureReason` e a coerência de `winner`:
  - `VICTORY` → `winner` é `INNOCENTS` ou `ASSASSINS`;
  - `MANUAL` → `winner` é `null`.
- `turnCount` não diminui.

### 3.3 MatchParticipant

Representa a participação de um `Participant` em uma `Match`.

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `id` | string (UUID) | sim | Identificador da participação, único no documento da partida. |
| `participantId` | string (UUID) | sim | Referência a `Participant.id`; não duplica nome. |
| `role` | PlayerRole | sim | Exatamente um papel por participante. |
| `status` | PlayerStatus | sim | Inicia `ALIVE`; muda para `DEAD` uma única vez. |
| `eliminatedAt` | object \| null | sim | `null` se sobrevivente; senão `{ turn, phase }`. |

`eliminatedAt`:

| Campo | Tipo | Regras |
|---|---|---|
| `turn` | integer ≥ 1 | Número do turno em que ocorreu a eliminação. |
| `phase` | EliminationPhase | `NIGHT` ou `VOTE`. |

Invariantes:

- `status = DEAD` se e somente se `eliminatedAt` não for `null`.
- Uma eliminação é definitiva; não há ressurreição.
- Um participante não pode ser eliminado duas vezes.
- O papel não muda durante a partida.

Exemplo:

```json
{
  "id": "p-1",
  "participantId": "2f8c...",
  "role": "ASSASSIN",
  "status": "DEAD",
  "eliminatedAt": { "turn": 3, "phase": "VOTE" }
}
```

## 4. Relacionamentos

```text
Participant 1 ──── N MatchParticipant N ──── 1 Match
     │                                           │
     └──────── participantId (referência) ───────┘

Match 1 ──── N MatchParticipant (embutidos no documento persistido)
```

- Um participante pode participar de várias partidas.
- Uma partida tem vários participantes.
- O vínculo é representado por `MatchParticipant`.
- Não há relação entre partidas.
- O histórico usa o vínculo para reconstruir papéis e status final.
- O ranking usa o vínculo para contar sobrevivências.

## 5. Separação entre domínio, sessão e persistência

| Dado | Domínio | Sessão em memória | Persistido | Observação |
|---|---|---|---|---|
| Participantes cadastrados | sim | carregados | sim | Coleção `participants`. |
| Partida e seus participantes | sim | sim | somente ao encerrar | Documento `matches`. |
| Papéis e status final | sim | sim | sim | Embutidos na partida. |
| Turno atual | sim | sim | derivado | `turnCount + 1` durante a partida. |
| Escolhas de assassinos | não | sim | não | Restrição explícita. |
| Investigações e papel revelado | não | sim | não | Apenas para o narrador durante a partida. |
| Resultado da votação por turno | não | sim | não | Apenas o status final e `eliminatedAt`. |
| Resultado final e vencedor | sim | sim | sim | `winner`, `closureReason`, `endedAt`. |
| Ranking | derivado | derivado | não | Calculado sob demanda. |

## 6. Estado de sessão (não persistido)

```text
MatchSession {
  match: {
    id: string,
    status: "IN_PROGRESS" | "FINISHED",
    startedAt: string,
    endedAt: string | null,
    closureReason: "VICTORY" | "MANUAL" | null,
    winner: "INNOCENTS" | "ASSASSINS" | null,
    turnCount: number,
    participants: MatchParticipant[]
  },
  phase: MatchPhase,
  currentTurn: number,
  assassinTargets: Record<actorId, targetId | null>,
  investigations: Record<detectiveId, { targetId: string, revealedRole: PlayerRole } | null>,
  nightResult: { eliminatedParticipantIds: string[] } | null,
  voteResult: { type: "ELIMINATION", participantId: string } | { type: "TIE" } | null
}
```

Regras do estado de sessão:

- `assassinTargets` contém apenas assassinos vivos no turno corrente.
- `investigations` contém apenas detetives vivos no turno corrente.
- `nightResult` é preenchido após `ASSASSINS_ACTIONS` e usado em `DAWN_RESULT`.
- `voteResult` é preenchido após a votação, antes de encerrar o turno ou a partida.
- Ao iniciar um novo turno, `assassinTargets`, `investigations`, `nightResult` e `voteResult` são limpos.
- O estado de persistência (`idle`, `saving`, `saved`, `error`) fica no ViewModel, não no domínio.
- O diretório de nomes não faz parte do domínio persistido; a interface resolve `participantId` para nome.

## 7. Máquina de estados

### 7.1 Transições e comandos

| Fase atual | Comando | Validações | Próxima fase | Efeitos |
|---|---|---|---|---|
| — | `createMatchSession` | ≥ 5 participantes; ≥ 1 assassino; papéis válidos; IDs únicos. | `TURN_START` | Cria `MatchParticipant` com `ALIVE`; `turnCount = 0`; `currentTurn = 1`. |
| `TURN_START` | `dismissAnnouncement` | Fase correta. | `ASSASSINS_ANNOUNCEMENT` | Nenhum. |
| `ASSASSINS_ANNOUNCEMENT` | `dismissAnnouncement` | Fase correta. | `ASSASSINS_ACTIONS` | Nenhum. |
| `ASSASSINS_ACTIONS` | `setAssassinTarget` | Ator vivo e assassino; alvo vivo, diferente do ator ou `null`; fase correta. | `ASSASSINS_ACTIONS` | Atualiza a escolha do ator. |
| `ASSASSINS_ACTIONS` | `resolveAssassinsPhase` | Fase correta. | Vitória: `FINISHED`; senão detetives vivos: `DETECTIVES_ANNOUNCEMENT`; senão: `DAWN_ANNOUNCEMENT`. | Deduplica alvos, elimina, registra `nightResult`, avalia vitória. |
| `DETECTIVES_ANNOUNCEMENT` | `dismissAnnouncement` | Fase correta. | `DETECTIVES_ACTIONS` | Nenhum. |
| `DETECTIVES_ACTIONS` | `setInvestigation` | Ator vivo e detetive; alvo vivo, diferente do ator ou `null`; fase correta. | `DETECTIVES_ACTIONS` | Registra alvo e papel revelado. |
| `DETECTIVES_ACTIONS` | `resolveDetectivesPhase` | Fase correta. | `DAWN_ANNOUNCEMENT` | Nenhum status alterado. |
| `DAWN_ANNOUNCEMENT` | `dismissAnnouncement` | Fase correta. | `DAWN_RESULT` | Nenhum. |
| `DAWN_RESULT` | `startVoting` | Fase correta. | `VOTING` | Nenhum. |
| `VOTING` | `registerVote` | Fase correta; alvo vivo ou empate; nenhum voto anterior no turno. | Vitória: `FINISHED`; senão novo turno: `TURN_START`. | Elimina se houver alvo; registra `voteResult`; avalia vitória; incrementa `turnCount`; limpa dados do turno. |
| Qualquer fase não final | `finishManually` | Não estar em `FINISHED`. | `FINISHED` | `closureReason = MANUAL`; `winner = null`; preserva status; não incrementa `turnCount`. |
| `FINISHED` | Qualquer comando de jogo | — | erro `MATCH_ALREADY_FINISHED` | Nenhum. |

### 7.2 Contagem de turnos

- `turnCount` significa “turnos encerrados”.
- Início: `turnCount = 0`, `currentTurn = 1`.
- Um turno é encerrado quando:
  - a votação é registrada e a partida continua → incrementa e inicia o próximo turno;
  - a votação é registrada e há vitória → incrementa e encerra;
  - a noite produz vitória → incrementa o turno decisivo e encerra.
- Encerramento manual em qualquer fase → não incrementa o turno em andamento.
- A decisão de contar o turno decisivo de vitória noturna está pendente de aprovação (D3).

### 7.3 Vitória

```text
aliveAssassins = contagem de MatchParticipant com role ASSASSIN e status ALIVE
aliveInnocents = contagem com role INNOCENT e status ALIVE
aliveDetectives = contagem com role DETECTIVE e status ALIVE

se aliveAssassins == 0:
    winner = INNOCENTS
senão se aliveAssassins >= (aliveInnocents + aliveDetectives):
    winner = ASSASSINS
senão:
    partida continua
```

- A verificação ocorre após `resolveAssassinsPhase` e após `registerVote`.
- Não ocorre na criação da partida nem após a fase dos detetives, pois esta não altera vivos.
- Quando há vitória, o fluxo restante é interrompido.

## 8. Regras de configuração da partida

| Regra | Resultado |
|---|---|
| Menos de 5 participantes selecionados. | Bloqueio `MIN_PARTICIPANTS` com mensagem explicativa. |
| Nenhum assassino. | Bloqueio `NO_ASSASSIN` com mensagem explicativa. |
| Nenhum detetive. | Permitido; fase dos detetives omitida. |
| Participante com mais de um papel. | Bloqueio `DUPLICATE_PARTICIPANT`; a interface oferece um único papel por participante. |
| Papel explícito inválido. | Bloqueio `INVALID_ROLE`; ausência de papel especial é normalizada para `INNOCENT`. |
| Participante repetido na seleção. | Bloqueio `DUPLICATE_PARTICIPANT`. |
| Início com todos vivos. | Garantido pela criação. |

A configuração é uma lista de `{ participantId, role }` após atribuição manual. O papel `INNOCENT` é o padrão para todos os selecionados que não receberam papel especial.

## 9. Regras de ações, eliminações e votação

- **Assassino**: ator deve estar vivo, ter `role = ASSASSIN` e estar na partida. Alvo deve estar vivo, ser diferente do ator e estar na partida. Alvo pode ser outro assassino. Alvo `null` é permitido.
- **Detetive**: ator deve estar vivo, ter `role = DETECTIVE` e estar na partida. Alvo deve estar vivo, ser diferente do ator e estar na partida. Investigar não altera status. O papel revelado é registrado na sessão.
- **Deduplicação**: o conjunto de alvos dos assassinos é único; cada participante eliminado recebe `DEAD` e `eliminatedAt` uma única vez.
- **Simultaneidade**: todas as escolhas registradas são aplicadas juntas. A escolha de um assassino que morre na mesma resolução permanece válida (D5).
- **Votação**: aceita `{ type: "ELIMINATION", participantId }` com alvo vivo, ou `{ type: "TIE" }`. Não aceita participante morto, alvo ausente ou segundo resultado no mesmo turno.
- **Empate**: nenhum status muda; o turno é encerrado normalmente (ou a vitória é avaliada, sem mudança).
- **Limpeza**: ao iniciar um novo turno, todas as ações e resultados temporários são descartados.

## 10. Dados derivados

### 10.1 Sobreviventes de uma partida

Contagem de `MatchParticipant` com `status = ALIVE`. Não persistida.

### 10.2 Histórico

Para cada partida `FINISHED`:

- data de início e encerramento;
- participantes com nome atual, papel e status final;
- `turnCount`;
- `closureReason`;
- `winner` ou indicação de encerramento sem vencedor.

### 10.3 Ranking

```text
para cada Participant cadastrado:
    survivalCount = 0
para cada Match com status FINISHED:
    para cada MatchParticipant com status ALIVE:
        survivalCount[participantId] += 1
ordenar por survivalCount desc, depois name asc (pt-BR, sensitivity base)
```

- Partidas em andamento são ignoradas.
- Participantes com zero sobrevivências aparecem.
- A edição do nome reflete no ranking.
- O ranking não é persistido.

## 11. Mapeamento para `db.json`

```json
{
  "participants": [
    { "id": "uuid-ana", "name": "Ana" },
    { "id": "uuid-bruno", "name": "Bruno" }
  ],
  "matches": [
    {
      "id": "uuid-partida",
      "status": "FINISHED",
      "closureReason": "VICTORY",
      "winner": "ASSASSINS",
      "startedAt": "2026-11-14T20:00:00.000Z",
      "endedAt": "2026-11-14T20:31:00.000Z",
      "turnCount": 2,
      "participants": [
        {
          "id": "uuid-mp-1",
          "participantId": "uuid-ana",
          "role": "ASSASSIN",
          "status": "ALIVE",
          "eliminatedAt": null
        },
        {
          "id": "uuid-mp-2",
          "participantId": "uuid-bruno",
          "role": "INNOCENT",
          "status": "DEAD",
          "eliminatedAt": { "turn": 2, "phase": "VOTE" }
        }
      ]
    }
  ]
}
```

- `matches` contém apenas partidas finalizadas na estratégia atual.
- `participants` é a única fonte de nomes.
- Não há coleção de turnos, ações, investigações, votos ou ranking.
- Um `PUT /matches/:id` substitui o documento inteiro; a operação é idempotente.
- A validação de formato nas respostas é mínima; erros de leitura viram `ApiError`.

## 12. Invariantes globais

1. Todo `MatchParticipant.participantId` referencia um `Participant` existente no momento da criação.
2. Exatamente um papel por participante da partida.
3. Pelo menos um assassino por partida.
4. Pelo menos cinco participantes por partida.
5. Todos iniciam vivos.
6. `DEAD` é terminal e exige `eliminatedAt`.
7. Nenhum morto age, é alvo de ação noturna ou é eliminado na votação.
8. Nenhum participante age contra si mesmo.
9. Apenas um resultado de votação por turno.
10. Apenas uma partida em andamento por sessão.
11. Uma partida finalizada não aceita novos comandos.
12. Apenas partidas finalizadas entram no histórico e no ranking.
13. O vencedor é coerente com `closureReason`; manual não tem vencedor.
14. O nome de um participante é único no cadastro.
15. O turno em andamento não entra em `turnCount` no encerramento manual.

## 13. Decisões pendentes relacionadas

- **D1**: persistir `MatchParticipant` embutido em `Match`.
- **D2**: não recuperar sessão após recarregar/fechar.
- **D3**: contar o turno decisivo em vitória noturna.
- **D4**: unicidade de nome sem diferenciar maiúsculas/minúsculas.
- **D5**: ação de assassino morto na mesma noite ainda é aplicada.
- **D7**: não bloquear configuração com todos os assassinos.
