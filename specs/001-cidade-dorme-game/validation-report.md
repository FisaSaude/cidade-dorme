# Relatório de Validação — Fases 11 e 12

**Data**: 2026-11-16
**Escopo**: Polish & Cross-Cutting Concerns (T097–T104) e Validation (T105–T112)

## 1. Gates automatizados

| Comando | Resultado |
|---|---|
| `npm test` | 43 arquivos, 200 testes, todos verdes |
| `npm run lint` | Sem erros; 2 avisos pré-existentes de Fast Refresh em `MatchSessionProvider.jsx` |
| `npm run build` | Build de produção concluído com sucesso |

Os testes unitários e de integração usam clientes e repositórios falsos; nenhum depende do JSON Server em execução.

## 2. Evidências por cenário do quickstart

| Seção | Evidência automatizada |
|---|---|
| 4.1 Participantes | `tests/integration/participants.test.jsx` |
| 4.2 Configuração inválida | `tests/integration/matchSetup.test.jsx` |
| 4.3 Início e papéis | `tests/integration/matchSetup.test.jsx` |
| 4.4 Sobreposições | `tests/integration/nightPhases.test.jsx`, `tests/integration/accessibility.test.jsx` |
| 4.5 Ações dos assassinos | `tests/integration/nightPhases.test.jsx` |
| 4.6 Investigações | `tests/integration/nightPhases.test.jsx` |
| 4.7 Amanhecer e votação | `tests/integration/dawnAndVoting.test.jsx` |
| 4.8 Vitória | `tests/integration/resultPersistence.test.jsx` |
| 4.9 Encerramento manual | `tests/integration/manualClosure.test.jsx` |
| 4.10 Persistência, histórico e ranking | `tests/integration/history.test.jsx`, `tests/integration/ranking.test.jsx` |
| 4.11 Recarregamento durante a partida | `tests/integration/persistenceConsistency.test.jsx` |

A verificação visual de contraste, atmosfera e o tempo real de configuração (SC-001) exigem confirmação humana em navegador; os fluxos correspondentes estão cobertos por testes de integração e não há informação transmitida apenas por animação ou cor.

## 3. Contrato da API (JSON Server real, porta 3001)

Smoke test executado contra uma cópia temporária do `db.json`:

- `POST /participants` criou o participante; `PATCH /participants/:id` atualizou o nome.
- `PUT /matches/:id` criou a partida na primeira chamada e substituiu o mesmo documento na segunda, mantendo uma única partida.
- `GET /matches?status=FINISHED&_sort=endedAt&_order=desc` retornou 1 partida com `MatchParticipant` embutidos.
- `GET /turns` retornou `404`, confirmando a ausência de recursos de turnos/ações/votos/ranking.
- O proxy `/api` e o alias `@` permanecem configurados em `vite.config.js`.

### Divergência encontrada e corrigida

O JSON Server 0.17 responde `404` a `PUT /matches/:id` quando o ID ainda não existe, pois não faz upsert nativo. A aplicação gera o ID no cliente e depende desse comportamento. Foi adicionado `json-server.middleware.cjs`, carregado por `npm run dev:api`, que converte o primeiro `PUT` de uma partida nova em `POST /matches` preservando o ID; gravações seguintes continuam como `PUT` sobre o mesmo documento. Cobertura: `tests/unit/jsonServerMiddleware.test.js` e smoke test real acima.

## 4. Regras críticas verificadas

- Configuração com mínimo de cinco e ao menos um assassino.
- Sobreposições dispensadas por clique e teclado, com foco no diálogo.
- Ações noturnas, investigações e votos não persistidos individualmente.
- Vitória interrompe o fluxo e grava uma única vez.
- Encerramento manual sem vencedor e sem contar o turno em andamento.
- Histórico e ranking consideram apenas partidas finalizadas, incluindo zeros e desempate alfabético.
- Recarregar/abandonar partida em andamento não cria registro órfão.

