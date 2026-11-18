---
description: "Lista de tarefas para implementação do Cidade Dorme"
---

# Tasks: Cidade Dorme — Aplicação de Apoio ao Narrador

**Input**: Documentos de design em `specs/001-cidade-dorme-game/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/json-server-api.md`, `contracts/match-engine.md`, `quickstart.md`, `.specify/memory/constitution.md`

**Tests**: Incluídos. A especificação e as orientações exigem testes das regras de negócio, dos fluxos críticos e dos ViewModels. Os testes de domínio devem ser escritos antes da implementação correspondente.

**Organization**: Tarefas agrupadas por história de usuário, na ordem de prioridade do `spec.md`. Fases de Setup, Foundational e Polish não recebem rótulo de história.

**Atualização 2026-11-17**: as Fases 14–20 registram o delta aprovado na spec revisada (exclusões, seleção padrão/em massa, ponto único de encerramento, vitória dos assassinos com status em massa e ranking com arquivados). T053 e T085 foram superadas por T143–T147; a Fase 14 substitui as notas antigas sobre ausência de exclusão.

**Atualização 2026-11-17 (correção de UI)**: a Fase 21 corrige a exibição de elementos concorrentes durante os pop-ups de tela cheia (anúncios "Cidade Dorme", "Assassinos Acordem", "Detetives Acordem" e "Cidade Acorda"). Ela isola a sobreposição em portal, dedica camadas de empilhamento para conteúdo, anúncio, ponto único de encerramento e confirmação, e garante que apenas o `FinishMatchButton` permaneça acessível durante o anúncio.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode executar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta).
- **[Story]**: US1–US8, conforme `spec.md`.
- Todos os caminhos são relativos à raiz do repositório.
- Nomenclatura técnica em inglês; textos de interface e documentação em português brasileiro.

## Path Conventions

Projeto único SPA: código em `src/` (FSD + MVVM), testes em `tests/unit` e `tests/integration`, fixtures em `tests/fixtures`, persistência em `db.json`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: preparar dependências, scripts, proxy, aliases e infraestrutura de testes definidos no plano.

- [X] T001 Instalar em `package.json` as dependências de desenvolvimento `json-server`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event` e `concurrently`, verificando compatibilidade com Vite 8, React 19 e Node 24.
- [X] T002 Adicionar em `package.json` os scripts `dev:api` (`json-server --watch db.json --port 3001`), `dev:all` (JSON Server + Vite com `concurrently`), `test` (`vitest run`) e `test:watch` (`vitest`).
- [X] T003 Configurar em `vite.config.js` o proxy de `/api` para `http://localhost:3001` removendo o prefixo `/api`, e o alias `@` apontando para `src`.
- [X] T004 [P] Criar `jsconfig.json` com o mapeamento de caminho `@/*` para `src/*`, alinhado ao alias do Vite.
- [X] T005 [P] Configurar o Vitest em `vite.config.js` com ambiente `jsdom` e `setupFiles: ['./tests/setup.js']`, e criar `tests/setup.js` com limpeza da Testing Library e imports explícitos de `describe`, `it`, `expect` e `vi` quando necessário.
- [X] T006 [P] Criar `db.json` na raiz com `{ "participants": [], "matches": [] }` como fonte persistida observada pelo JSON Server.

**Checkpoint**: `npm install`, `npm run dev:api`, `npm run dev` e `npm test` operacionais.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: infraestrutura compartilhada, enums do domínio, motor de vitória, seletores de sessão e shell da aplicação. Sem esta fase nenhuma história pode ser implementada corretamente.

**CRITICAL**: concluir esta fase antes das histórias.

- [X] T007 [P] Implementar `src/shared/lib/errors.js` com `GameRuleError` contendo `name`, `code` em inglês e `message` técnica, e `ApiError` com `status` e mensagem segura, conforme `contracts/match-engine.md` e `contracts/json-server-api.md`.
- [X] T008 Implementar `src/shared/api/httpClient.js` usando `VITE_API_BASE_URL` ou `/api`, cabeçalhos JSON, verificação de `response.ok`, lançamento de `ApiError` e leitura de JSON; cobrir com `tests/unit/httpClient.test.js` usando `fetch` falso para sucesso, `404`, `500` e erro de rede.
- [X] T009 [P] Implementar `src/shared/lib/id.js` com `crypto.randomUUID()` e fallback, e `src/shared/lib/date.js` com geração de ISO 8601 UTC e formatação pt-BR; cobrir com `tests/unit/idDate.test.js`.
- [X] T010 [P] Implementar `src/shared/config/env.js` e `src/shared/config/labels.js` com rótulos em português para `PlayerRole`, `PlayerStatus`, `MatchPhase`, `MatchWinner`, `MatchClosureReason` e mapa inicial de códigos de erro para mensagens; cobrir com `tests/unit/labels.test.js`.
- [X] T011 [P] Implementar `src/shared/ui/Button.jsx`, `src/shared/ui/TextField.jsx` e `src/shared/ui/SelectField.jsx` como componentes apresentacionais acessíveis, com `label`, estado `disabled`, mensagem de erro e callbacks; sem regra de negócio.
- [X] T012 [P] Implementar `src/shared/ui/Alert.jsx`, `src/shared/ui/EmptyState.jsx`, `src/shared/ui/LoadingState.jsx` e `src/shared/ui/ConfirmDialog.jsx` com semântica ARIA, ações de confirmar/cancelar e sem conhecimento do domínio.
- [X] T013 Implementar `src/app/styles/tokens.css`, `src/app/styles/global.css` e `src/app/styles/animations.css` com tokens dark/sombrios, tipografia serifada para títulos, foco visível, vinheta/névoa em CSS e `prefers-reduced-motion`; validar com `npm run build`.
- [X] T014 Implementar `src/app/navigation/screens.js` e `src/app/navigation/useAppNavigation.js` com tela ativa, parâmetros simples e bloqueio de nova partida quando houver sessão ativa; cobrir com `tests/unit/useAppNavigation.test.jsx`.
- [X] T015 Substituir o conteúdo de demonstração: criar `src/app/App.jsx` com shell, cabeçalho e tela ativa; atualizar `src/main.jsx` e `index.html`; remover apenas `src/App.css`, `src/index.css` e assets de demo não reaproveitados, preservando `vite.config.js` e `public/`; validar com `npm run build`.
- [X] T016 [P] Implementar `src/entities/match-participant/model/playerRole.js` e `src/entities/match-participant/model/playerStatus.js` como enums congelados exatamente com `INNOCENT`, `ASSASSIN`, `DETECTIVE` e `ALIVE`, `DEAD`.
- [X] T017 [P] Implementar `src/entities/match-participant/model/matchParticipant.js` com factory que cria `{ id, participantId, role, status: "ALIVE", eliminatedAt: null }` e helpers de eliminação; cobrir com `tests/unit/matchParticipant.test.js` as invariantes: `status = DEAD` se e somente se `eliminatedAt` não for `null`; papel imutável; `eliminatedAt = { turn: integer >= 1, phase: "NIGHT" | "VOTE" }`.
- [X] T018 [P] Implementar `src/entities/match/model/matchPhases.js` com `MatchPhase` e `EliminationPhase` congelados e o mapa de transições de sobreposição; cobrir com `tests/unit/matchPhases.test.js` as transições permitidas e `INVALID_PHASE`.
- [X] T019 Implementar `src/entities/match/model/victory.js` com `evaluateVictory(session)` na ordem: zero assassinos vivos → `INNOCENTS`; assassinos vivos ≥ inocentes vivos + detetives vivos → `ASSASSINS`; caso contrário `null`; cobrir com `tests/unit/victory.test.js` os cenários de último assassino, paridade, superioridade, partida em continuação e prioridade da primeira condição.
- [X] T020 Implementar `src/entities/match/model/matchSession.js` com `getAliveParticipants`, `getAliveAssassins`, `getAliveDetectives`, `getDeadParticipants`, `getParticipantById` e `getEligibleTargets(session, actorId)`; cobrir com `tests/unit/matchSessionSelectors.test.js` que mortos não são elegíveis, o ator não é elegível e assassinos podem ter outros assassinos como alvo.
- [X] T021 [P] Implementar `src/shared/lib/useAsyncData.js` com estados `loading`, `error`, `data` e `retry` para carregamentos de participantes e partidas; cobrir com `tests/unit/useAsyncData.test.jsx`.
- [X] T022 [P] Criar `tests/fixtures/sessionBuilder.js` com fábrica de sessões e partidas válidas (≥ 5 participantes, ≥ 1 assassino) e sobrescritas parciais, para reutilização nos testes de domínio e ViewModel.
- [X] T023 Implementar `src/app/providers/AppProviders.jsx` recebendo serviços injetáveis (`idFactory`, `now`, repositórios e sobrescritas para testes) e expondo-os por Context; cobrir com `tests/unit/AppProviders.test.jsx` a injeção e os valores padrão.

**Checkpoint**: domínio de enums, vitória e seletores testados; shell, tema e serviços compartilhados prontos.

---

## Phase 3: User Story 1 — Gerenciar participantes (Priority: P1)

**Goal**: cadastrar, listar e editar participantes com nome obrigatório e único, persistindo no JSON Server.

**Independent Test**: cadastrar três participantes, editar um nome e verificar a lista atualizada; tentar duplicar nome e confirmar bloqueio com mensagem; recarregar e confirmar persistência.

### Tests for User Story 1

- [X] T024 [P] [US1] Escrever `tests/unit/participant.test.js` para `name` obrigatório e não vazio após `trim`, unicidade sem diferenciar maiúsculas/minúsculas, preservação da grafia informada e preservação de `id` na edição.
- [X] T025 [P] [US1] Escrever `tests/unit/participantRepository.test.js` cobrindo `GET /participants`, `POST /participants` com UUID gerado no cliente, `PATCH /participants/:id`, validação mínima da resposta e `ApiError` em falhas.
- [X] T026 [US1] Escrever `tests/unit/useParticipantsViewModel.test.jsx` cobrindo carregamento, criação, edição, nome obrigatório, nome duplicado e tradução de códigos de erro para mensagens em português.

