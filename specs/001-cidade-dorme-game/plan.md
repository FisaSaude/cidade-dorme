# Plano de Implementação: Cidade Dorme — Aplicação de Apoio ao Narrador

**Branch**: `001-cidade-dorme-game` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)
**Input**: Especificação funcional em `specs/001-cidade-dorme-game/spec.md`

## Resumo

O plano implementa uma SPA React (JavaScript) para o narrador conduzir partidas presenciais do Cidade Dorme. A solução combina Feature-Sliced Design (FSD) para organizar o código por domínio com MVVM para separar View, ViewModel e Model. O núcleo do jogo será um motor puro e testável, independente de React, responsável pelo ciclo de fases, eliminações, vitória e encerramento.

A persistência usará o JSON Server para participantes e partidas finalizadas. As ações noturnas e investigações permanecem em memória durante a partida. A partida será persistida em uma única operação idempotente ao ser encerrada, com os `MatchParticipant` embutidos no documento da partida. Essa escolha evita escritas parciais e mantém o histórico e o ranking deriváveis dos dados persistidos.

O template Vite existente será preservado. Apenas o conteúdo de demonstração será substituído pela aplicação, e as dependências necessárias para persistência e testes serão adicionadas com justificativa.

## Contexto Técnico

**Linguagem/Versão**: JavaScript (ES2023+), React 19.3, Vite 8.3, Node.js 24 no ambiente de desenvolvimento.

**Dependências principais**: `react`, `react-dom`, `@vitejs/plugin-react` (já instalados); `json-server` para persistência simulada; `vitest`, `jsdom`, `@testing-library/react` e `@testing-library/user-event` para testes; `concurrently` para facilitar a execução conjunta da API simulada e do Vite.

**Persistência**: JSON Server em `http://localhost:3001`, persistindo em `db.json`. O cliente acessa `/api/*` por meio de proxy do Vite.

**Testes**: Vitest para regras de negócio puras e testes de ViewModel; jsdom + Testing Library para um conjunto reduzido de testes de integração de interface. Nenhuma ferramenta de teste está instalada atualmente.

**Plataforma-alvo**: Aplicação web local, executada em navegador moderno de desktop. Uso individual pelo narrador; layout responsivo é desejável, mas não há requisito de aplicativo móvel.

**Tipo de projeto**: SPA frontend com API simulada local (single project).

**Metas de desempenho**: Resposta de interface perceptivelmente imediata para partidas de dezenas de participantes; sem meta de throughput. Animações devem ser leves e não bloquear a operação.

**Restrições**: Sem TypeScript; sem autenticação; sem sorteio automático de papéis; sem persistência individual de ações noturnas; uma única sessão de partida por vez; sem exclusão de participantes; dados de participantes e partidas finalizadas devem sobreviver ao recarregamento do navegador.

**Escala/Escopo**: Um narrador, dezenas de participantes cadastrados, partidas com 5 ou mais participantes, histórico pequeno a moderado. Aproximadamente 5 telas principais e 1 fluxo central de partida.

**Incertezas**: Nenhum `NEEDS CLARIFICATION` técnico permanece após a pesquisa registrada em [research.md](./research.md). Decisões que dependem de aprovação do usuário estão listadas ao final deste plano.

## Verificação da Constituição

*GATE: verificação antes da pesquisa e reavaliação após o design.*

| Princípio / Restrição | Situação | Evidência no plano |
|---|---|---|
| I. Arquitetura e Organização | PASSA | FSD em camadas com regras de dependência explícitas; MVVM com ViewModels apenas onde há estado ou orquestração; regras de negócio no motor puro e nas entidades, fora de React e do acesso a dados. |
| II. Tecnologias e Padrões | PASSA | React com JavaScript; configuração Vite preservada; JSON Server como persistência; identificadores técnicos em inglês; documentação em português. |
| III. Qualidade de Código | PASSA | Motor puro com funções pequenas, erros de domínio tipados por código, repositórios injetáveis e dependências justificadas. Sem duplicação de dados persistidos. |
| IV. Interface e Experiência | PASSA | Tema dark/sombrio por tokens CSS, sobreposições de tela cheia reutilizáveis, animações opcionais e suporte a `prefers-reduced-motion`. |
| V. Testes e Confiabilidade | PASSA | Prioridade em testes puros de vitória, eliminação, ações, votação, encerramento e ranking; testes de UI apenas para fluxos críticos. |
| Restrições | PASSA | Sem TypeScript, autenticação ou sorteio; sem persistir ações noturnas individualmente; sem funcionalidades fora do escopo. |
| Evolução do Projeto | PASSA | Não há refatoração ampla. A substituição do conteúdo de demonstração do Vite é necessária e limitada. |

**Resultado**: nenhuma violação. A seção `Complexity Tracking` permanece vazia.

**Reavaliação pós-design**: o design mantém as regras de negócio fora da interface e do JSON Server, preserva as decisões da Constituição e não introduz dependências de roteamento, estado global ou componentes visuais de terceiros.

## Estrutura do Projeto

### Documentação (esta feature)

```text
specs/001-cidade-dorme-game/
├── plan.md              # Este arquivo
├── research.md          # Fase 0: decisões e alternativas
├── data-model.md        # Fase 1: entidades, invariantes e transições
├── quickstart.md        # Fase 1: roteiro de validação
├── contracts/
│   ├── json-server-api.md   # Contrato da API simulada
│   └── match-engine.md      # Contrato de comandos do motor
├── checklists/
│   └── requirements.md
└── tasks.md             # NÃO criado nesta etapa (/speckit.tasks)
```