## 5. Pendências aceitas

- SC-001 (configuração em até 3 minutos) e contraste visual WCAG AA: validação manual em navegador pós-entrega.
- SC-009 permanece como validação pós-entrega, conforme planejado.

---

# Validação Consolidada — Fase 12 (T105–T112)

## 6. Contratos (T105)

`contracts/match-engine.md` e `contracts/json-server-api.md` foram conferidos com o
motor, repositórios e cliente HTTP. Comandos, fases, payloads e status estão
alinhados: `createMatchSession`, `dismissAnnouncement`, `setAssassinTarget`,
`resolveAssassinsPhase`, `setInvestigation`, `resolveDetectivesPhase`,
`startVoting`, `registerVote` e `finishManually`; endpoints `GET/POST/PATCH
/participants`, `GET /matches?status=FINISHED...`, `GET /matches/:id` e
`PUT /matches/:id`.

**Divergência encontrada e corrigida**: o contrato §6 prevê `ApiError` com a
mensagem “Participante não encontrado” para `PATCH` de participante inexistente,
mas o `httpClient` retornava a mensagem genérica de `404`. O
`participantRepository.update` passou a traduzir esse caso, coberto por
`tests/unit/participantRepository.test.js`. Nenhuma divergência de comando,
fase, payload ou status permanece aberta.

## 7. Regras críticas (T106)

`npm test` — **43 arquivos, 201 testes, todos verdes** (nenhum depende do JSON
Server em execução).

| Regra crítica (plan §7.2) | Evidência |
|---|---|
| Configuração (mínimo, assassino, papéis, duplicidade) | `matchConfiguration.test.js`, `matchEngine.create.test.js`, `matchSetup.test.jsx` |
| Noite (sobreposições, ações, resolução conjunta) | `matchEngine.announcements.test.js`, `matchEngine.assassins.test.js`, `matchEngine.assassinsResolve.test.js`, `nightPhases.test.jsx` |
| Investigação | `matchEngine.detectives.test.js`, `nightPhases.test.jsx` |
| Votação e empate | `matchEngine.voting.test.js`, `dawnResult.test.js`, `dawnAndVoting.test.jsx` |
| Vitória automática | `victory.test.js`, `matchVictory.test.js`, `resultPersistence.test.jsx` |
| Encerramento manual | `matchEngine.manual.test.js`, `manualClosure.test.jsx` |
| Ranking e histórico | `ranking.test.js`, `historyViewModel.test.jsx`, `history.test.jsx`, `ranking.test.jsx` |
| Persistência e idempotência | `matchRepository.test.js`, `persistenceConsistency.test.jsx`, `resultPersistence.test.jsx` |

## 8. JSON Server real (T107)

Smoke test contra cópia temporária do `db.json` na porta `3001`, com o Vite em
`5173` servindo o proxy `/api`:

- `GET http://localhost:3001/participants` e `GET http://localhost:5173/api/participants` → `200` com array vazio (proxy remove `/api`).
- `POST /api/participants` → `201`; `PATCH /api/participants/:id` → `200` com nome atualizado.
- `PUT /api/matches/:id` (duas vezes, mesmo corpo) → documento único com 5 `MatchParticipant` embutidos; `GET /api/matches?status=FINISHED&_sort=endedAt&_order=desc` → 1 partida.
- `GET /turns` → `404`; `db.json` final com 1 participante e 1 partida, sem registros órfãos.
- O middleware `json-server.middleware.cjs` mantém o upsert idempotente exigido pelo contrato no JSON Server 0.17.

## 9. Quickstart e contratos (T108)

