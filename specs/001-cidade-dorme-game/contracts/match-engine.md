# Contrato: Motor da Partida

**Feature**: `001-cidade-dorme-game`
**Módulo**: `src/entities/match/model/matchEngine.js`
**Tipo**: contrato de funções puras do domínio
**Dependências**: nenhuma de React, DOM, HTTP ou JSON Server

## 1. Princípios

- O motor recebe um `MatchSession` e retorna um novo `MatchSession`; não muta a entrada.
- Erros de regra são lançados como `GameRuleError` com `code` estável em inglês.
- O motor não conhece textos de interface, frases de sobreposição, componentes ou repositórios.
- O gerador de IDs é injetado na criação; as datas são recebidas pelos comandos que encerram a partida.
- O motor é responsável por toda decisão de fase, eliminação, vitória, turno e encerramento.
- O ViewModel pode orquestrar persistência depois de uma transição para `FINISHED`, mas não decide regras.

## 2. Tipos de entrada

```text
MatchConfiguration {
  participants: Array<{
    participantId: string,
    role: "INNOCENT" | "ASSASSIN" | "DETECTIVE"
  }>
}

MatchContext {
  matchId: string,
  startedAt: string,        // ISO
  idFactory: () => string   // para MatchParticipant.id
}

VoteResult =
  | { type: "ELIMINATION", participantId: string }
  | { type: "TIE" }
```

## 3. Comandos

### 3.1 `createMatchSession(configuration, context)`

Cria a sessão inicial.

**Validações**

- `participants.length >= 5` → senão `MIN_PARTICIPANTS`.
- Pelo menos um `ASSASSIN` → senão `NO_ASSASSIN`.
- Papéis válidos → senão `INVALID_ROLE`.
- `participantId` único → senão `DUPLICATE_PARTICIPANT`.
- Todos os IDs e o `matchId` presentes.

**Resultado**

```text
MatchSession {
  match: {
    id, status: "IN_PROGRESS", closureReason: null, winner: null,
    startedAt, endedAt: null, turnCount: 0, participants: [...]
  },
  phase: "TURN_START",
  currentTurn: 1,
  assassinTargets: {},
  investigations: {},
  nightResult: null,
  voteResult: null
}
```

Todos os `MatchParticipant` começam com `status: "ALIVE"` e `eliminatedAt: null`.

---

### 3.2 `dismissAnnouncement(session)`

Avança uma sobreposição.

**Fases aceitas e resultado**

| Fase atual | Próxima |
|---|---|
| `TURN_START` | `ASSASSINS_ANNOUNCEMENT` |
| `ASSASSINS_ANNOUNCEMENT` | `ASSASSINS_ACTIONS` |
| `DETECTIVES_ANNOUNCEMENT` | `DETECTIVES_ACTIONS` |
| `DAWN_ANNOUNCEMENT` | `DAWN_RESULT` |

Outras fases → `INVALID_PHASE`. A transição não altera participantes.

---

### 3.3 `setAssassinTarget(session, actorId, targetId | null)`

Registra ou limpa a escolha de um assassino no turno.

**Validações**

- Fase `ASSASSINS_ACTIONS` → senão `INVALID_PHASE`.
- `actorId` pertence à partida, tem `role = ASSASSIN` e `status = ALIVE` → senão `ACTOR_NOT_ALIVE` ou `INVALID_ACTOR_ROLE`.
- `targetId` é `null` ou pertence à partida com `status = ALIVE` → senão `TARGET_NOT_ALIVE`.
- `targetId !== actorId` → senão `TARGET_IS_SELF`.

**Resultado**: novo `assassinTargets` com a escolha; demais campos inalterados. O mesmo alvo pode ser escolhido por assassinos diferentes.

---

### 3.4 `resolveAssassinsPhase(session, endedAt)`

Processa todas as escolhas dos assassinos em conjunto. `endedAt` é usado somente se houver vitória.

**Validações**

- Fase `ASSASSINS_ACTIONS` → senão `INVALID_PHASE`.

**Processamento**

1. Coletar `targetId` não nulos de assassinos vivos.
2. Deduplicar.
3. Para cada alvo único vivo, marcar `DEAD` e `eliminatedAt = { turn: currentTurn, phase: "NIGHT" }`.
4. Registrar `nightResult.eliminatedParticipantIds`.
5. Avaliar vitória.

**Resultado**

- Se vitória: `match.status = FINISHED`, `closureReason = VICTORY`, `winner`, `endedAt` recebido pelo comando, `phase = FINISHED`, incrementa `turnCount`.
- Senão, se houver detetive vivo: `phase = DETECTIVES_ANNOUNCEMENT`.
- Senão: `phase = DAWN_ANNOUNCEMENT`.

As escolhas de assassinos que morreram nesta resolução continuam válidas. A fase dos detetives e a votação não ocorrem em caso de vitória.

---

### 3.5 `setInvestigation(session, detectiveId, targetId | null)`

Registra ou limpa a investigação de um detetive no turno.

**Validações**

- Fase `DETECTIVES_ACTIONS` → senão `INVALID_PHASE`.
- Ator pertence à partida, tem `role = DETECTIVE` e `status = ALIVE` → senão `ACTOR_NOT_ALIVE` ou `INVALID_ACTOR_ROLE`.
- Alvo é `null` ou pertence à partida com `status = ALIVE` → senão `TARGET_NOT_ALIVE`.
- Alvo diferente do ator → senão `TARGET_IS_SELF`.