### Código-fonte (raiz do repositório)

```text
cidade-dorme/
├── db.json
├── index.html
├── jsconfig.json
├── package.json
├── vite.config.js
├── public/
├── src/
│   ├── main.jsx
│   ├── app/
│   │   ├── App.jsx
│   │   ├── navigation/
│   │   │   ├── screens.js
│   │   │   └── useAppNavigation.js
│   │   ├── providers/
│   │   │   ├── AppProviders.jsx
│   │   │   └── MatchSessionProvider.jsx
│   │   └── styles/
│   │       ├── tokens.css
│   │       ├── global.css
│   │       └── animations.css
│   ├── pages/
│   │   ├── participants/
│   │   ├── match-setup/
│   │   ├── live-match/
│   │   ├── history/
│   │   └── ranking/
│   ├── widgets/
│   │   ├── app-header/
│   │   ├── participants-table/
│   │   ├── match-status-bar/
│   │   └── match-summary/
│   ├── features/
│   │   ├── participant-form/
│   │   ├── match-configuration/
│   │   ├── assassins-phase/
│   │   ├── detectives-phase/
│   │   ├── dawn-and-voting/
│   │   ├── match-closure/
│   │   ├── special-announcement/
│   │   ├── match-history/
│   │   └── participant-ranking/
│   ├── entities/
│   │   ├── participant/
│   │   │   ├── api/participantRepository.js
│   │   │   ├── model/participant.js
│   │   │   ├── ui/ParticipantName.jsx
│   │   │   └── index.js
│   │   ├── match/
│   │   │   ├── api/matchRepository.js
│   │   │   ├── model/matchEngine.js
│   │   │   ├── model/matchSession.js
│   │   │   ├── model/matchPhases.js
│   │   │   ├── model/matchConfiguration.js
│   │   │   ├── model/victory.js
│   │   │   ├── ui/MatchOutcomeBadge.jsx
│   │   │   └── index.js
│   │   └── match-participant/
│   │       ├── model/playerRole.js
│   │       ├── model/playerStatus.js
│   │       ├── model/matchParticipant.js
│   │       ├── ui/PlayerBadge.jsx
│   │       └── index.js
│   └── shared/
│       ├── api/httpClient.js
│       ├── config/env.js
│       ├── config/labels.js
│       ├── lib/errors.js
│       ├── lib/id.js
│       ├── lib/date.js
│       ├── lib/useAsyncData.js
│       └── ui/
│           ├── Button.jsx
│           ├── SelectField.jsx
│           ├── TextField.jsx
│           ├── ConfirmDialog.jsx
│           ├── SpecialOverlay.jsx
│           ├── Alert.jsx
│           ├── EmptyState.jsx
│           └── LoadingState.jsx
├── tests/
│   ├── setup.js
│   ├── fixtures/
│   ├── unit/
│   └── integration/
└── specs/
```

Dentro de cada página e feature, os arquivos seguem o padrão `*.jsx` (View), `use*ViewModel.js` (ViewModel) e `model/` (regras de apresentação/uso). Não será criado um arquivo por função; os slices mantêm tamanho proporcional ao domínio.

**Decisão de estrutura**: projeto único, com o código da aplicação em `src/` seguindo FSD e os testes fora de `src/` para deixar clara a separação entre código de produção e verificação. O alias `@` apontará para `src/`. `db.json` fica na raiz para ser o arquivo observado pelo JSON Server.
## 1. Arquitetura proposta e justificativas

### 1.1 Feature-Sliced Design

O código será organizado nas camadas `app`, `pages`, `widgets`, `features`, `entities` e `shared`. A regra de dependência é descendente: uma camada só pode importar camadas estritamente inferiores.

| Camada | Responsabilidade | Pode importar |
|---|---|---|
| `app` | Composição da aplicação, navegação, providers globais, sessão da partida e estilos globais. | `pages`, `widgets`, `features`, `entities`, `shared` |
| `pages` | Montagem das telas; conecta ViewModels, widgets e features. Não contém regra de jogo. | `widgets`, `features`, `entities`, `shared` |
| `widgets` | Blocos visuais compostos e reutilizáveis, como cabeçalho, tabela de participantes e resumo da partida. | `features`, `entities`, `shared` |
| `features` | Ações do narrador e casos de uso: configurar partida, conduzir fases, registrar votação, encerrar, consultar histórico e ranking. | `entities`, `shared` |
| `entities` | Entidades, enums, invariantes, motor de partida, repositórios e pequenos componentes visuais da entidade. | `shared` e APIs públicas de entidades relacionadas |
| `shared` | Componentes visuais genéricos, cliente HTTP, erros, utilitários e configuração. Não conhece o domínio. | Bibliotecas externas |

Regras complementares:

- Features não importam outras features. Quando duas features precisam compartilhar algo, a lógica desce para `entities` ou o componente é composto pela página.
- Cada slice expõe uma API pública em `index.js`; imports profundos entre slices são evitados.
- `shared` não importa nenhuma camada interna.
- O motor do jogo não importa React, `fetch`, JSON Server ou componentes.
- A comunicação entre features ocorre pela página ou pelo ViewModel global da sessão, nunca por import lateral.

Justificativa: o projeto tem um domínio pequeno, mas com regras críticas. FSD evita uma pasta única de componentes e deixa explícito onde cada responsabilidade vive. A profundidade foi limitada a seis camadas e a poucos slices por camada para não fragmentar o código.