### Implementation for User Story 1

- [X] T027 [P] [US1] Implementar `src/entities/participant/model/participant.js` com normalização por `trim`, validação de nome obrigatório, detecção de duplicado sem diferenciar maiúsculas/minúsculas com exclusão do próprio `id`, preservando a grafia informada.
- [X] T028 [US1] Implementar `src/entities/participant/api/participantRepository.js` com `list`, `create` e `update` via `httpClient`, UUID gerado no cliente, validação mínima de formato e `ApiError`; exportar pela API pública `src/entities/participant/index.js`.
- [X] T029 [P] [US1] Implementar `src/entities/participant/ui/ParticipantName.jsx` como componente apresentacional do nome do participante.
- [X] T030 [US1] Implementar `src/features/participant-form/model/participantForm.js` e `src/features/participant-form/ui/ParticipantForm.jsx` com criação/edição, campos obrigatórios, mensagens em português e ações de salvar/cancelar, sem decidir regra de jogo.
- [X] T031 [US1] Implementar `src/widgets/participants-table/ParticipantsTable.jsx` e estilos com lista, ação de editar, estado vazio e estado de carregamento.
- [X] T032 [US1] Implementar `src/pages/participants/useParticipantsViewModel.js` com `useAsyncData`, estado do formulário, criação, edição, bloqueio de duplicado/obrigatório, mensagens pt-BR e recarga da lista.
- [X] T033 [US1] Implementar `src/pages/participants/ParticipantsPage.jsx` compondo tabela, formulário, alertas e estado vazio; a View apenas renderiza `viewState` e despacha `actions`.
- [X] T034 [US1] Estender `src/app/providers/AppProviders.jsx` com `participantRepository` e integrar `ParticipantsPage` ao shell/navegação em `src/app/App.jsx`.
- [X] T035 [US1] Escrever `tests/integration/participants.test.jsx` cobrindo estado vazio, criação, edição, bloqueio de duplicado com mensagem e manutenção do mesmo ID após edição, usando repositório falso; incluir preservação do vínculo de um participante usado em duas partidas finalizadas distintas.

**Checkpoint**: US1 funcional e testável sem depender de partidas.

---

## Phase 4: User Story 2 — Configurar uma nova partida (Priority: P1)

**Goal**: selecionar participantes, atribuir papéis manualmente, validar mínimo de cinco e ao menos um assassino, e iniciar a sessão com inocentes padrão e todos vivos.

**Independent Test**: selecionar cinco participantes, atribuir um assassino e um detetive, iniciar e confirmar exatamente um papel por participante, demais inocentes e todos vivos; bloquear quatro participantes e configuração sem assassino.

### Tests for User Story 2

- [X] T036 [P] [US2] Escrever `tests/unit/matchConfiguration.test.js` cobrindo `MIN_PARTICIPANTS` para menos de cinco, `NO_ASSASSIN`, `DUPLICATE_PARTICIPANT`, `INVALID_ROLE`, papel ausente normalizado para `INNOCENT` e um único papel por `participantId`.
- [X] T037 [P] [US2] Escrever `tests/unit/matchEngine.create.test.js` cobrindo a sessão inicial com `phase = TURN_START`, `currentTurn = 1`, `turnCount = 0`, `status = IN_PROGRESS`, todos `ALIVE` com `eliminatedAt: null`, `MatchParticipant.id` únicos e rejeição de configurações inválidas pelos códigos do contrato. Incluir configuração com todos os participantes assassinos resultando em vitória dos assassinos após a primeira resolução noturna (D7).
- [X] T038 [US2] Escrever `tests/unit/useMatchSetupViewModel.test.jsx` cobrindo seleção, atribuição de um papel por participante, contagens, bloqueios traduzidos em português e início de sessão válida.

### Implementation for User Story 2

- [X] T039 [US2] Implementar `src/entities/match/model/matchConfiguration.js` construindo a configuração `{ participants: [{ participantId, role }] }`, aplicando `INNOCENT` como padrão e validando as regras da seção 8 de `data-model.md`.
- [X] T040 [US2] Implementar `createMatchSession(configuration, context)` em `src/entities/match/model/matchEngine.js` validando `participants.length >= 5`, pelo menos um `ASSASSIN`, papéis válidos e `participantId` único; criar `Match` com `turnCount = 0`, `currentTurn = 1`, todos `ALIVE` e `eliminatedAt: null`; exportar por `src/entities/match/index.js`.
- [X] T041 [US2] Implementar `src/features/match-configuration/model/matchSetup.js` e `src/features/match-configuration/ui/MatchSetupForm.jsx` com seleção de participantes, seletor único de papel por participante, resumo de contagens e mensagens de bloqueio; sem sorteio.
- [X] T042 [US2] Implementar `src/pages/match-setup/useMatchSetupViewModel.js` carregando participantes, gerenciando seleção/papéis, chamando a validação do domínio, traduzindo `GameRuleError` e iniciando a partida.
- [X] T043 [US2] Implementar `src/pages/match-setup/MatchSetupPage.jsx` com formulário, resumo, botão de início desabilitado por bloqueio, mensagens explicativas e navegação para a partida.
- [X] T044 [US2] Implementar `src/app/providers/MatchSessionProvider.jsx` com estado da sessão, `startMatch(configuration)` usando `createMatchSession`, `idFactory` e `now` injetados, e indicação de sessão ativa; cobrir com `tests/unit/MatchSessionProvider.test.jsx`.
- [X] T045 [US2] Criar `src/pages/live-match/LiveMatchPage.jsx` mínimo exibindo turno e fase da sessão criada e bloquear nova configuração enquanto houver sessão ativa, integrando `useAppNavigation` ao provider.
- [X] T046 [US2] Escrever `tests/integration/matchSetup.test.jsx` cobrindo bloqueio com menos de cinco, bloqueio sem assassino, configuração sem detetive permitida, início válido com inocentes e todos vivos, e ausência de sorteio automático.

**Checkpoint**: US2 funcional com sessão iniciada em memória e tela mínima de partida.

---

## Phase 5: User Story 3 — Conduzir as etapas noturnas do turno (Priority: P1)

**Goal**: apresentar sobreposições na ordem correta, registrar ações opcionais de assassinos e investigações de detetives, processar eliminações conjuntas e omitir detetives quando não houver nenhum vivo.

**Independent Test**: conduzir "Cidade Dorme", "Assassinos Acordem" e "Detetives Acordem", registrar ações opcionais, verificar alvos elegíveis, revelação de papel e ausência de mortos como executores/alvos.

### Tests for User Story 3

- [X] T047 [P] [US3] Escrever `tests/unit/matchEngine.announcements.test.js` cobrindo as quatro transições de `dismissAnnouncement`, rejeição com `INVALID_PHASE` em outras fases e ausência de mudança de status.
- [X] T048 [P] [US3] Escrever `tests/unit/matchEngine.assassins.test.js` cobrindo alvo `null`, ator morto (`ACTOR_NOT_ALIVE`), papel inválido (`INVALID_ACTOR_ROLE`), alvo morto (`TARGET_NOT_ALIVE`), alvo igual ao ator (`TARGET_IS_SELF`), alvo assassino permitido e mesmo alvo escolhido por assassinos diferentes.
- [X] T049 [P] [US3] Escrever `tests/unit/matchEngine.assassinsResolve.test.js` cobrindo alvo repetido eliminado uma vez, alvos distintos, escolha de assassino morto na mesma resolução preservada, `nightResult`, próxima fase com detetive vivo, omissão sem detetive vivo e vitória interrompendo antes dos detetives e da votação.
- [X] T050 [P] [US3] Escrever `tests/unit/matchEngine.detectives.test.js` cobrindo `setInvestigation` com papel revelado, sem alteração de status, alvo `null`, detetive morto, alvo igual ao ator, alvo morto e `resolveDetectivesPhase` avançando para `DAWN_ANNOUNCEMENT`.
- [X] T051 [US3] Escrever `tests/unit/announcements.test.js` cobrindo o mapa exato: `TURN_START` → "Cidade Dorme", `ASSASSINS_ANNOUNCEMENT` → "Assassinos Acordem", `DETECTIVES_ANNOUNCEMENT` → "Detetives Acordem", `DAWN_ANNOUNCEMENT` → "Cidade Acorda".
- [X] T052 [US3] Escrever `tests/integration/nightPhases.test.jsx` cobrindo sobreposição em tela cheia com `role="dialog"`, avanço apenas por ação explícita (clique ou teclado), executores/alvos apenas vivos, revelação do papel ao narrador, ação opcional e fase dos detetives omitida.

### Implementation for User Story 3