| Seção do quickstart | Evidência executada |
|---|---|
| 4.1 Participantes | `participants.test.jsx`, `participant.test.js`, `participantRepository.test.js` |
| 4.2 Configuração inválida | `matchSetup.test.jsx` |
| 4.3 Início e papéis | `matchSetup.test.jsx`, `matchEngine.create.test.js` |
| 4.4 Sobreposições | `nightPhases.test.jsx`, `accessibility.test.jsx` |
| 4.5 Ações dos assassinos | `matchEngine.assassins*.test.js`, `nightPhases.test.jsx` |
| 4.6 Investigações | `matchEngine.detectives.test.js`, `nightPhases.test.jsx` |
| 4.7 Amanhecer e votação | `dawnAndVoting.test.jsx`, `matchEngine.voting.test.js` |
| 4.8 Vitória automática | `matchVictory.test.js`, `resultPersistence.test.jsx` |
| 4.9 Encerramento manual | `manualClosure.test.jsx`, `matchEngine.manual.test.js` |
| 4.10 Persistência, histórico e ranking | `history.test.jsx`, `ranking.test.jsx`, `resultPersistence.test.jsx` |
| 4.11 Recarregamento durante a partida | `persistenceConsistency.test.jsx` |
| 5.1 Contrato da API | smoke test real da seção 8 |
| 5.2 Contrato do motor | `architecture.test.js` e testes de fase/erro do motor |

## 10. SC-001, SC-011 e sobreposições (T109)

- **SC-001**: os fluxos automatizados de configuração (4 cenários de
  `matchSetup.test.jsx`) concluíram entre 442 ms e 696 ms, muito abaixo do
  orçamento de 3 minutos. A medição com narrador humano em navegador permanece
  como confirmação pós-entrega.
- **SC-011**: contrastes calculados pelos tokens do tema escuro (WCAG AA, texto
  normal ≥ 4,5:1): texto `#e8e3d8` sobre fundo profundo `#06060a` = 15,81:1;
  texto sobre superfície `#1a1a24` = 13,48:1; texto suave `#a49f95` sobre
  superfície = 6,55:1; título `#f4efe4` sobre fundo = 17,64:1; texto de botão
  `#fdf6ee` sobre primário `#a01f2e` = 7,18:1 e sobre perigo `#c04040` = 4,84:1;
  erro `#e88b8b` sobre superfície = 6,98:1. Anel de foco `#c5303f` sobre fundo =
  3,62:1 (≥ 3:1 para componente não textual). Nenhum estado depende apenas de
  cor ou animação.
- **Sobreposições**: `accessibility.test.jsx` e `nightPhases.test.jsx` confirmam
  `role="dialog"`, `aria-modal`, foco no diálogo, dispensa por Enter/clique e
  `stopPropagation` no botão de encerramento.

## 11. Decisões D3/D5/D7 (T110)

- **D3** — turno decisivo contabilizado: `matchVictory.test.js` verifica
  `turnCount` incrementado em vitória noturna e na votação; `matchEngine.manual.test.js`
  verifica que o encerramento manual não incrementa.
- **D5** — ação de assassino eliminado na mesma noite aplicada:
  `matchEngine.assassinsResolve.test.js` (“mantém escolha de assassino que também
  morre na mesma resolução”).
- **D7** — configuração com todos os assassinos permitida:
  `matchEngine.create.test.js` (“permite configuração com todos os assassinos (D7)”).

## 12. Gates finais (T111)

| Comando | Resultado |
|---|---|
| `npm test` | 43 arquivos, 201 testes verdes |
| `npm run lint` | Sem erros; 2 avisos pré-existentes de Fast Refresh em `MatchSessionProvider.jsx` |
| `npm run build` | Build de produção concluído (105 módulos) |
| `tests/unit/architecture.test.js` | Motor sem React/`fetch`/repositórios e limites FSD respeitados |

## 13. Checklists (T112)

- `checklists/requirements.md`: 16/16 critérios revisados e satisfeitos.
- `checklists/validation.md`: 29/30 critérios revisados e satisfeitos; **CHK025
  (SC-001 medido por narrador humano)** permanece como confirmação manual
  pós-entrega, junto de SC-009.
- Nenhuma divergência de contrato aberta.