### 1.2 MVVM

| Papel | Onde fica | Responsabilidade |
|---|---|---|
| Model | `entities/*/model`, `entities/*/api`, `features/*/model` | Entidades, enums, motor puro, validações de domínio, cálculo de ranking, repositórios e casos de uso sem React. |
| ViewModel | `use*ViewModel.js` em `pages`/`features` e `MatchSessionProvider` | Estado de apresentação, orquestração de comandos, tratamento de erros, mensagens, persistência e derivação de dados para a View. |
| View | Arquivos `.jsx` em `pages`, `widgets`, `features/*/ui`, `entities/*/ui` e `shared/ui` | Renderização declarativa, acessibilidade e eventos do usuário. Não chama `fetch`, não calcula vitória e não altera status. |

Fluxo unidirecional:

```text
View --(evento)--> ViewModel --(comando)--> Model/Engine --(novo estado)--> ViewModel --> View
```

- A View recebe `viewState` e `actions` do ViewModel.
- O ViewModel não renderiza JSX.
- O Model não conhece o ViewModel.
- Repositórios são injetados em `AppProviders` para permitir testes com implementações falsas.
- Erros de domínio carregam códigos em inglês; o ViewModel os traduz para mensagens em português.
- Regras de apresentação (rótulos, formatação de data, quais seções aparecem) ficam no ViewModel ou em `shared/config/labels.js`; regras de jogo ficam no Model.

### 1.3 Quando não criar ViewModel

Não haverá ViewModel para componentes puramente apresentacionais: `Button`, `TextField`, `SelectField`, `Alert`, `EmptyState`, `LoadingState`, `PlayerBadge`, `ParticipantName` e `MatchOutcomeBadge`. Esses componentes recebem props e disparam callbacks.

ViewModels existirão apenas onde há estado relevante ou orquestração:

- `useParticipantsViewModel`: carregamento, formulário, criação e edição.
- `useMatchSetupViewModel`: seleção de participantes, atribuição de papéis e validação.
- `MatchSessionProvider`: sessão global da partida, fases, ações e persistência final.
- `useLiveMatchViewModel`: derivação de dados da tela, ações da View e mensagens.
- `useHistoryViewModel` e `useRankingViewModel`: carregamento e derivação de dados.
- `useAppNavigation`: tela atual e bloqueio de nova partida enquanto houver sessão ativa.

## 2. Modelagem de dados (resumo)

A modelagem detalhada está em [data-model.md](./data-model.md).

- **Participant**: `id`, `name`. Nome obrigatório, normalizado por `trim` e único sem diferenciar maiúsculas/minúsculas.
- **Match**: `id`, `status`, `closureReason`, `winner`, `startedAt`, `endedAt`, `turnCount` e `participants`.
- **MatchParticipant** (entidade de domínio, embutida na partida persistida): `id`, `participantId`, `role`, `status`, `eliminatedAt`.
- **Enums**: `PlayerRole` (`INNOCENT`, `ASSASSIN`, `DETECTIVE`), `PlayerStatus` (`ALIVE`, `DEAD`), `MatchStatus` (`IN_PROGRESS`, `FINISHED`), `MatchWinner` (`INNOCENTS`, `ASSASSINS`) e `MatchClosureReason` (`VICTORY`, `MANUAL`).
- **Fases da partida**: `TURN_START`, `ASSASSINS_ANNOUNCEMENT`, `ASSASSINS_ACTIONS`, `DETECTIVES_ANNOUNCEMENT`, `DETECTIVES_ACTIONS`, `DAWN_ANNOUNCEMENT`, `DAWN_RESULT`, `VOTING` e `FINISHED`.

Ajustes em relação à proposta inicial:

1. `MatchParticipant` não armazena nome do participante. O nome é obtido pelo `participantId` na coleção de participantes, preservando a regra de que a edição do nome aparece no histórico.
2. `MatchParticipant.eliminatedAt` registra turno e fase (`NIGHT` ou `VOTE`) da eliminação, atendendo ao “momento da eliminação” da especificação sem persistir cada ação noturna.
3. `Match.closureReason` diferencia vitória de encerramento manual. `winner` é `null` no encerramento manual.
4. `turnCount` representa turnos encerrados. O turno corrente é derivado como `turnCount + 1` durante a partida. Um encerramento manual não incrementa o turno em andamento.
5. Não há entidade persistida de turno, ação de assassinato, investigação ou voto. Esses dados são de sessão e não entram no JSON Server.
6. O ranking não é persistido; é calculado a partir das partidas finalizadas.

A modelagem atende aos requisitos. O único ajuste estrutural relevante é a forma de persistência: `MatchParticipant` é embutido no documento de `Match`, em vez de ser uma coleção independente. A justificativa está na seção 5.

## 3. Organização das regras de negócio

### 3.1 Motor puro

As regras ficam em `src/entities/match/model/`:

- `matchConfiguration.js`: validação de configuração e atribuição de papéis.
- `matchEngine.js`: máquina de estados e comandos da partida.
- `victory.js`: avaliação das condições de vitória.
- `matchPhases.js`: enums e transições permitidas.
- `matchSession.js`: forma do estado de sessão e seletores puros (`getAliveParticipants`, `getAliveAssassins`, `getAliveDetectives`, `getEligibleTargets`, etc.).

O motor é composto por funções puras e um redutor:

```text
createMatchSession(config, context) -> MatchSession
dismissAnnouncement(session) -> MatchSession
setAssassinTarget(session, actorId, targetId | null) -> MatchSession
resolveAssassinsPhase(session, endedAt) -> MatchSession
setInvestigation(session, detectiveId, targetId | null) -> MatchSession
resolveDetectivesPhase(session) -> MatchSession
startVoting(session) -> MatchSession
registerVote(session, result, endedAt) -> MatchSession
finishManually(session, endedAt) -> MatchSession
```

Cada comando valida fase, ator, alvo e estado antes de produzir uma nova sessão. Comandos inválidos lançam `GameRuleError` com um código estável, por exemplo `INVALID_PHASE`, `ACTOR_NOT_ALIVE`, `TARGET_NOT_ALIVE`, `TARGET_IS_SELF`, `VOTE_ALREADY_REGISTERED` e `MATCH_ALREADY_FINISHED`.

### 3.2 Ciclo de fases

| Fase | Ação do narrador | Próxima fase |
|---|---|---|
| `TURN_START` | Dispensar “Cidade Dorme”. | `ASSASSINS_ANNOUNCEMENT` |
| `ASSASSINS_ANNOUNCEMENT` | Dispensar “Assassinos Acordem”. | `ASSASSINS_ACTIONS` |
| `ASSASSINS_ACTIONS` | Registrar alvos opcionais e processar as ações. | Vitória: `FINISHED`; senão, `DETECTIVES_ANNOUNCEMENT` se houver detetive vivo; senão, `DAWN_ANNOUNCEMENT`. |
| `DETECTIVES_ANNOUNCEMENT` | Dispensar “Detetives Acordem”. | `DETECTIVES_ACTIONS` |
| `DETECTIVES_ACTIONS` | Registrar investigações opcionais e concluir. | `DAWN_ANNOUNCEMENT` |
| `DAWN_ANNOUNCEMENT` | Dispensar “Cidade Acorda”. | `DAWN_RESULT` |
| `DAWN_RESULT` | Ler o resultado da noite e prosseguir. | `VOTING` |
| `VOTING` | Registrar eliminado ou empate. | Vitória: `FINISHED`; senão, novo turno em `TURN_START`. |
| `FINISHED` | Consultar resultado e encerrar. | — |

Regras de sequenciamento:

- A fase dos detetives é completamente omitida quando não há detetive vivo.
- As eliminações dos assassinos são aplicadas em conjunto ao final de `ASSASSINS_ACTIONS`.
- A avaliação de vitória acontece imediatamente após essas eliminações. Se houver vitória, não há fase dos detetives, “Cidade Acorda” nem votação.
- A avaliação de vitória acontece novamente após o registro da votação. Se houver vitória, não há novo turno.
- A fase dos detetives não altera o status de ninguém, portanto não dispara nova checagem de vitória.
- O encerramento manual pode ocorrer em qualquer fase, inclusive durante uma sobreposição, e interrompe o fluxo imediatamente.

### 3.3 Processamento de eliminações e votos

- Cada assassino vivo pode indicar no máximo um alvo vivo diferente de si mesmo; pode não indicar alvo.
- Vários assassinos podem indicar o mesmo alvo. O conjunto de alvos é deduplicado antes da eliminação.
- Assassinos podem escolher outros assassinos como alvo.
- As ações são simultâneas: um assassino eliminado na mesma resolução ainda tem sua escolha aplicada. Essa é a interpretação coerente com o processamento conjunto exigido pela especificação e está marcada para confirmação.
- Detetives só agem depois das eliminações noturnas; um detetive morto naquela noite não investiga.
- A investigação revela o papel do alvo, mas não altera status, papéis ou contagem de vivos.
- A votação aceita somente um participante vivo ou empate. Não há votos individuais.
- Empate não elimina ninguém.
- Um participante escolhido por vários assassinos é eliminado uma única vez.
- Um alvo já morto não pode ser escolhido; a interface filtra e o motor rejeita.

### 3.4 Condições de vitória

A função `evaluateVictory(session)` considera apenas participantes vivos:

1. Se não houver assassinos vivos, vencem os inocentes e detetives (`INNOCENTS`).
2. Se o número de assassinos vivos for maior ou igual à soma de inocentes e detetives vivos, vencem os assassinos (`ASSASSINS`).
3. Caso contrário, a partida continua.

A ordem acima resolve o caso teórico de ambas as condições. A especificação considera que as duas não podem ocorrer simultaneamente com participantes no jogo.

### 3.5 Integridade e prevenção de inconsistências

- O motor só aceita comandos na fase correspondente.
- A interface filtra executores e alvos, mas o motor revalida tudo.
- O estado `FINISHED` não aceita novas ações, votos ou outro encerramento.
- O ViewModel mantém uma flag de persistência em andamento e um `savedMatchId`; o encerramento é idempotente.
- A gravação final usa `PUT /matches/:id` com ID gerado no cliente. Repetir a gravação substitui o mesmo documento em vez de duplicá-lo.
- O `turnCount` só é incrementado quando um turno é encerrado. O encerramento manual não conta o turno em andamento.
- Ações e investigações do turno são limpas ao iniciar o próximo turno.
- A partida em memória é a fonte de verdade durante a condução; o JSON Server só recebe o resultado final.

## 4. Gerenciamento de estado

### 4.1 Estado de sessão (temporário)

`MatchSessionProvider` mantém, via `useReducer`/estado local, a partida em andamento:

```text
MatchSession
├── match: Match                 # id, startedAt, turnCount, status, winner, closureReason
├── phase: MatchPhase
├── currentTurn: number          # turnCount + 1 durante a partida
├── assassinTargets: Record<actorId, targetId | null>
├── investigations: Record<detectiveId, { targetId, revealedRole } | null>
├── nightResult: { eliminatedParticipantIds } | null
├── voteResult: { type: "ELIMINATION", participantId } | { type: "TIE" } | null
```

Persistência (ViewModel, separado da sessão): { state, savedMatchId, error }

O estado de sessão contém apenas IDs. Nomes, papéis exibidos e rótulos são derivados da coleção de participantes ou dos `MatchParticipant` da sessão. Nada desse estado é persistido individualmente. O estado de persistência fica no ViewModel, não no domínio.

### 4.2 Estado remoto e estado local de apresentação

- **Remoto**: participantes e partidas finalizadas. Cada página carrega o que precisa com `useAsyncData`, sem cache global sofisticado. O volume é pequeno.
- **Local de tela**: campos de formulário, diálogo de confirmação aberto, mensagens de erro/sucesso, estado de carregamento. Fica no ViewModel da página.
- **Global**: apenas a sessão da partida e os serviços injetados (repositórios, relógio, gerador de IDs) em `AppProviders`.
- **Persistência final**: estado no ViewModel da sessão (`idle`, `saving`, `saved`, `error`).

### 4.3 Atualização, fechamento e recarregamento

Estratégia adotada: **sem recuperação de partida em andamento**. Se o navegador for recarregado ou fechado, a sessão em memória é perdida, a partida não é contabilizada e o narrador precisa iniciá-la novamente. Participantes e partidas já finalizadas permanecem no JSON Server.

Justificativa: é a estratégia mais simples que atende à especificação. Persistir a partida em andamento exigiria versionamento de sessão, recuperação de fase, restauração de ações e tratamento de dados órfãos, sem requisito correspondente.

Limitações:

- Não há retomada de partida após `F5`, fechamento da aba ou queda do navegador.
- Não há persistência de ações noturnas ou investigações.
- A aplicação assume uma única aba e um único narrador.
- Caso se deseje recuperação no futuro, o caminho natural é `sessionStorage` ou persistir um rascunho versionado; isso não faz parte deste escopo.
## 5. Persistência com JSON Server

### 5.1 Arquivo `db.json`

```json
{
  "participants": [
    { "id": "uuid-do-participante", "name": "Ana" }
  ],
  "matches": [
    {
      "id": "uuid-da-partida",
      "status": "FINISHED",
      "closureReason": "VICTORY",
      "winner": "INNOCENTS",
      "startedAt": "2026-11-14T20:00:00.000Z",
      "endedAt": "2026-11-14T20:35:00.000Z",
      "turnCount": 3,
      "participants": [
        {
          "id": "uuid-da-participacao",
          "participantId": "uuid-do-participante",
          "role": "INNOCENT",
          "status": "ALIVE",
          "eliminatedAt": null
        },
        {
          "id": "uuid-de-outra-participacao",
          "participantId": "uuid-de-outro-participante",
          "role": "ASSASSIN",
          "status": "DEAD",
          "eliminatedAt": { "turn": 3, "phase": "VOTE" }
        }
      ]
    }
  ]
}
```

Decisões:

- `MatchParticipant` é uma entidade de domínio, mas seus registros são embutidos em `Match` na persistência. Isso torna o encerramento uma única escrita atômica por documento e elimina a possibilidade de partida finalizada com participantes parcialmente gravados.
- Nomes de participantes não são duplicados na partida. O histórico resolve o nome atual por `participantId`.
- Ações noturnas, investigações e votos por turno não são persistidos. Apenas o status final e o momento da eliminação são registrados.
- Partidas só são gravadas quando encerradas. Portanto, os registros existentes em `matches` têm `status: "FINISHED"`. O enum `IN_PROGRESS` existe no domínio para a sessão, mas não é persistido na estratégia atual.
- `turnCount` é o número de turnos encerrados. No encerramento manual, o turno em andamento não é contado.
- O ranking e as contagens de sobreviventes são derivados; não há coleção de ranking.
- O arquivo inicial pode ser `{ "participants": [], "matches": [] }`. Os dados são alterados pelo JSON Server durante o uso local.

### 5.2 Operações

| Operação | Endpoint | Observação |
|---|---|---|
| Listar participantes | `GET /participants` | Ordenação alfabética pode ser feita no cliente. |
| Criar participante | `POST /participants` | ID UUID gerado no cliente. |
| Editar participante | `PATCH /participants/:id` | Validação de nome único no ViewModel. |
| Listar partidas finalizadas | `GET /matches?status=FINISHED&_sort=endedAt&_order=desc` | Usada por histórico e ranking. |
| Consultar partida | `GET /matches/:id` | Detalhe do histórico. |
| Gravar partida finalizada | `PUT /matches/:id` | Upsert idempotente com `MatchParticipant` embutidos. |
| Verificar existência | `GET /matches/:id` | Usado apenas em recuperação/diagnóstico, se necessário. |

Não há exclusão de participantes nem de partidas no escopo. Não há endpoints de turnos, ações ou investigações.

O cliente acessa `/api/*`; o Vite reescreve para o JSON Server em `localhost:3001`. O contrato completo está em [contracts/json-server-api.md](./contracts/json-server-api.md).