- [X] T053 [P] [US3] Implementar `src/shared/ui/SpecialOverlay.jsx` com `position: fixed; inset: 0`, `role="dialog"`, `aria-modal="true"`, dispensa por clique/Enter/Espaço e animações desativadas por `prefers-reduced-motion`. (O slot `footerAction` original foi removido por T140; o overlay voltou a ser apenas dispensável.)
- [X] T054 [US3] Implementar `src/features/special-announcement/model/announcements.js` e `src/features/special-announcement/ui/SpecialAnnouncement.jsx`, mantendo as frases fora do motor.
- [X] T055 [US3] Implementar `dismissAnnouncement(session)` em `src/entities/match/model/matchEngine.js` com transições permitidas e erro `INVALID_PHASE`.
- [X] T056 [US3] Implementar `setAssassinTarget` e `resolveAssassinsPhase` em `src/entities/match/model/matchEngine.js`: validar fase/ator/alvo, deduplicar alvos, eliminar cada alvo uma única vez com `eliminatedAt = { turn: currentTurn, phase: "NIGHT" }`, preencher `nightResult.eliminatedParticipantIds`, avaliar vitória; se houver vitória, definir `status = FINISHED`, `closureReason = VICTORY`, `winner`, `endedAt` recebido, `phase = FINISHED` e incrementar `turnCount` (D3); senão, seguir para detetives ou amanhecer, omitindo a fase sem detetives vivos.
- [X] T057 [US3] Implementar `setInvestigation` e `resolveDetectivesPhase` em `src/entities/match/model/matchEngine.js`: validar detetive vivo e alvo vivo diferente do ator, registrar `{ targetId, revealedRole }` ou `null`, sem alterar status, avançando para `DAWN_ANNOUNCEMENT`.
- [X] T058 [US3] Implementar `src/features/assassins-phase/model/assassinRows.js` e `src/features/assassins-phase/ui/AssassinsPhasePanel.jsx` com uma linha por assassino vivo, alvos vivos diferentes dele, opção "Sem alvo" e ação de processar; mortos não aparecem.
- [X] T059 [US3] Implementar `src/features/detectives-phase/model/detectiveRows.js` e `src/features/detectives-phase/ui/DetectivesPhasePanel.jsx` com uma linha por detetive vivo, alvos vivos diferentes dele, revelação imediata do papel ao narrador, opção sem investigação e ação de concluir.
- [X] T060 [US3] Estender `src/app/providers/MatchSessionProvider.jsx` com `dismissAnnouncement`, `setAssassinTarget`, `resolveAssassinsPhase`, `setInvestigation` e `resolveDetectivesPhase`, delegando todas as decisões ao motor.
- [X] T061 [US3] Implementar `src/widgets/match-status-bar/MatchStatusBar.jsx` exibindo turno atual, fase, quantidade de vivos/mortos e próxima etapa.
- [X] T062 [US3] Implementar `src/pages/live-match/useLiveMatchViewModel.js` derivando fase, frase de sobreposição, assassinos/detetives vivos, alvos elegíveis, investigações e ações, com tradução de erros de domínio.
- [X] T063 [US3] Implementar `src/pages/live-match/LiveMatchPage.jsx` compondo barra de status, sobreposições, painéis de assassinos/detetives e carregando nomes atuais dos participantes; mortos ausentes de executores e alvos.

**Checkpoint**: turno noturno completo, com ações conjuntas, investigação e fase de detetives condicional.

---

## Phase 6: User Story 4 — Apresentar o amanhecer e registrar a votação (Priority: P1)

**Goal**: apresentar o resultado da noite com eliminados nominais ou mensagem de nenhuma morte e registrar apenas eliminado ou empate na votação.

**Independent Test**: executar uma noite com assassinato e votação com eliminado; repetir com noite sem mortes e votação empatada, verificando mensagens, status e novo turno.

### Tests for User Story 4

- [X] T064 [P] [US4] Escrever `tests/unit/matchEngine.voting.test.js` cobrindo eliminado vivo com `DEAD` e `eliminatedAt = { turn: currentTurn, phase: "VOTE" }`, empate sem mudança de status, alvo morto (`TARGET_NOT_ALIVE`), segundo resultado (`VOTE_ALREADY_REGISTERED`), vitória após votação, incremento de `turnCount`, novo turno com limpeza de dados temporários, `startVoting` válido em `DAWN_RESULT` e `INVALID_PHASE` em outras fases.
- [X] T065 [US4] Escrever `tests/unit/dawnResult.test.js` cobrindo nomes de eliminados, mensagem de nenhuma morte e opções de votação apenas com vivos.
- [X] T066 [US4] Escrever `tests/integration/dawnAndVoting.test.jsx` cobrindo sobreposição "Cidade Acorda", resultado nominal/sem mortes, lista de votação sem mortos, empate, eliminado e novo turno.

### Implementation for User Story 4

- [X] T067 [US4] Implementar `src/features/dawn-and-voting/model/dawnResult.js` com derivação de eliminados da noite e mensagem "Ninguém foi assassinado nesta noite", e `votingOptions.js` apenas com vivos.
- [X] T067a [US4] Implementar `startVoting(session)` em `src/entities/match/model/matchEngine.js`: validar fase `DAWN_RESULT` (senão `INVALID_PHASE`) e transicionar para `VOTING`; exportar por `src/entities/match/index.js`.
- [X] T068 [US4] Implementar `registerVote(session, result, endedAt)` em `src/entities/match/model/matchEngine.js` aceitando `{ type: "ELIMINATION", participantId }` com alvo vivo ou `{ type: "TIE" }`, sem votos individuais, avaliando vitória, incrementando `turnCount` e iniciando novo turno ou encerrando.
- [X] T069 [US4] Implementar `src/features/dawn-and-voting/ui/DawnResultPanel.jsx` e `VotingPanel.jsx` com eliminados/sem mortes, seleção de vivo ou empate e confirmação; mortos não aparecem e não há interface de votos individuais.
- [X] T070 [US4] Estender `src/pages/live-match/useLiveMatchViewModel.js` e `src/app/providers/MatchSessionProvider.jsx` com `startVoting`, `registerVote`, resultados do amanhecer e mensagens em português.
- [X] T071 [US4] Integrar `DawnResultPanel` e `VotingPanel` em `src/pages/live-match/LiveMatchPage.jsx`, garantindo que a transição para `FINISHED` assuma a tela imediatamente e que dados do turno não sejam enviados individualmente à API.

**Checkpoint**: ciclo completo de turno com amanhecer, votação, empate e novo turno.

---

## Phase 7: User Story 5 — Encerrar a partida automaticamente por vitória (Priority: P2)

**Goal**: encerrar automaticamente na condição de vitória, exibir o lado vencedor e persistir a partida finalizada uma única vez com retry idempotente.

**Independent Test**: roteirizar partidas com último assassino eliminado e com paridade/superioridade dos assassinos; confirmar encerramento imediato, vencedor, turno decisivo e gravação única.

### Tests for User Story 5

- [X] T072 [P] [US5] Escrever `tests/unit/matchRepository.test.js` cobrindo listagem `GET /matches?status=FINISHED&_sort=endedAt&_order=desc`, consulta por ID com `404` → `ApiError`, `saveFinishedMatch` via `PUT /matches/:id` com `MatchParticipant` embutidos, retry com o mesmo corpo sem duplicar e validação mínima de resposta.
- [X] T073 [US5] Escrever `tests/unit/matchVictory.test.js` cobrindo último assassino eliminado à noite e na votação, paridade, superioridade, ausência de detetives/votação após vitória noturna, contagem do turno decisivo e ausência de novo turno após vitória na votação.
- [X] T074 [US5] Escrever `tests/integration/resultPersistence.test.jsx` cobrindo resultado na mesma interação, vencedor identificado, gravação uma única vez ao entrar em `FINISHED`, nenhuma gravação antes do fim, falha com aviso e "Tentar novamente".

### Implementation for User Story 5

- [X] T075 [US5] Implementar `src/entities/match/api/matchRepository.js` com `listFinished`, `getById` e `saveFinishedMatch` (`PUT` idempotente, `id` no corpo e na URL), validação mínima das respostas e `ApiError`; exportar por `src/entities/match/index.js`.
- [X] T076 [US5] Implementar `src/entities/match/ui/MatchOutcomeBadge.jsx` e `src/widgets/match-summary/MatchSummary.jsx` com vencedor, sobreviventes, eliminados, `turnCount`, `closureReason` e estado de persistência.
- [X] T077 [US5] Estender `src/app/providers/MatchSessionProvider.jsx` com persistência ao entrar em `FINISHED` uma única vez, `savedMatchId`, estados `idle/saving/saved/error` e ação de retry; estender `src/app/providers/AppProviders.jsx` com `matchRepository`.
- [X] T078 [US5] Estender `src/pages/live-match/useLiveMatchViewModel.js` com resultado final, vencedor, sobreviventes, estado de persistência e mensagens de erro/retry.
- [X] T079 [US5] Implementar a visão de resultado em `src/pages/live-match/LiveMatchPage.jsx` com `MatchOutcomeBadge` e `MatchSummary`, sem confirmação adicional e mantendo o resultado visível em caso de falha de gravação.

**Checkpoint**: vitória automática perceptível e partida finalizada persistida de forma idempotente.

---

## Phase 8: User Story 6 — Encerrar a partida manualmente (Priority: P2)

**Goal**: permitir encerramento manual em qualquer fase, com confirmação/cancelamento, sem vencedor e sem contar o turno em andamento.

**Independent Test**: iniciar partida, eliminar alguém, cancelar e confirmar encerramento; verificar status preservado, ausência de vencedor, turno não contado e gravação única; repetir durante sobreposição.

### Tests for User Story 6

- [X] T080 [P] [US6] Escrever `tests/unit/matchEngine.manual.test.js` cobrindo encerramento em sobreposição, ações e votação, `closureReason = MANUAL`, `winner = null`, `status = FINISHED`, status dos participantes preservado, `turnCount` inalterado e segundo encerramento com `MATCH_ALREADY_FINISHED`.
- [X] T081 [US6] Escrever `tests/integration/manualClosure.test.jsx` cobrindo diálogo de confirmação, cancelamento sem alteração, confirmação sem vencedor, botão acessível durante sobreposição sem dispensá-la e gravação única.

### Implementation for User Story 6