**Resultado**: novo `investigations[detectiveId] = { targetId, revealedRole }` ou `null`. Nenhum status muda. O papel revelado é o `role` atual do alvo.

---

### 3.6 `resolveDetectivesPhase(session)`

Conclui a fase dos detetives.

**Validações**

- Fase `DETECTIVES_ACTIONS` → senão `INVALID_PHASE`.

**Resultado**: `phase = DAWN_ANNOUNCEMENT`. Nenhum participante muda de status e nenhuma vitória é reavaliada.

---

### 3.7 `startVoting(session)`

Avança do resultado do amanhecer para a votação.

**Validações**

- Fase `DAWN_RESULT` → senão `INVALID_PHASE`.

**Resultado**: `phase = VOTING`.

---

### 3.8 `registerVote(session, result, endedAt)`

Registra o resultado da votação presencial. `endedAt` é usado somente se houver vitória.

**Validações**

- Fase `VOTING` → senão `INVALID_PHASE`.
- `session.voteResult === null` → senão `VOTE_ALREADY_REGISTERED`.
- `result.type === "ELIMINATION"`: alvo pertence à partida e está `ALIVE` → senão `TARGET_NOT_ALIVE`; alvo diferente de morto.
- `result.type === "TIE"`: válido sem alvo.

**Processamento**

1. Registrar `voteResult`.
2. Se `ELIMINATION`, marcar `DEAD` e `eliminatedAt = { turn: currentTurn, phase: "VOTE" }`.
3. Avaliar vitória.
4. Incrementar `turnCount`.
5. Se vitória: `status = FINISHED`, `closureReason = VICTORY`, `winner`, `endedAt`, `phase = FINISHED`.
6. Senão: `currentTurn += 1`, `phase = TURN_START`, limpar dados temporários do turno.

Um empate não altera status. A avaliação de vitória ocorre mesmo em empate, mas não pode criar uma nova vitória sem mudança de vivos.

---

### 3.9 `finishManually(session, endedAt)`

Encerra a partida sem vencedor.

**Validações**

- `session.match.status !== "FINISHED"` → senão `MATCH_ALREADY_FINISHED`.

**Resultado**

- `status = FINISHED`
- `closureReason = MANUAL`
- `winner = null`
- `endedAt` informado
- `phase = FINISHED`
- Status dos participantes preservado
- `turnCount` inalterado (o turno em andamento não conta)

Permitido em qualquer fase, inclusive durante sobreposição, ações ou votação. Não elimina ninguém.

## 4. Seletores

Funções puras, sem efeitos:

```text
getAliveParticipants(session) -> MatchParticipant[]
getAliveAssassins(session) -> MatchParticipant[]
getAliveDetectives(session) -> MatchParticipant[]
getDeadParticipants(session) -> MatchParticipant[]
getEligibleTargets(session, actorId) -> MatchParticipant[]
getParticipantById(session, participantId) -> MatchParticipant | undefined
evaluateVictory(session) -> "INNOCENTS" | "ASSASSINS" | null
```

`getEligibleTargets` retorna vivos, excluindo o próprio ator. Para assassinos, inclui outros assassinos.

## 5. Códigos de erro

| Código | Condição |
|---|---|
| `MIN_PARTICIPANTS` | Menos de cinco participantes na configuração. |
| `NO_ASSASSIN` | Nenhum assassino na configuração. |
| `INVALID_ROLE` | Papel fora de `PlayerRole`. |
| `DUPLICATE_PARTICIPANT` | Mesmo `participantId` repetido. |
| `INVALID_PARTICIPANT` | Participante ausente ou desconhecido. |
| `INVALID_PHASE` | Comando não permitido na fase atual. |
| `INVALID_ACTOR_ROLE` | Ator não tem o papel exigido. |
| `ACTOR_NOT_ALIVE` | Ator morto ou inexistente. |
| `TARGET_NOT_ALIVE` | Alvo morto, inexistente ou inválido. |
| `TARGET_IS_SELF` | Ator escolheu a si mesmo. |
| `VOTE_ALREADY_REGISTERED` | Segundo resultado de votação no turno. |
| `MATCH_ALREADY_FINISHED` | Comando de jogo após o encerramento. |
| `INVALID_VOTE_RESULT` | Resultado de votação malformado. |

`GameRuleError` deve conter pelo menos `name`, `code` e `message` (mensagem técnica em inglês). O ViewModel mapeia o código para a mensagem em português exibida ao narrador.

## 6. Interação com persistência

O motor não persiste. O fluxo é:

```text
ViewModel --comando--> Engine --nova sessão--> ViewModel
                                              │
                                              ├─ se status === FINISHED e ainda não salvo
                                              ▼
                                  MatchRepository.saveFinishedMatch(match)
```

- A gravação ocorre uma vez por partida.
- Repetir a gravação é seguro (`PUT` idempotente).
- Falha de gravação não desfaz o estado `FINISHED`; o ViewModel exibe erro e permite nova tentativa.
- O motor nunca conhece o JSON Server.

## 7. Invariantes verificáveis em testes

1. Nenhum comando de jogo funciona em `FINISHED`.
2. Nenhum morto age, é alvo ou vota.
3. Nenhum ator escolhe a si mesmo.
4. Um alvo escolhido por vários assassinos morre uma vez.
5. A fase dos detetives é omitida sem detetives vivos.
6. A vitória interrompe o fluxo antes das etapas seguintes.
7. O encerramento manual não tem vencedor e não conta o turno em andamento.
8. O turno decisivo por vitória é contado (decisão D3).
9. `turnCount` só cresce.
10. As ações temporárias são limpas no novo turno.