### 5.3 Criação, atualização e consulta de participantes

- Criar: validar nome obrigatório, `trim`, e comparar com a lista atual usando minúsculas e remoção de espaços nas extremidades. Nome repetido é bloqueado com mensagem explicativa.
- Editar: mesma validação, excluindo o próprio participante da comparação. A edição preserva o ID, portanto o vínculo com partidas antigas permanece.
- Consultar: carregar todos e ordenar alfabeticamente para exibição.
- A unicidade é garantida no cliente. O JSON Server não impõe restrição de unicidade; como há um único narrador, isso é suficiente. Um middleware customizado não é justificado nesta etapa.

### 5.4 Registro e consulta de partidas

- Iniciar partida não grava nada. A sessão é mantida em memória.
- Ao encerrar por vitória ou manualmente, o ViewModel monta o documento final com `status: "FINISHED"`, `closureReason`, `winner`, datas, `turnCount` e a lista de `MatchParticipant` com status final.
- A gravação é feita com `PUT /matches/:id`. Como o ID é gerado no início da partida, uma nova tentativa sobrescreve o mesmo documento.
- Se a gravação falhar, o resultado continua visível na tela com aviso e opção “Tentar novamente”. O histórico só passa a exibir a partida após a gravação bem-sucedida.
- O histórico consulta apenas partidas finalizadas e resolve os nomes atuais dos participantes.
- A edição posterior de um participante altera o nome exibido no histórico, conforme a especificação.

### 5.5 Ranking

O ranking é calculado no cliente a partir de todas as partidas finalizadas:

1. Criar um mapa de contagem iniciado com zero para todos os participantes cadastrados.
2. Para cada partida finalizada, incrementar a contagem de cada `MatchParticipant` com `status: "ALIVE"`.
3. Ordenar por contagem decrescente e, em empate, por nome em ordem alfabética (`Intl.Collator('pt-BR', { sensitivity: 'base' })`).
4. Partidas em andamento não existem na persistência atual e, por segurança, qualquer documento com status diferente de `FINISHED` é ignorado.

Nenhuma informação de ranking é duplicada no banco.

### 5.6 Integridade da persistência

O JSON Server não oferece transações entre recursos. O documento de partida embutido reduz o encerramento a uma única escrita. A idempotência do `PUT` cobre duplo clique, repetição de tentativa e efeitos do React StrictMode. O motor impede encerramento duplo; o ViewModel também guarda `savedMatchId` para não regravar sem necessidade.

Riscos residuais: o JSON Server não valida esquema; os repositórios farão validação mínima das respostas e lançarão `ApiError` em caso de formato inesperado. A unicidade de nomes não é transacional entre abas; o cenário é fora do escopo de uso.

## 6. Interface e experiência

### 6.1 Telas e fluxos

| Tela | Conteúdo principal | ViewModel |
|---|---|---|
| Participantes | Lista, criação e edição; mensagens de nome obrigatório/duplicado; estado vazio. | `useParticipantsViewModel` |
| Configuração da partida | Seleção de participantes, papel por participante (inocente padrão, assassino, detetive), resumo de contagens, bloqueios de mínimo de 5 e ao menos um assassino. | `useMatchSetupViewModel` |
| Partida | Barra de status (turno, fase, vivos/mortos), sobreposições, ações de assassinos, investigações, amanhecer, votação, resultado e encerramento manual. | `MatchSessionProvider` + `useLiveMatchViewModel` |
| Histórico | Lista de partidas finalizadas; detalhe com participantes, papéis, status final, turnos e resultado. | `useHistoryViewModel` |
| Ranking | Participantes ordenados por sobrevivências; todos os cadastrados, inclusive com zero. | `useRankingViewModel` |

Fluxo principal:

1. O narrador cadastra participantes.
2. Seleciona pelo menos cinco e atribui manualmente assassinos e detetives. O restante vira inocente.
3. Inicia a partida. O turno 1 começa com “Cidade Dorme”.
4. Dispensa as sobreposições por clique e registra as ações noturnas.
5. Ao final da noite, vê o resultado, registra a votação e continua.
6. Em vitória ou encerramento manual, vê o resultado imediatamente; a partida é persistida.
7. Histórico e ranking refletem apenas partidas finalizadas.

### 6.2 Sobreposições reutilizáveis

`shared/ui/SpecialOverlay.jsx` será um componente genérico, sem conhecimento das regras do jogo:

```text
<SpecialOverlay
  title="Cidade Dorme"
  onDismiss={dismissAnnouncement}
  footerAction={<FinishMatchButton ... />}
/>
```

- O mapa fase → frase fica em `features/special-announcement/model/announcements.js`, não no motor.
- O componente cobre toda a tela com `position: fixed; inset: 0`, `role="dialog"`, `aria-modal="true"` e instrução “Clique para continuar”.
- A dispensa ocorre apenas por clique (ou Enter/Espaço para acessibilidade); não há temporizador.
- O slot `footerAction` permite o botão “Encerrar partida” durante a sobreposição, com `stopPropagation` para não dispensar a tela. O diálogo de confirmação fica acima da sobreposição.
- Animações de entrada/saída usam CSS e são desativadas por `prefers-reduced-motion`. A informação nunca depende de animação.

### 6.3 Fases e controles