- [X] T082 [US6] Implementar `finishManually(session, endedAt)` em `src/entities/match/model/matchEngine.js` permitindo qualquer fase não final, sem eliminar ninguém, sem alterar `turnCount` e rejeitando partida já finalizada.
- [X] T083 [US6] Implementar `src/features/match-closure/model/closure.js` e `src/features/match-closure/ui/FinishMatchButton.jsx` com abertura do diálogo, confirmação, cancelamento e suporte a `stopPropagation` em sobreposições.
- [X] T084 [US6] Estender `src/app/providers/MatchSessionProvider.jsx` e `src/pages/live-match/useLiveMatchViewModel.js` com `finishManually`, estado do diálogo de confirmação e mensagens em português.
- [X] T085 [US6] Integrar o encerramento manual em `src/pages/live-match/LiveMatchPage.jsx` em todas as fases, garantindo exclusão do turno em andamento e reutilização da persistência de US5. (A integração via `footerAction` foi substituída pelo ponto único em T143–T144.)

**Checkpoint**: encerramento manual seguro, persistido e coerente com o ranking.

---

## Phase 9: User Story 7 — Consultar o histórico de partidas (Priority: P3)

**Goal**: listar apenas partidas finalizadas e apresentar detalhes com nomes atuais, papéis, status final, turnos e resultado.

**Independent Test**: finalizar uma partida por vitória e outra manualmente; conferir lista, detalhe, ausência de partidas em andamento e atualização de nome editado.

### Tests for User Story 7

- [X] T086 [P] [US7] Escrever `tests/unit/historyViewModel.test.jsx` cobrindo apenas `FINISHED`, ordenação por `endedAt` decrescente, detalhe com papéis/status/turnos/resultado, manual sem vencedor e resolução do nome atual.
- [X] T087 [US7] Escrever `tests/integration/history.test.jsx` cobrindo estado vazio, lista, detalhe, encerramento manual, documento com status diferente de `FINISHED` ignorado defensivamente e nome editado refletido.

### Implementation for User Story 7

- [X] T088 [US7] Implementar `src/features/match-history/model/history.js` derivando lista/detalhe, resolvendo `participantId` para nome atual, formatando datas e rótulos de resultado/closure.
- [X] T089 [US7] Implementar `src/pages/history/useHistoryViewModel.js` carregando partidas finalizadas e participantes via `useAsyncData`, com seleção de detalhe, loading, erro e vazio.
- [X] T090 [US7] Implementar `src/features/match-history/ui/MatchHistoryList.jsx` e `MatchHistoryDetail.jsx` e compor `src/pages/history/HistoryPage.jsx`.
- [X] T091 [US7] Adicionar a tela de histórico a `src/app/navigation/screens.js` e ao shell em `src/app/App.jsx`, verificando que partidas em andamento não aparecem.

**Checkpoint**: histórico completo e consistente com os dados persistidos.

---

## Phase 10: User Story 8 — Consultar o ranking de participantes (Priority: P3)

**Goal**: ranquear todos os participantes cadastrados por sobrevivências em partidas finalizadas, com zero incluído e desempate alfabético.

**Independent Test**: finalizar partidas com sobreviventes conhecidos, incluindo manual, e conferir ordem, contagem, zeros e desempate alfabético; ignorar partidas em andamento.

### Tests for User Story 8

- [X] T092 [P] [US8] Escrever `tests/unit/ranking.test.js` cobrindo todos os cadastrados inclusive zero, sobrevivência para `ALIVE` em partida `FINISHED`, mortos excluídos, encerramento manual contabilizado, partida em andamento ignorada e desempate por `Intl.Collator('pt-BR', { sensitivity: 'base' })`.
- [X] T093 [US8] Escrever `tests/integration/ranking.test.jsx` cobrindo vitória + encerramento manual, ordem/contagem, participantes com zero, partida em andamento ignorada e nome editado refletido.

### Implementation for User Story 8

- [X] T094 [US8] Implementar `src/features/participant-ranking/model/ranking.js` com `rankParticipants(participants, matches)` contando apenas `MatchParticipant` `ALIVE` de partidas `FINISHED` e ordenando por contagem decrescente e nome ascendente pt-BR.
- [X] T095 [US8] Implementar `src/pages/ranking/useRankingViewModel.js` carregando participantes e partidas finalizadas com `useAsyncData`, derivando linhas e tratando loading/erro/vazio.
- [X] T096 [US8] Implementar `src/features/participant-ranking/ui/RankingTable.jsx` e `src/pages/ranking/RankingPage.jsx`; adicionar a tela a `src/app/navigation/screens.js` e ao shell em `src/app/App.jsx`.

**Checkpoint**: ranking derivado, sem persistência duplicada e coerente com histórico.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: acabamento visual, acessibilidade, consistência de erros, integridade da persistência e validação final.

- [X] T097 [P] Completar `src/shared/config/labels.js` com mensagens em português para todos os códigos de `GameRuleError` e fallback seguro; cobrir com `tests/unit/errorMessages.test.js` a cobertura de todos os códigos e a ausência de mensagens técnicas expostas ao narrador.
- [X] T098 [P] Revisar acessibilidade em `src/shared/ui/`, `src/pages/` e `src/app/styles/`: foco visível, `aria-label`/`aria-modal`, dispensa por teclado, status não dependente apenas de cor e contraste; cobrir com `tests/integration/accessibility.test.jsx` foco do diálogo e dispensa por Enter.
- [X] T099 [P] Refinar identidade visual em `src/app/styles/tokens.css`, `animations.css` e CSS Modules das páginas: atmosfera sombria, vinheta/névoa, hierarquia legível e comportamento com `prefers-reduced-motion`; validar que nenhuma informação depende de animação.
- [X] T100 [P] Criar `tests/unit/architecture.test.js` verificando que `src/entities/match/model/matchEngine.js` não importa React, `fetch` ou repositórios, que `src/shared` não importa camadas internas e que features não importam outras features; corrigir violações encontradas.
- [X] T101 Escrever `tests/integration/persistenceConsistency.test.jsx` verificando que apenas CRUD de participantes e um único `PUT` final de partida são enviados, que ações noturnas/investigações/votos não são persistidos e que recarregar/abandonar uma partida em andamento não cria registro órfão.
- [X] T102 Atualizar `README.md` em português com pré-requisitos, `npm run dev:all`, `npm run dev:api`, `npm test`, `npm run lint`, `npm run build`, função do `db.json` e limitação de não recuperar partida em andamento após recarregar.
- [X] T103 Executar o roteiro manual de `quickstart.md` (seções 4.1 a 4.11) e as verificações de contrato (seções 5.1 e 5.2), incluindo a verificação de SC-001 (configuração de partida válida em até 3 minutos), registrar resultados e corrigir divergências sem ampliar o escopo.
- [X] T104 Executar `npm test`, `npm run lint` e `npm run build`, corrigindo todas as falhas; confirmar que nenhum teste unitário depende do JSON Server em execução.

**Checkpoint**: regras críticas verificadas, interface validada, build/lint/testes verdes e documentação operacional atualizada.

---

## Phase 12: Validation

**Purpose**: consolidar as evidências de validação após a implementação, cobrindo contratos, regras de domínio, persistência, acessibilidade e gates de qualidade.

- [X] T105 [P] Validar os contratos `contracts/match-engine.md` e `contracts/json-server-api.md` contra o motor, repositórios e serviços implementados; corrigir divergências de comando, fase, payload ou status sem ampliar o escopo.
- [X] T106 Executar `npm test` e confirmar cobertura das regras críticas de configuração, noite, investigação, votação, vitória, encerramento manual e ranking (plan §7.2), registrando o resultado.
- [X] T107 Validar o JSON Server real: proxy `/api`, `PUT` idempotente por partida, ausência de registros órfãos, ausência de recursos de turnos/ações/votos e histórico/ranking apenas com `FINISHED`.
- [X] T108 Executar o roteiro de `quickstart.md` (4.1–4.11) e as verificações de contrato (5.1–5.2), registrar evidências e corrigir divergências encontradas.
- [X] T109 [P] Validar SC-001 (configuração em até 3 minutos), SC-011 (contraste WCAG AA e tokens do tema escuro) e a dispensa de sobreposições por clique e teclado (T052/T098).
- [X] T110 Validar os comportamentos aprovados D3/D5/D7: turno decisivo contabilizado, ação de assassino eliminado aplicada e configuração com todos os assassinos permitida.
- [X] T111 Executar `npm run lint` e `npm run build`; confirmar `tests/unit/architecture.test.js` (motor sem React/`fetch` e limites FSD) e registrar os resultados.
- [X] T112 Revisar e marcar `checklists/validation.md` e `checklists/requirements.md`; registrar pendências aceitas, incluindo SC-009 como validação pós-entrega.

**Checkpoint**: evidências de validação registradas, checklists revisadas, gates de lint/build/testes verdes e nenhuma divergência de contrato aberta.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências; inicia imediatamente.
- **Foundational (Phase 2)**: depende do Setup e bloqueia todas as histórias.
- **US1 (Phase 3)**: depende do Foundational; fornece participantes para as demais histórias.
- **US2 (Phase 4)**: depende do Foundational e de US1 (participantes cadastrados); cria a sessão e o provider global.
- **US3 (Phase 5)**: depende de US2 (sessão, motor inicial e provider); implementa o fluxo noturno.
- **US4 (Phase 6)**: depende de US3 (ações noturnas e resultado da noite).
- **US5 (Phase 7)**: depende de US3/US4 (vitória já avaliada pelo motor) e introduz `matchRepository` e persistência final.
- **US6 (Phase 8)**: depende de US2–US5 (qualquer fase e mesmo caminho de persistência).
- **US7 (Phase 9)**: depende de US5/US6 (partidas finalizadas persistidas) e de `matchRepository`.
- **US8 (Phase 10)**: depende de US5/US6 (persistência final) e de US7 apenas para coerência de dados derivados; pode executar em paralelo com US7 após T075/T077.
- **Polish (Phase 11)**: depende de todas as histórias desejadas.
- **Validation (Phase 12)**: depende da Phase 11 e de todas as histórias implementadas; executada após T103/T104.
- **Delta US1 (Phase 14)**: depende de US1/US2 e de T114; introduz arquivamento e bloqueio pela partida ativa.
- **Delta US2 (Phase 15)**: depende de US2 e do delta de US1 apenas para a fonte de ativos; pode executar em paralelo com a Phase 14 após T121/T122.
- **Delta US5 (Phase 16)**: depende de US5 e de `victory.js`/`matchEngine.js` estáveis; independente das fases 14/15.
- **Delta US6 (Phase 17)**: depende de US6 e de `SpecialOverlay`/`MatchStatusBar`; independente das fases 14–16.
- **Delta US7 (Phase 18)**: depende de US7 e de `matchRepository`; independente das fases 14–17.
- **Delta US8 (Phase 19)**: depende de US8 e dos deltas US1/US7 para candidatos e recálculo; executar após T121/T122/T151.
- **Delta Polish (Phase 20)**: depende das Fases 14–19.

### User Story Dependencies

- **US1 (P1)**: sem dependências de outras histórias.
- **US2 (P1)**: depende de US1 para seleção de participantes.
- **US3 (P1)**: depende de US2 para sessão e início da partida.
- **US4 (P1)**: depende de US3 para o resultado noturno.
- **US5 (P2)**: depende de US3/US4; a avaliação de vitória já faz parte de US3/US4, enquanto US5 entrega a apresentação do resultado e a persistência final.
- **US6 (P2)**: depende de US5 para reutilizar a gravação final.
- **US7 (P3)**: depende de US5/US6.
- **US8 (P3)**: depende de US5/US6.
- **Delta 2026-11-17**: US1 (Phase 14) pode começar após T114 e antes das demais; US2 (Phase 15) após T121/T122; US5 (Phase 16) é independente; US6 (Phase 17) é independente; US7 (Phase 18) é independente; US8 (Phase 19) após T121/T122/T151.

### Within Each User Story

- Testes primeiro e falhando antes da implementação correspondente.
- Modelos/enums → serviços/motor → repositórios → ViewModels → Views/páginas → integração.
- Regras de negócio somente em `entities/*/model`; ViewModels traduzem erros e orquestram; Views não calculam vitória, não filtram regras por conta própria e não chamam `fetch`.

### Parallel Opportunities

- Setup: T004, T005 e T006 em paralelo após T001–T003.
- Foundational: T007–T013, T016–T018 e T021–T022 são paralelizáveis por arquivo.
- US1: T024 e T025 em paralelo; T027 e T029 em paralelo.
- US2: T036 e T037 em paralelo; T039 e T041 podem iniciar após os testes.
- US3: T047–T051 em paralelo; T053 e T054 em paralelo antes dos painéis T058/T059.
- US4: T064 e T065 em paralelo.
- US5: T072 e T073 em paralelo; T075 e T076 em paralelo.
- US6: T080 em paralelo com testes de fechamento de US5 quando o motor já estiver estável.
- US7 e US8: após T075/T077, as duas histórias podem executar em paralelo por equipes distintas.
- Polish: T097–T100 em paralelo.
- Validation: T105 e T109 em paralelo; T106–T108 e T110–T112 executam após a implementação estabilizada.
- Delta US1: T117, T118, T119 e T120 em paralelo (arquivos de teste distintos); T121–T122 em sequência; T123–T125 podem iniciar após T122; T126–T128 após T125.
- Delta US2: T129 e T130 em paralelo; T131–T133 em sequência; T134 depende de T132/T133.
- Delta US5: T135–T137 em paralelo; T138–T139 em sequência; T140 depende de T139.
- Delta US6: T141 e T142 em paralelo; T143–T147 em sequência por arquivo compartilhado de tela.
- Delta US7: T148 e T149 em paralelo; T151–T152 em sequência; T153–T155 após T151/T152.
- Delta US8: T156 e T157 em paralelo; T158–T159 em sequência.
- Delta Polish: T160–T162 em paralelo; T163–T165 após o delta implementado.

---

## Parallel Example: User Story 3

```text
Tarefa: "Escrever tests/unit/matchEngine.announcements.test.js"
Tarefa: "Escrever tests/unit/matchEngine.assassins.test.js"
Tarefa: "Escrever tests/unit/matchEngine.assassinsResolve.test.js"
Tarefa: "Escrever tests/unit/matchEngine.detectives.test.js"
Tarefa: "Escrever tests/unit/announcements.test.js"
```

```text
Tarefa: "Implementar src/shared/ui/SpecialOverlay.jsx"
Tarefa: "Implementar src/features/special-announcement/model/announcements.js e ui/SpecialAnnouncement.jsx"
Tarefa: "Implementar src/features/assassins-phase/..."
Tarefa: "Implementar src/features/detectives-phase/..."
```

## Parallel Example: User Story 7 e User Story 8

```text
Após T075/T077, com `matchRepository` e persistência final estáveis:
Tarefa: "US7 — implementar src/features/match-history/model/history.js"
Tarefa: "US8 — implementar src/features/participant-ranking/model/ranking.js"
```

---

## Parallel Example: Delta 2026-11-17

```text
Tarefa: "US1 — escrever tests/unit/participantArchive.test.js"
Tarefa: "US1 — escrever tests/unit/participantRepository.archive.test.js"
Tarefa: "US1 — escrever tests/unit/participantDeletion.test.js"

Tarefa: "US5 — escrever tests/unit/assassinsVictoryStatuses.test.js"
Tarefa: "US5 — escrever tests/unit/matchEngine.assassinsVictory.test.js"
Tarefa: "US5 — atualizar tests/unit/matchVictory.test.js"

Tarefa: "US7 — escrever tests/unit/matchDeletion.test.js"
Tarefa: "US8 — ampliar tests/unit/ranking.test.js"
```

## Implementation Strategy

### MVP Incremental

1. **Demo inicial**: Setup + Foundational + US1 — cadastro de participantes funcional e persistido.
2. **MVP de condução**: US2 + US3 + US4 — configurar, iniciar e conduzir um turno completo, incluindo a verificação de vitória e a transição para `FINISHED` (núcleo de US5); a apresentação detalhada do resultado e a persistência final podem ficar para US5.
3. **Jogo completo**: US5 + US6 — vitória automática, resultado, persistência final, retry e encerramento manual.
4. **Inteligência histórica**: US7 + US8 — histórico e ranking derivados.
5. **Acabamento**: Phase 11 — erros, acessibilidade, identidade visual, integridade e validação final.
6. **Validação consolidada**: Phase 12 — evidências de contratos, regras, persistência, acessibilidade e gates de qualidade.
7. **Delta 2026-11-17**: Fases 14–19 podem ser entregues como incrementos independentes (exclusão de participantes, seleção em massa, status em massa, ponto único, exclusão de partidas, ranking), fechando com a Phase 20.

### Regras críticas cobertas explicitamente

- Mínimo de cinco participantes e ao menos um assassino: T036, T037, T046.
- Atribuição manual de papéis e inocentes por padrão: T036, T039, T041.
- Ações opcionais de assassinos e detetives: T048, T050, T058, T059.
- Uma ação por participante e por turno: T048–T050, T056–T057, T064, T068.
- Eliminações conjuntas e deduplicadas: T049, T056.
- Investigação revela papel sem alterar status: T050, T057, T059.
- Bloqueio de ações de mortos: T020, T048, T050, T064, T068.
- Empate sem eliminação: T064, T065, T069.
- Vitória dos inocentes com zero assassinos e dos assassinos com paridade/superioridade: T019, T049, T064, T073.
- Verificação imediata após eliminações: T049, T056, T068, T073.
- Encerramento manual sem vencedor e sem contar turno em andamento: T080, T082, T085.
- Sobrevivência contabilizada no ranking: T092, T094.
- Persistência apenas ao final, com `PUT` idempotente: T072, T074, T075, T077, T101.
- Ação de assassino eliminado na mesma noite: T056, T105, T110.
- Configuração com todos os assassinos: T037, T105, T110.
- Turno decisivo contabilizado em vitória noturna: T073, T110.
- Ranking com participantes de zero sobrevivências: T092, T094, T110.
- Sobreposições dispensadas por clique ou teclado: T052, T098, T109.
- Exclusão de participante por arquivamento e bloqueio na partida ativa: T117–T128.
- Seleção padrão/em massa, contador e memória de papéis: T129–T134.
- Status em massa na vitória dos assassinos antes da persistência: T135–T140.
- Ponto único de encerramento acima das sobreposições: T141–T147.
- Exclusão definitiva de partidas finalizadas e recálculo do ranking: T148–T155.
- Ranking com arquivados, sobreviventes finais e desempate por ID: T156–T159.

### Definition of Done por tarefa

- Código executável e integrado ao caminho funcional da história.
- Testes indicados escritos e verdes (ou manualmente validados quando a tarefa for de validação).
- Nenhuma regra de negócio duplicada na View.
- Nenhuma ação noturna, investigação ou voto individual enviado ao JSON Server.
- Nenhum `DELETE /participants/:id`; exclusão de participante é `PATCH` com `deletedAt`.
- Na vitória dos assassinos, o documento persistido contém os status em massa e não ressuscita mortos.
- `npm run lint` e `npm run build` sem erros ao final de cada fase.

---

## Notes

- Tarefas `[P]` não compartilham arquivos e podem executar em paralelo.
- O motor puro (`src/entities/match/model/matchEngine.js`) concentra regras; ViewModels apenas orquestram, traduzem códigos e persistem o resultado final.
- Exclusão de participante é arquivamento com `deletedAt` (Fase 14); exclusão de partida finalizada é definitiva (Fase 18); não há exclusão em massa, restauração, sorteio de papéis, autenticação, roteador ou persistência de turnos.
- O turno corrente é derivado como `turnCount + 1`; o encerramento manual não incrementa `turnCount`.
- A partida em andamento vive apenas em memória; recarregar ou fechar o navegador a descarta, sem registro órfão.
- Consistência do JSON Server: somente `participants` (ativos e arquivados) e `matches` finalizadas; nomes resolvidos por `participantId`.
- As decisões D1–D15, Q1–Q3 e as premissas A1–A5 estão aprovadas; o delta está refletido em `plan.md` (2026-11-17) e nas Fases 14–20.