- **Ações dos assassinos**: uma linha por assassino vivo, com seletor de alvo entre vivos diferentes dele e opção “Sem alvo”. Botão para processar a fase.
- **Investigações**: uma linha por detetive vivo; ao escolher o alvo, o papel é revelado imediatamente ao narrador. Botão para concluir.
- **Amanhecer**: nomes dos eliminados ou “Ninguém foi assassinado nesta noite”. Botão para prosseguir.
- **Votação**: seleção de um participante vivo ou opção “Houve empate”; confirmação. Participantes mortos não aparecem.
- **Resultado**: lado vencedor ou indicação de encerramento manual, sobreviventes, eliminados, número de turnos e estado de persistência.
- **Encerramento manual**: disponível em todas as fases, com confirmação; cancelar mantém o estado anterior.

### 6.4 Identidade visual

- Tokens CSS em `app/styles/tokens.css`: fundo quase preto, superfícies cinza-azuladas, texto marfim, acento vinho/sangue, tipografia serifada para títulos e sans-serif para dados.
- Atmosfera com gradientes, vinheta e névoa sutil em CSS. Sem imagens externas ou fontes remotas, para não criar dependência de rede.
- Componentes usam CSS Modules; o tema global usa variáveis CSS.
- Contraste adequado, foco visível, rótulos textuais para papéis/status (não depender apenas de cor).
- Animações são progressivas: a interface funciona plenamente com movimento reduzido.

## 7. Estratégia de testes

### 7.1 Camadas

1. **Testes unitários de domínio (prioridade máxima)**: motor puro, sem React, sem rede e sem DOM.
2. **Testes de casos de uso/ViewModel**: validação de configuração, orquestração de persistência e mensagens, usando repositórios falsos e relógio/gerador de IDs injetados.
3. **Testes de integração de interface (conjunto reduzido)**: sobreposição, confirmação de encerramento, bloqueios de configuração e ausência de mortos nas listas.
4. **Validação manual**: roteiro em [quickstart.md](./quickstart.md), incluindo JSON Server real.

Não haverá testes E2E automatizados nesta etapa; o custo de Playwright/Cypress não se justifica para um app local de um usuário.

### 7.2 Cobertura prioritária

| Área | Casos principais |
|---|---|
| Vitória | Último assassino eliminado; assassinos em paridade; assassinos em superioridade; verificação após a noite; verificação após votação; interrupção do fluxo. |
| Eliminação | Alvos duplicados eliminados uma vez; alvos distintos; morte noturna e por votação; alvo morto bloqueado. |
| Ações | Assassino/detetive morto não age; ator não escolhe a si; assassino pode escolher assassino; ação opcional; investigação não altera status. |
| Fases | Ordem das sobreposições; dispensa; fase de detetives omitida sem detetives vivos; vitória antes da fase dos detetives e da votação. |
| Votação | Eliminado vivo; empate sem morte; voto duplicado bloqueado; vitória após voto; novo turno. |
| Encerramento manual | Em cada fase, inclusive sobreposição; cancelamento; sem vencedor; status preservado; turno em andamento não contado; encerramento duplo bloqueado. |
| Ranking | Apenas finalizadas; sobreviventes contam; mortos não contam; empate alfabético; participantes com zero; partida em andamento ignorada. |
| Configuração | Menos de 5 bloqueado; sem assassino bloqueado; sem detetive permitido; um papel por participante; todos começam vivos. |
| Persistência | Nada é gravado antes do fim; `PUT` único; retry idempotente; falha exibe erro e permite nova tentativa. |
| Interface | Sobreposição em tela cheia dispensada por clique; confirmação de encerramento; mensagens de bloqueio; mortos ausentes de executores/alvos. |

### 7.3 Ferramentas e organização

- Vitest com ambiente `jsdom` e arquivo de setup para limpeza da Testing Library.
- Imports explícitos de `describe`, `it`, `expect` e `vi` para não depender de globais.
- Testes em `tests/unit` e `tests/integration`; fixtures compartilhadas em `tests/fixtures`.
- Repositórios falsos em memória; nenhum teste unitário deve depender do JSON Server.
- Comandos: `npm test` (`vitest run`) e `npm run test:watch`.
- `npm run lint` e `npm run build` continuam sendo verificações obrigatórias.

## 8. Dependências necessárias

| Dependência | Tipo | Justificativa |
|---|---|---|
| `json-server` | desenvolvimento | Persistência simulada exigida pela Constituição e pela especificação. |
| `vitest` | desenvolvimento | Test runner nativo do ecossistema Vite, compatível com a configuração existente. |
| `jsdom` | desenvolvimento | Ambiente DOM para os poucos testes de interface. |
| `@testing-library/react` | desenvolvimento | Testes de interface orientados ao comportamento do narrador. |
| `@testing-library/user-event` | desenvolvimento | Simulação de cliques e digitação nos fluxos críticos. |
| `concurrently` | desenvolvimento | Executar JSON Server e Vite com um único comando, reduzindo erro operacional. É uma conveniência pequena e justificada. |

Não serão adicionadas: biblioteca de roteamento (a navegação é interna e simples), biblioteca de estado global (Context + `useReducer` bastam), biblioteca de UI (o tema é específico), biblioteca de datas (ISO + `Intl` bastam), biblioteca de UUID (`crypto.randomUUID` com fallback) nem MSW/Playwright/Cypress.

As versões exatas serão fixadas no momento da instalação, verificando compatibilidade com Vite 8, React 19 e Node 24.

## 9. Sequência sugerida de implementação