## Phase 13: Convergence

- [X] T113 Garantir que o diálogo de confirmação do encerramento manual fique acima da sobreposição especial durante qualquer anúncio, corrigindo o empilhamento (`z-index` dedicado ou portal/renderização no `footerAction`) e adicionando teste de regressão que abra e confirme o encerramento a partir da sobreposição per FR-052, FR-053, US6/AC1, plan: §6.2 (partial)
- [X] T114 Criar `src/entities/match-participant/index.js` e substituir os imports profundos entre slices de entidades em `src/entities`, `src/features`, `src/pages` e `src/widgets` pelos índices públicos correspondentes per plan: §1.1 (partial)
- [X] T115 Preservar a imutabilidade da propriedade `role` também em `eliminateMatchParticipant` e ampliar `tests/unit/matchParticipant.test.js` para verificar o descritor após a eliminação per T017 (partial)
- [X] T116 Corrigir `tests/integration/nightPhases.test.jsx` para cobrir de fato a omissão da fase dos detetives sem detetive vivo e a ausência de executores/alvos mortos per T052 (partial)

---

## Phase 14: User Story 1 — Gerenciar e excluir participantes (Delta 2026-11-17) (Priority: P1)

**Goal**: excluir participantes por arquivamento (`deletedAt`), preservando histórico, nome e ranking; bloquear a exclusão quando o participante estiver na partida ativa; permitir reutilização do nome de um arquivado.

**Independent Test**: cadastrar “Ana” e “Bruno”, finalizar uma partida com ambos, excluir “Ana” com confirmação, confirmar que ela sai do cadastro ativo e das novas partidas, mas permanece no histórico/ranking; cadastrar novamente “Ana” e confirmar IDs distintos; tentar excluir um participante da partida em andamento e confirmar o bloqueio.

### Tests for User Story 1

- [X] T117 [P] [US1] Escrever `tests/unit/participantArchive.test.js` cobrindo `deletedAt: null` = ativo, `deletedAt` ISO = arquivado, ausência de `deletedAt` normalizada para `null`, `isParticipantActive`, `archiveParticipant` preservando `id` e o último `name`, unicidade apenas entre ativos e reutilização de nome de arquivado com identidades distintas.
- [X] T118 [US1] Escrever `tests/unit/participantRepository.archive.test.js` cobrindo `listActive()` filtrando `deletedAt != null`, `listAll()` retornando ativos e arquivados, `archive(id, deletedAt)` via `PATCH /participants/:id` com payload `{ deletedAt }`, preservação de `deletedAt` na resposta, normalização de ausência para `null` e `ApiError` em `404`/resposta inválida.
- [X] T119 [P] [US1] Escrever `tests/unit/participantDeletion.test.js` cobrindo a decisão pura de exclusão: bloqueio quando `participantId` pertence aos IDs da partida ativa, permissão caso contrário, mensagem/código de bloqueio e confirmação sem alterar dados quando cancelada.
- [X] T120 [US1] Escrever `tests/unit/useParticipantsViewModel.test.jsx` (ou ampliar o existente) cobrindo carregamento apenas de ativos, exclusão com confirmação, cancelamento, arquivamento com `now()` injetado, bloqueio na partida ativa, recarga da lista e mensagens em português.

### Implementation for User Story 1

- [X] T121 [US1] Implementar em `src/entities/participant/model/participant.js` os helpers de `deletedAt` (`null`/ISO, ausente → `null`), `isParticipantActive`, `archiveParticipant` e validação de duplicidade restrita a ativos; exportar por `src/entities/participant/index.js`.
- [X] T122 [US1] Atualizar `src/entities/participant/api/participantRepository.js` para `listActive()`, `listAll()` e `archive(id, deletedAt)` usando `httpClient.patch`; fazer `assertParticipant` aceitar e normalizar `deletedAt`; manter `list` compatível ou redirecionar para `listAll`; atualizar exportações públicas.
- [X] T123 [US1] Implementar `src/features/participant-deletion/model/participantDeletion.js` com a verificação de bloqueio por IDs da partida ativa e a confirmação/cancelamento, exportando pela API pública do slice.
- [X] T124 [US1] Implementar `src/features/participant-deletion/ui/DeleteParticipantDialog.jsx` e `DeleteParticipantButton.jsx` (com CSS Module) reutilizando `src/shared/ui/ConfirmDialog.jsx`, com ação de excluir, cancelar e mensagem de bloqueio.
- [X] T125 [US1] Atualizar `src/pages/participants/useParticipantsViewModel.js` para carregar ativos, orquestrar a exclusão com `archive` e `now`, expor `deletingId`, estado de confirmação e bloqueio, tratar erros e recarregar a lista após sucesso.
- [X] T126 [US1] Expor os `participantId` da partida ativa em `src/app/providers/MatchSessionProvider.jsx` e consumi-los no ViewModel de participantes; ampliar `tests/unit/MatchSessionProvider.test.jsx` para o novo valor derivado.
- [X] T127 [US1] Atualizar `src/widgets/participants-table/ParticipantsTable.jsx` e `src/pages/participants/ParticipantsPage.jsx` com ação de excluir, confirmação, estado de bloqueio e atualização da lista, mantendo edição e criação existentes.
- [X] T128 [US1] Escrever `tests/integration/participantDeletion.test.jsx` cobrindo confirmação, cancelamento, bloqueio em partida ativa, saída do cadastro/novas partidas, histórico/ranking preservados, reutilização de nome e ausência de `DELETE` físico de participante.

**Checkpoint**: US1 permite excluir com segurança e sem quebrar vínculos históricos.

---

## Phase 15: User Story 2 — Configurar uma nova partida (Delta 2026-11-17) (Priority: P1)

**Goal**: iniciar a configuração com todos os ativos selecionados, oferecer selecionar/desmarcar todos, exibir o contador e preservar o papel especial ao desmarcar/remarcar.

**Independent Test**: abrir a configuração com seis ativos, confirmar “6 de 6”, desmarcar todos, selecionar cinco, atribuir um assassino, desmarcar/remarcar esse assassino e confirmar que o papel foi preservado; iniciar e verificar os papéis.

### Tests for User Story 2

- [X] T129 [P] [US2] Ampliar `tests/unit/matchSetup.test.js` cobrindo `selectedIds` iniciado com todos os ativos, `selectAll`, `deselectAll`, alternância individual, contador de selecionados, papéis preservados em `roles` ao desmarcar/remarcar e ausência de arquivados no rascunho.
- [X] T130 [US2] Ampliar `tests/unit/useMatchSetupViewModel.test.jsx` cobrindo carregamento apenas de ativos, criação do rascunho padrão, ações em massa, contador após cada alteração, validação de mínimo/assassino após alteração e conversão apenas dos selecionados em configuração.

### Implementation for User Story 2

- [X] T131 [US2] Refatorar `src/features/match-configuration/model/matchSetup.js` para o rascunho `{ selectedIds, roles }`, com `createMatchSetupDraft`, `toggleSelection`, `selectAll`, `deselectAll`, contagem e conversão para `MatchConfiguration`; preservar `roles` ao desmarcar/remarcar.
- [X] T132 [US2] Atualizar `src/pages/match-setup/useMatchSetupViewModel.js` para inicializar o rascunho com todos os ativos, expor ações em massa, contador, bloqueios e iniciar a partida apenas com os selecionados.
- [X] T133 [US2] Atualizar `src/features/match-configuration/ui/MatchSetupForm.jsx` e `MatchSetupForm.module.css` com seleção por checkbox, contador “X de Y”, botões “Selecionar todos”/“Desmarcar todos” e seletor de papel por participante.
- [X] T134 [US2] Atualizar `tests/integration/matchSetup.test.jsx` cobrindo seleção padrão, ações em massa, contador, preservação de papel e bloqueios após alteração da seleção.

**Checkpoint**: configuração exige menos esforço e mantém papéis durante ajustes de seleção.

---

## Phase 16: User Story 5 — Encerrar a partida automaticamente por vitória (Delta 2026-11-17) (Priority: P2)

**Goal**: na vitória dos assassinos, aplicar o status final em massa antes de `FINISHED` e da persistência, sem ressuscitar mortos e sem alterar papéis.

**Independent Test**: roteirizar uma vitória dos assassinos após a noite e outra após a votação; confirmar que todos os não assassinos terminam `DEAD`, assassinos vivos permanecem `ALIVE`, assassinos mortos permanecem `DEAD`, o `eliminatedAt` coletivo usa turno/fase da vitória e o documento persistido já contém esses status.

### Tests for User Story 5

- [X] T135 [P] [US5] Escrever `tests/unit/assassinsVictoryStatuses.test.js` cobrindo `applyAssassinsVictoryStatuses(session, "NIGHT" | "VOTE")`: não assassinos vivos → `DEAD` com `eliminatedAt = { turn: currentTurn, phase }`; não assassinos já mortos mantêm o momento original; assassinos vivos permanecem `ALIVE`; assassinos mortos permanecem `DEAD`; papéis inalterados; imutabilidade; `TypeError` para fase inválida.
- [X] T136 [P] [US5] Escrever `tests/unit/matchEngine.assassinsVictory.test.js` cobrindo a chamada da atualização em massa em `resolveAssassinsPhase` (fase `NIGHT`) e `registerVote` (fase `VOTE`), exatamente uma vez antes de `status = FINISHED`, e o documento final com os status em massa.
- [X] T137 [P] [US5] Atualizar `tests/unit/matchVictory.test.js` e `tests/integration/resultPersistence.test.jsx` para verificar que o resultado e o `PUT` final refletem os status em massa, que o ranking conta apenas assassinos vivos e que a gravação não aplica regra de domínio.

### Implementation for User Story 5

- [X] T138 [US5] Implementar `applyAssassinsVictoryStatuses(session, phase)` em `src/entities/match/model/victory.js` conforme as regras do `contracts/match-engine.md`, sem avaliar novamente a vitória; exportar por `src/entities/match/index.js`.
- [X] T139 [US5] Integrar a atualização em massa em `src/entities/match/model/matchEngine.js`: chamar antes de finalizar em `resolveAssassinsPhase` e `registerVote` somente quando `evaluateVictory` retornar `ASSASSINS`, passando `"NIGHT"` ou `"VOTE"` e mantendo a persistência fora do motor.
- [X] T140 [US5] Atualizar `src/widgets/match-summary/MatchSummary.jsx` e `src/pages/live-match/useLiveMatchViewModel.js` para derivar e exibir os eliminados em massa, o momento coletivo (turno/fase) e os status finais, sem recalcular regra de vitória na View.

**Checkpoint**: a vitória dos assassinos encerra com o estado final correto e persistido.

---

## Phase 17: User Story 6 — Encerrar a partida manualmente em um ponto único (Delta 2026-11-17) (Priority: P2)

**Goal**: manter um único `FinishMatchButton` persistente na tela da partida, acessível acima de sobreposições, com confirmação acima de tudo e sem duplicação nos pop-ups.

**Independent Test**: iniciar uma partida, percorrer uma fase com sobreposição e outra com painel, confirmar que existe um único botão de encerrar, que ele permanece focável/acionável durante a sobreposição sem dispensá-la e que a confirmação aparece acima do overlay; cancelar e confirmar.

### Tests for User Story 6

- [X] T141 [P] [US6] Atualizar `tests/integration/manualClosure.test.jsx` para cobrir ponto único (um único botão na tela), ausência de duplicação em `SpecialOverlay`/painéis, foco e acionamento por teclado durante a sobreposição, confirmação acima do overlay, cancelamento e encerramento sem vencedor.
- [X] T142 [P] [US6] Atualizar `tests/integration/accessibility.test.jsx` para cobrir o botão persistente fora do overlay (foco não bloqueado quando `aria-modal` não se aplica) e a ordem de foco do diálogo de confirmação.

### Implementation for User Story 6

- [X] T143 [US6] Remover o slot `footerAction` e o `stopPropagation` correspondente de `src/shared/ui/SpecialOverlay.jsx`; revisar `aria-modal` para não impedir o controle persistente e manter a dispensa por clique/Enter/Espaço e `prefers-reduced-motion`.
- [X] T144 [US6] Remover qualquer uso de `footerAction` em `src/features/special-announcement/ui/SpecialAnnouncement.jsx`, mantendo as frases e a dispensa inalteradas.
- [X] T145 [US6] Ajustar `src/features/match-closure/ui/FinishMatchButton.jsx` e `src/features/match-closure/model/closure.js` para o ponto único persistente, com confirmação, cancelamento, estado desabilitado após `FINISHED` e sem depender da sobreposição.
- [X] T146 [US6] Atualizar `src/widgets/match-status-bar/MatchStatusBar.jsx` e CSS para hospedar o único `FinishMatchButton`, com camada/`z-index` acima das sobreposições, foco visível e layout sem sobreposição visual.
- [X] T147 [US6] Atualizar `src/pages/live-match/LiveMatchPage.jsx` e `src/pages/live-match/useLiveMatchViewModel.js` para renderizar o encerramento apenas uma vez via `MatchStatusBar`, remover integrações antigas e garantir que a confirmação fique acima do overlay e dos painéis.

**Checkpoint**: encerramento manual consistente, acessível e sem duplicação em qualquer fase.

---

## Phase 18: User Story 7 — Consultar e excluir partidas do histórico (Delta 2026-11-17) (Priority: P3)

**Goal**: excluir definitivamente partidas finalizadas, com confirmação, removendo-as do histórico e recalculando o ranking, sem alterar participantes ou outras partidas.

**Independent Test**: finalizar duas partidas, excluir uma do histórico com confirmação, confirmar que ela desaparece, que o ranking perde sua contribuição, que participantes e a outra partida permanecem e que `404` é tratado como já removida.

### Tests for User Story 7

- [X] T148 [P] [US7] Ampliar `tests/unit/matchRepository.test.js` cobrindo `deleteMatch(id)` via `DELETE /matches/:id`, sucesso `200`/`204`, `404` como remoção já concluída (ou `ApiError` tratado pelo chamador), validação de `id` e ausência de efeito em outras chamadas.
- [X] T149 [P] [US7] Escrever `tests/unit/matchDeletion.test.js` cobrindo confirmação/cancelamento, bloqueio para status diferente de `FINISHED`, mensagem de sucesso/erro e decisão de fechar o detalhe após exclusão.
- [X] T150 [US7] Ampliar `tests/unit/historyViewModel.test.jsx` cobrindo exclusão com confirmação, cancelamento, remoção da lista, fechamento do detalhe, estado vazio na última partida, `404` como já removida e recarga do histórico/ranking.

### Implementation for User Story 7

- [X] T151 [US7] Implementar `deleteMatch(id)` em `src/entities/match/api/matchRepository.js` usando `httpClient.delete` e exportar por `src/entities/match/index.js`; manter `listFinished`, `getById` e `saveFinishedMatch` inalterados.
- [X] T152 [US7] Implementar `src/features/match-deletion/model/matchDeletion.js` e `src/features/match-deletion/ui/DeleteMatchDialog.jsx` (com CSS Module), reutilizando `src/shared/ui/ConfirmDialog.jsx`.
- [X] T153 [US7] Atualizar `src/pages/history/useHistoryViewModel.js` com estado de exclusão pendente, confirmação, chamada a `deleteMatch`, tratamento de `404`, atualização da lista, fechamento do detalhe e mensagens em português.
- [X] T154 [US7] Atualizar `src/features/match-history/ui/MatchHistoryList.jsx`, `MatchHistoryDetail.jsx` e `src/pages/history/HistoryPage.jsx` para expor “Excluir partida” apenas em partidas finalizadas, com confirmação e estado vazio após a última exclusão.
- [X] T155 [US7] Escrever `tests/integration/historyDeletion.test.jsx` cobrindo confirmação, cancelamento, remoção do histórico, recálculo do ranking, participantes/outras partidas intactos, `404` e estado vazio.

**Checkpoint**: histórico permite descartar partidas finalizadas sem afetar o cadastro.

---

## Phase 19: User Story 8 — Consultar o ranking de participantes (Delta 2026-11-17) (Priority: P3)

**Goal**: incluir arquivados com partidas remanescentes, excluir arquivados sem partidas, contar apenas sobreviventes finais e garantir desempate determinístico.

**Independent Test**: finalizar partidas com um participante arquivado que ainda tenha partida remanescente e outro arquivado sem partidas; confirmar que apenas o primeiro aparece, que participantes ativos com zero aparecem e que a ordem/desempate é estável após excluir uma partida.

### Tests for User Story 8

- [X] T156 [P] [US8] Ampliar `tests/unit/ranking.test.js` cobrindo candidatos = ativos ∪ arquivados referenciados por partidas `FINISHED` remanescentes, arquivados sem partidas omitidos, ativos com zero, status finais da vitória dos assassinos (apenas assassinos vivos contam), desempate por nome pt-BR e por `participantId`.
- [X] T157 [US8] Ampliar `tests/integration/ranking.test.jsx` cobrindo participante arquivado no ranking/histórico, recálculo após exclusão de partida e reutilização de nome sem colisão de identidade.

### Implementation for User Story 8

- [X] T158 [US8] Atualizar `src/features/participant-ranking/model/ranking.js` para montar candidatos com ativos e arquivados referenciados por partidas remanescentes, contar apenas `ALIVE` finais e aplicar desempate final por `participantId` após nome.
- [X] T159 [US8] Atualizar `src/pages/ranking/useRankingViewModel.js` para carregar todos os participantes (ativos e arquivados) e partidas finalizadas, derivando o ranking atualizado e tratando loading/erro/vazio.

**Checkpoint**: ranking coerente com exclusões e com o desfecho real das partidas.

---

## Phase 20: Delta Polish & Validation (2026-11-17)

**Purpose**: consolidar mensagens, limites arquiteturais, documentação e validação do delta.

- [X] T160 [P] Atualizar `src/shared/config/labels.js` com mensagens pt-BR para bloqueio de exclusão em partida ativa, confirmação/sucesso de arquivamento, exclusão de partida, falha de `404` como já removida e status em massa na vitória; ampliar `tests/unit/labels.test.js`.
- [X] T161 [P] Atualizar `tests/unit/architecture.test.js` para verificar que `participant-deletion` e `match-deletion` não importam outras features, que o motor não importa React/`fetch`/repositórios e que os slices usam as APIs públicas de `entities`.
- [X] T162 [P] Atualizar `README.md` com exclusão por arquivamento, exclusão definitiva de partidas finalizadas, `deletedAt` no `db.json` e comportamento do ranking após exclusões.
- [X] T163 Atualizar `checklists/requirements.md` e `checklists/validation.md` para refletir FR-075–110, A1–A5 e Q1–Q3, sem marcar como concluído o que ainda não foi validado.
- [ ] T164 Executar o roteiro manual de `quickstart.md` (seções 4.1 a 4.12) e as verificações de contrato (seções 5.1 e 5.2), incluindo arquivamento, exclusão de partida, seleção em massa, ponto único e vitória dos assassinos; registrar divergências e corrigir sem ampliar o escopo.
- [X] T165 Executar `npm test`, `npm run lint` e `npm run build` a partir de `package.json` na raiz do repositório, corrigindo todas as falhas e confirmando que nenhum teste unitário depende do JSON Server em execução.