1. **Preparação**: instalar dependências, criar scripts, configurar proxy `/api`, alias `@`, `jsconfig.json`, `db.json` e configurar Vitest.
2. **Fundação visual e compartilhada**: shell da aplicação, tokens CSS, componentes genéricos, cliente HTTP, erros e utilitários.
3. **Domínio**: enums, entidades, configuração de partida, motor de fases, vitória, eliminação e ranking, com testes unitários.
4. **Participantes**: repositório, ViewModel, tela de cadastro/edição e testes.
5. **Configuração da partida**: seleção, papéis, validações e testes.
6. **Sessão da partida**: provider, sobreposições, fases dos assassinos e detetives, amanhecer, votação e resultado.
7. **Encerramento e persistência**: vitória automática, encerramento manual, `PUT` idempotente, retry, histórico e ranking.
8. **Acabamento**: tema dark, acessibilidade, movimento reduzido, testes de integração, lint, build e validação do quickstart.

Cada etapa deve terminar com testes verdes e sem antecipar funcionalidades da etapa seguinte. A implementação detalhada será derivada em `tasks.md` na próxima fase do Spec Kit.

## 10. Riscos, limitações e decisões pendentes

### 10.1 Riscos e limitações

| Risco / limitação | Impacto | Mitigação |
|---|---|---|
| Recarregar ou fechar o navegador perde a partida em andamento. | O narrador precisa reiniciar a partida; ela não entra no histórico. | Documentado no quickstart e na tela; estratégia mais simples aceita. |
| Fechar a aba imediatamente após o encerramento, antes da gravação. | Partida finalizada pode não aparecer no histórico. | Resultado é exibido antes da gravação; falha gera aviso e “Tentar novamente”; JSON Server é local, tornando a escrita rápida. |
| JSON Server não impõe unicidade de nome nem esquema. | Nomes duplicados poderiam surgir em uso multiaba; dados inválidos poderiam ser gravados manualmente. | Validação no cliente, uso por um único narrador, validação mínima nas respostas. |
| Sem transações no JSON Server. | Gravação parcial se houvesse múltiplos recursos. | `MatchParticipant` embutido e `PUT` único/idempotente. |
| Partida em andamento não é persistida. | Nenhum dado órfão; por outro lado, não há recuperação. | Sessão em memória e gravação apenas no encerramento. |
| Uma única aba/sessão. | Duas abas podem divergir. | Fora do escopo; documentado. |
| Sem roteador. | Sem deep links nem botão voltar do navegador. | Navegação interna suficiente para o narrador; não há requisito de URL. |
| Nomes do histórico vêm do cadastro atual. | Edição altera o nome exibido em partidas antigas. | Comportamento exigido pela especificação. |
| Nome editado durante uma partida pode não atualizar a tela de partida até novo carregamento. | Pequena inconsistência visual. | Cenário não exigido; a partida usa IDs e a tela recarrega dados ao montar. |
| `crypto.randomUUID` depende de contexto seguro. | Indisponível fora de `localhost`/HTTPS. | Fallback em `shared/lib/id.js`; uso local em `localhost`. |
| Configuração com todos os participantes assassinos não é bloqueada pela spec. | A primeira resolução noturna pode declarar vitória dos assassinos imediatamente. | Não adicionar regra não prevista; registrar como decisão pendente. |
| Dependências de teste adicionam peso ao projeto. | Instalação maior. | Necessárias para a estratégia de testes; sem E2E. |

### 10.2 Decisões que necessitam de aprovação

| # | Decisão | Recomendação |
|---|---|---|
| D1 | Persistir `MatchParticipant` embutido em `Match` (uma escrita) em vez de coleção separada. | Aprovar. Mantém a entidade no domínio, evita escritas parciais e simplifica histórico/ranking. |
| D2 | Não recuperar partida em andamento após recarregar/fechar o navegador. | Aprovar. É a estratégia mais simples e não cria dados órfãos. |
| D3 | Contar o turno decisivo quando a vitória ocorre antes da votação (após a noite). | Aprovar. Evita histórico com zero turnos quando a partida termina na primeira noite; o turno foi conduzido até o desfecho. |
| D4 | Considerar nomes únicos sem diferenciar maiúsculas/minúsculas e após `trim`. | Aprovar. Evita ambiguidade na seleção. |
| D5 | Aplicar a ação de um assassino eliminado na mesma noite (resolução simultânea). | Aprovar. Coerente com o processamento conjunto exigido. |
| D6 | Navegação interna sem React Router. | Aprovar. Não há requisito de URL/deep link; reduz dependências. |
| D7 | Não bloquear configurações com todos os participantes assassinos, pois a spec só exige ao menos um assassino. | Aprovar a ausência de regra adicional ou definir uma validação futura. |
| D8 | Adotar as três interpretações remanescentes da spec (turno manual não conta; edição reflete no histórico; ranking inclui zeros) como aprovadas. | Confirmar, pois a própria spec pede confirmação antes do planejamento. |
| D9 | Adicionar `concurrently` e as dependências de teste. | Aprovar a instalação. |

## Rastreamento de Complexidade

Nenhuma violação da Constituição. Não há necessidade de justificar complexidade adicional.

## Saídas das Fases

- **Fase 0**: [research.md](./research.md)
- **Fase 1**: [data-model.md](./data-model.md), [contracts/json-server-api.md](./contracts/json-server-api.md), [contracts/match-engine.md](./contracts/match-engine.md), [quickstart.md](./quickstart.md)
- **Próxima fase**: `/speckit.tasks` (não executada aqui)