**Checkpoint**: delta validado ponta a ponta, com mensagens, limites FSD e documentação coerentes.

---

## Phase 21: Correção de UI — Sobreposições de tela cheia sem elementos concorrentes (Bugfix 2026-11-17)

**Purpose**: corrigir o surgimento de outros elementos da tela enquanto um pop-up de anúncio cobre toda a viewport. Afeta diretamente US3 (etapas noturnas), US4 (amanhecer) e US6 (ponto único de encerramento), mas é uma correção transversal de empilhamento, recorte e composição.

**Causas identificadas no código atual**:

1. `src/shared/ui/SpecialOverlay.jsx` é renderizado dentro de `LiveMatchPage` → `.page` → `.screen` (`overflow: hidden`, `position: relative`, animação de opacidade e `#root` com `z-index: 1`), dependendo do contexto de empilhamento dos ancestrais em vez de ser isolado no `body`.
2. `src/widgets/match-status-bar/MatchStatusBar.module.css` aplica `z-index: calc(var(--z-dialog-elevated, 1200) - 1)` = 1199 ao contêiner inteiro da barra, então Turno/Fase/Vivos/Mortos/Próxima etapa aparecem acima da sobreposição (z-index 1100), embora somente o `FinishMatchButton` deva ficar acima.
3. `SpecialOverlay.module.css` usa fundo com alfa (`rgba(4, 4, 8, 0.88)`) e `backdrop-filter`, permitindo que o conteúdo de trás apareça por transparência/fallback de blur.
4. `LiveMatchPage` continua renderizando título, `Alert` de erro, `MatchStatusBar` completo, painéis e resumo enquanto `isAnnouncement` é verdadeiro, sem esconder/`inert`izar o conteúdo de fundo nem bloquear o scroll do `body`.
5. Não há tokens explícitos para a ordem das camadas (conteúdo < anúncio < controle persistente < confirmação), o que permite regressões de `z-index` isoladas.

**Independent Test**: iniciar uma partida e, em cada fase de anúncio, confirmar que a sobreposição cobre toda a viewport com fundo opaco, que cabeçalho/navegação/rodapé, barra de estatísticas, painéis da fase e resumo não aparecem por cima nem por transparência, que existe exatamente um botão "Encerrar partida" acima do anúncio, que ele permanece focável/acionável sem dispensar o pop-up, que a confirmação aparece acima de tudo e que, ao dispensar o anúncio, o conteúdo da fase reaparece normalmente.

### Tests for Phase 21

- [X] T166 [P] Ampliar `tests/integration/accessibility.test.jsx` para verificar que `SpecialOverlay` é renderizado como filho direto de `document.body` (portal), que usa `data-layer="announcement"`, que apenas o controle persistente de encerramento (`data-layer="persistent-closure"`) permanece focável fora da sobreposição e que o diálogo de confirmação (`data-layer="confirm"`) fica acima de ambos sem dispensar o anúncio.
- [X] T167 [P] Criar `tests/integration/fullScreenOverlay.test.jsx` cobrindo cada fase de anúncio (`TURN_START`, `ASSASSINS_ANNOUNCEMENT`, `DETECTIVES_ANNOUNCEMENT`, `DAWN_ANNOUNCEMENT`) em `LiveMatchPage`: sobreposição cobre a viewport; textos "Turno", "Fase", "Vivos", "Mortos" e "Próxima etapa" da barra não aparecem simultaneamente; `AssassinsPhasePanel`, `DetectivesPhasePanel`, `DawnResultPanel`, `VotingPanel`, `MatchSummary` e `Alert` não aparecem junto do anúncio; existe exatamente um botão "Encerrar partida"; após dispensar, o conteúdo da fase reaparece.
- [X] T168 [P] Ampliar `tests/integration/manualClosure.test.jsx` para garantir que, durante o anúncio, o botão de encerramento permanece no mesmo ponto/camada (`data-layer="persistent-closure"`), que o overlay não intercepta seu clique/foco, que o diálogo de confirmação fica acima sem dispensar o anúncio e que cancelar restaura o foco ao botão persistente.
- [X] T169 [P] Criar `tests/unit/useBodyScrollLock.test.jsx` cobrindo bloqueio de `document.body.style.overflow` ao ativar, restauração do valor anterior ao desativar/desmontar, suporte a múltiplos consumidores e ausência de erro quando `document` não existe.

### Implementation for Phase 21

- [X] T170 [P] Atualizar `src/app/styles/tokens.css` definindo a ordem explícita de camadas `--z-content: 0`, `--z-announcement: 1100`, `--z-persistent-closure: 1150` e `--z-confirm-dialog: 1200` (substituindo `--z-overlay`, `--z-dialog` e `--z-dialog-elevated` nos usos internos), com comentário curto da ordem conteúdo < anúncio < encerramento < confirmação.
- [X] T171 Atualizar `src/shared/ui/SpecialOverlay.jsx` para renderizar a sobreposição via `createPortal` em `document.body`, com guarda `typeof document !== 'undefined'`, `data-layer="announcement"`, foco inicial no overlay e restauração do foco anterior ao desmontar; manter `role="dialog"`, `aria-label` e dispensa por clique/Enter/Espaço, sem `aria-modal` e sem capturar o clique do botão persistente.
- [X] T172 Atualizar `src/shared/ui/SpecialOverlay.module.css` para usar fundo totalmente opaco (sem alfa que revele o conteúdo de trás), cobrir a viewport com `position: fixed; inset: 0; width: 100vw; height: 100dvh`, `z-index: var(--z-announcement)` e sem depender de `overflow`, `transform`, `filter` ou animação de ancestrais; manter o suporte a `prefers-reduced-motion`.
- [X] T173 Implementar `src/shared/lib/useBodyScrollLock.js` com bloqueio/restauração de `document.body.style.overflow` e consumi-lo em `src/shared/ui/SpecialOverlay.jsx` apenas enquanto a sobreposição estiver montada, liberando o scroll ao dispensar/desmontar.
- [X] T174 Atualizar `src/widgets/match-status-bar/MatchStatusBar.jsx` e `src/widgets/match-status-bar/MatchStatusBar.module.css` para remover o `z-index` elevado do contêiner inteiro; isolar o `FinishMatchButton` em um wrapper `data-layer="persistent-closure"` com `z-index: var(--z-persistent-closure)`, manter `dl` de estatísticas na camada de conteúdo e aceitar `overlayActive` (ou `showStats={false}`) para ocultar as estatísticas durante anúncios sem desmontar o botão.
- [X] T175 Atualizar `src/pages/live-match/LiveMatchPage.jsx` para que, quando `viewState.announcement` existir, a seção marque `data-overlay-active="true"` e renderize apenas a sobreposição e o ponto único de encerramento; não renderizar título, `Alert`, painéis de fase, `MatchSummary` nem demais elementos de fundo durante o anúncio, mantendo exatamente um `FinishMatchButton`.
- [X] T176 Atualizar `src/pages/live-match/LiveMatchPage.module.css` com o estado `[data-overlay-active='true']` para esconder conteúdo não essencial, manter o wrapper do encerramento visível na camada persistente e neutralizar qualquer `overflow`/animação de `.screen` que possa recortar ou rebaixar a sobreposição.
- [X] T177 Atualizar `src/features/match-closure/ui/FinishMatchButton.jsx` e `src/shared/ui/ConfirmDialog.jsx` para expor `data-layer="persistent-closure"` e `data-layer="confirm"` nos respectivos contêineres, garantindo que a confirmação continue em `createPortal` com `z-index: var(--z-confirm-dialog)` acima do anúncio e do botão persistente.
- [ ] T178 Executar `npm test`, `npm run lint` e `npm run build` a partir da raiz, corrigir regressões e validar manualmente no `quickstart.md` as fases de anúncio, a dispensa por clique/teclado, o scroll bloqueado, o botão persistente e a confirmação acima da sobreposição. (Automação concluída: 285 testes, lint e build OK; falta apenas a conferência visual manual no navegador.)

**Checkpoint**: em qualquer anúncio de tela cheia, nada além da sobreposição e do ponto único de encerramento fica visível/clicável; a confirmação permanece acima de tudo e o conteúdo da fase volta ao normal após a dispensa.

### Dependencies & Execution Order — Phase 21

- T170 (tokens) pode começar imediatamente e é pré-requisito de T172, T174 e T177.
- T166–T169 (testes) podem ser escritos em paralelo antes da implementação e devem falhar no estado atual.
- T171–T173 (overlay + scroll lock) dependem de T170; T173 depende de T171.
- T174 depende de T170 e T177; T175 depende de T174; T176 depende de T175.
- T178 depende de todas as tarefas anteriores da fase.

### Parallel Example: Phase 21

```bash
# Testes de regressão em paralelo (arquivos diferentes):
Task: "Ampliar tests/integration/accessibility.test.jsx (T166)"
Task: "Criar tests/integration/fullScreenOverlay.test.jsx (T167)"
Task: "Ampliar tests/integration/manualClosure.test.jsx (T168)"
Task: "Criar tests/unit/useBodyScrollLock.test.jsx (T169)"

# Implementação paralela após T170:
Task: "Isolar SpecialOverlay em portal e CSS opaco (T171, T172)"
Task: "Isolar FinishMatchButton na camada persistente (T174, T177)"
```

### Implementation Strategy — Phase 21

1. Escrever T166–T169 e confirmar as falhas atuais (barra de estatísticas e conteúdo de fundo visíveis, overlay sem portal, scroll não bloqueado).
2. Aplicar T170–T173 para isolar e opacizar a sobreposição.
3. Aplicar T174–T177 para restringir a camada persistente ao único botão de encerramento e manter a confirmação acima.
4. Validar com T178 e no roteiro manual; só então marcar o checkpoint da fase.

