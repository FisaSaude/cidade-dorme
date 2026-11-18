# Pesquisa: Cidade Dorme — Decisões Técnicas

**Feature**: `001-cidade-dorme-game`
**Data**: 2026-11-14
**Atualizado**: 2026-11-17
**Objetivo**: resolver as incertezas técnicas do plano antes do design detalhado, sem alterar requisitos aprovados. A revisão de 2026-11-17 cobre seleção padrão/em massa, exclusões, ponto único de encerramento e atualização em massa de status.

## 1. Análise da estrutura existente

### 1.1 O que já existe

- React 19.3 com JavaScript e JSX.
- Vite 8.3 com `@vitejs/plugin-react`.
- Oxlint configurado com regras de React (`react/rules-of-hooks`, `react/only-export-components`).
- Estrutura inicial plana: `src/App.jsx`, `src/main.jsx`, `src/App.css`, `src/index.css` e assets de demonstração do template.
- Nenhum roteador, biblioteca de estado, biblioteca de UI, cliente HTTP ou ferramenta de teste instalada.
- Nenhum JSON Server nem arquivo de banco simulado.
- `specs/001-cidade-dorme-game/spec.md` e `.specify/memory/constitution.md` presentes e válidos.
- Nenhum hook de extensão registrado em `.specify/extensions.yml`.

### 1.2 O que pode ser aproveitado

- `vite.config.js` e o plugin React.
- `index.html`, `main.jsx` e o pipeline de build/HMR.
- Oxlint e os scripts `dev`, `build`, `lint` e `preview`.
- A simplicidade do template: não há dívida técnica a preservar além da configuração.

### 1.3 Conflitos e lacunas

| Lacuna | Consequência | Tratamento no plano |
|---|---|---|
| Não há JSON Server. | Requisito de persistência não atendido. | Adicionar dependência de desenvolvimento e `db.json`. |
| Não há ferramenta de teste. | Regras críticas ficariam sem verificação automatizada. | Adicionar Vitest e Testing Library. |
| Estrutura plana. | Regras e UI tenderiam a se misturar. | Introduzir FSD + MVVM de forma proporcional. |
| Conteúdo de demonstração do Vite. | Não pertence ao produto. | Substituir `App.jsx`/CSS e remover assets de demo; preservar a configuração. |
| Sem roteador. | Necessário decidir navegação. | Navegação interna por estado; sem dependência adicional. |
| Sem biblioteca de estado. | Necessário decidir onde a sessão vive. | Context + `useReducer`; motor puro separado. |
| Sem esquema no JSON Server. | Dados podem ficar inconsistentes se editados manualmente. | Repositórios com validação mínima e uso local controlado. |

Não há conflito entre a Constituição, a especificação e a estrutura atual que exija reconstrução. A única substituição ampla é a remoção do conteúdo de exemplo do template, justificada pela natureza do produto.

## 2. Decisões

### D-R1 — Combinar FSD com MVVM

- **Decisão**: usar as camadas FSD `app`, `pages`, `widgets`, `features`, `entities` e `shared`; dentro delas, separar Model, ViewModel e View.
- **Justificativa**: a Constituição exige as duas abordagens. FSD dá limites claros por domínio; MVVM impede que regras de jogo vazem para componentes React.
- **Alternativas consideradas**: pastas por tipo (`components`, `hooks`, `services`) — simples, mas não expressa o domínio nem as regras de dependência; Clean Architecture completa — excessiva para o tamanho do projeto.

### D-R2 — Limitar a profundidade do FSD

- **Decisão**: não usar a camada `processes`; manter poucos slices e só criar `widgets` quando houver composição visual reutilizável real.
- **Justificativa**: a Constituição pede para evitar abstrações e fragmentação desnecessárias. O domínio tem cinco telas e um fluxo principal.
- **Alternativas consideradas**: FSD completo com muitos slices e segmentos — aumentaria navegação de código sem ganho proporcional.

### D-R3 — Sessão da partida com Context + `useReducer`

- **Decisão**: manter a sessão em `MatchSessionProvider`, usando estado local/`useReducer`, e o motor como funções puras.
- **Justificativa**: a sessão é única e global; Context resolve sem dependência. O redutor puro facilita testes.
- **Alternativas consideradas**: Zustand/Redux — dependência sem necessidade para um único store pequeno; estado na página — perderia a sessão ao navegar entre telas.

### D-R4 — Motor de jogo puro e independente de React

- **Decisão**: implementar `matchEngine.js` como conjunto de funções puras que recebem e retornam `MatchSession`, com erros de domínio por código.
- **Justificativa**: as regras mais críticas precisam ser testáveis sem DOM, sem rede e sem interface. A Constituição prioriza testes independentes da UI.
- **Alternativas consideradas**: classe com estado mutável — testável, mas mais fácil de usar incorretamente; XState — poderosa, mas dependência e conceitos extras para uma máquina pequena; regras em hooks — acoplaria as regras ao React.

### D-R5 — Embutir `MatchParticipant` no documento de `Match`

- **Decisão**: persistir a partida com um array `participants` de `MatchParticipant`, referenciando `participantId`, papel, status e momento da eliminação.
- **Justificativa**: o JSON Server não tem transações. Uma única escrita `PUT /matches/:id` elimina partidas parcialmente gravadas e simplifica histórico e ranking. Nomes não são duplicados; a entidade de domínio continua separada.
- **Alternativas consideradas**: coleção `/matchParticipants` separada com `_embed` — mais normalizada, mas exige múltiplas escritas e tratamento de falha parcial; snapshot com nomes — violaria a regra de exibir o nome atualizado no histórico.

### D-R6 — Gravar a partida apenas no encerramento

- **Decisão**: iniciar a partida somente em memória; persistir quando houver vitória ou encerramento manual.
- **Justificativa**: atende ao histórico e ao ranking sem persistir ações noturnas e sem deixar partidas órfãs. É a estratégia mais simples compatível com a especificação.
- **Alternativas consideradas**: persistir `IN_PROGRESS` no início — criaria registros sem possibilidade de retomada na estratégia atual; persistir cada fase — contraria a restrição de não persistir ações noturnas individualmente e adiciona complexidade.

### D-R7 — IDs UUID gerados no cliente e `PUT` idempotente

- **Decisão**: gerar IDs com `crypto.randomUUID()` (com fallback) e usar `PUT` para criar/atualizar a partida finalizada.
- **Justificativa**: permite repetir a gravação sem duplicar documentos e referenciar participantes antes de qualquer resposta do servidor.
- **Alternativas consideradas**: IDs automáticos do JSON Server — obrigariam `POST` e tornariam o retry não idempotente; sequência local — sujeita a colisões.

### D-R8 — Proxy do Vite para o JSON Server

- **Decisão**: cliente usa `/api/*`; `vite.config.js` faz proxy para `http://localhost:3001`.
- **Justificativa**: evita CORS no desenvolvimento e centraliza a URL. O JSON Server tem CORS habilitado, mas o proxy mantém o código do cliente independente da porta.
- **Alternativas consideradas**: URL absoluta com CORS — funciona, mas espalha configuração de ambiente; variável `VITE_API_BASE_URL` — mantida como override opcional.

### D-R9 — Navegação interna sem React Router

- **Decisão**: uma tela ativa em `useAppNavigation`, com identificadores de tela e parâmetros simples (por exemplo, detalhe do histórico).
- **Justificativa**: não há requisito de URL, deep link ou histórico do navegador. A aplicação tem cinco telas e um fluxo linear.
- **Alternativas consideradas**: React Router — dependência e configuração sem requisito correspondente. Limitação aceita: sem deep links e sem botão voltar do navegador.

### D-R10 — CSS Modules e tokens CSS

- **Decisão**: estilos globais em `app/styles`, tokens em CSS custom properties e CSS Modules por componente/página.
- **Justificativa**: Vite suporta CSS Modules nativamente; o tema dark é específico e não se beneficia de uma biblioteca de componentes. Evita dependência e permite animações controladas.
- **Alternativas consideradas**: Tailwind — utilitários e configuração extras; biblioteca de UI — identidade visual genérica e maior peso; CSS global único — maior risco de colisão.

### D-R11 — Sobreposição genérica e frases fora do motor

- **Decisão**: `SpecialOverlay` em `shared/ui` recebe apenas `title` e `onDismiss`; o mapa fase → frase fica em `features/special-announcement`. O encerramento manual não é um slot da sobreposição: fica em um ponto único persistente da tela da partida, acima dela, conforme D-R24.
- **Justificativa**: atende ao requisito de reutilização sem acoplar “Cidade Dorme”, “Assassinos Acordem”, “Detetives Acordem” e “Cidade Acorda” às regras de negócio. A mudança evita duplicar o botão em cada pop-up (FR-096–101).
- **Alternativas consideradas**: componente por frase — duplicação; sobreposição dentro do motor — acoplamento indevido; manter `footerAction` em cada sobreposição — contraria o ponto único aprovado.
- **Atualização 2026-11-17**: o slot `footerAction` foi removido; a sobreposição volta a ser somente dispensável.

### D-R12 — Testes com Vitest + Testing Library

- **Decisão**: Vitest para domínio, casos de uso e ViewModels; jsdom + Testing Library para poucos testes de interface. Cobrir atualização em massa de status, ranking com arquivados, exclusões e seleção padrão/em massa.
- **Justificativa**: nenhuma ferramenta está instalada; Vitest reaproveita a configuração Vite e é o caminho de menor atrito. A maior parte dos testes não precisa de DOM. As novas regras críticas de status e exclusão ficam testáveis sem interface.
- **Alternativas consideradas**: Jest — configuração extra para JSX/Vite; Playwright/Cypress — E2E desproporcional; apenas testes manuais — insuficiente para regras de vitória.

### D-R13 — Unicidade de nome no cliente

- **Decisão**: comparar nomes após `trim`, sem diferenciar maiúsculas/minúsculas, tanto na criação quanto na edição (excluindo o próprio registro), considerando apenas participantes **ativos** (`deletedAt` nulo). Participantes arquivados mantêm o último nome e não participam da validação.
- **Justificativa**: atende à especificação com um único narrador; o JSON Server não oferece constraint. Restringir ao cadastro ativo permite reutilizar nomes e preserva a identidade dos registros arquivados.
- **Alternativas consideradas**: middleware customizado no JSON Server — complexidade operacional sem requisito; comparação exata — permitiria “Ana” e “ana”, gerando ambiguidade; unicidade global incluindo arquivados — impediria reutilização prevista na spec.
- **Status**: aprovado (D4 na spec, atualizado em 2026-11-17).

### D-R14 — Contagem de turnos

- **Decisão**: `turnCount` conta turnos encerrados. O turno corrente é `turnCount + 1`. Encerramento manual não incrementa o turno em andamento. Vitória após a noite ou após a votação encerra o turno decisivo e o contabiliza.
- **Justificativa**: evita histórico com zero turnos em partidas decididas na primeira noite e respeita a regra explícita de não contar turno em andamento no encerramento manual.
- **Alternativas consideradas**: contar apenas turnos com votação concluída — deixaria partidas decididas à noite com zero turnos; contar qualquer turno iniciado — violaria a regra do encerramento manual.
- **Status**: aprovado (D3 no plano e na spec).

### D-R15 — Resolução simultânea das ações dos assassinos

- **Decisão**: registrar as escolhas enquanto os assassinos estão vivos, deduplicar alvos e aplicar todas as mortes juntas. Um assassino morto na mesma resolução ainda tem sua escolha aplicada.
- **Justificativa**: é a leitura coerente com “processar todas as escolhas conjuntamente” e com a possibilidade de assassinato entre assassinos. A investigação ocorre depois, então detetives mortos na noite não agem.
- **Alternativas consideradas**: cancelar ações de assassinos mortos na mesma noite — exigiria uma ordem interna não definida pela especificação.
- **Status**: aprovado (D5 no plano).

### D-R16 — Ranking derivado das partidas finalizadas

- **Decisão**: calcular no cliente a partir de `GET /matches?status=FINISHED` e de todos os participantes. Candidatos: ativos (inclusive com zero) e arquivados que aparecem em pelo menos uma partida finalizada remanescente. Contar `MatchParticipant` com `ALIVE`, usando os status finais após a eventual atualização em massa da vitória dos assassinos.
- **Justificativa**: evita duplicação e mantém uma única fonte de verdade. O volume é pequeno. Arquivados com contribuição histórica continuam representados; arquivados sem partidas saem do ranking.
- **Alternativas consideradas**: persistir ranking — risco de inconsistência após edição/correção; calcular no JSON Server — exigiria middleware customizado; incluir todos os arquivados — exibiria registros sem contribuição.
- **Atualização 2026-11-17**: inclui arquivados com partidas remanescentes, status finais da vitória dos assassinos e desempate estável por `participantId`.

### D-R17 — Sem recuperação após recarregar/fechar

- **Decisão**: perder a sessão em andamento; não criar registro de partida inacabada.
- **Justificativa**: estratégia mais simples; evita dados órfãos e recuperação parcial de ações não persistidas.
- **Alternativas consideradas**: `sessionStorage` — recuperaria apenas a aba e exigiria versionamento; persistir rascunho no JSON Server — mais complexo e fora do escopo.
- **Status**: aprovado (D2 no plano).

### D-R18 — Erros de domínio por código e tradução na apresentação

- **Decisão**: `GameRuleError` carrega códigos estáveis em inglês; o ViewModel traduz para mensagens em português. `ApiError` cobre falhas de rede/formato.
- **Justificativa**: mantém o domínio independente de textos de interface e permite testes por código, não por mensagem.
- **Alternativas consideradas**: lançar mensagens em português no motor — acoplamento e fragilidade em testes; retornar `null` — perde o motivo do bloqueio.

### D-R19 — Resolver nomes por referência, não por snapshot

- **Decisão**: persistir apenas `participantId`; histórico e ranking resolvem o nome atual na coleção de participantes, inclusive nos registros arquivados. A tela de partida carrega os participantes ativos para exibir nomes.
- **Justificativa**: atende à regra de que a edição do nome aparece no histórico e evita duplicação. O arquivamento preserva o último nome sem criar snapshot na partida.
- **Alternativas consideradas**: snapshot do nome na partida — ficaria desatualizado após edição e seria necessário para arquivados; duplicar nome em `MatchParticipant` — informação redundante.
- **Atualização 2026-11-17**: como participantes nunca são removidos fisicamente, a resolução por referência continua válida para arquivados.

### D-R20 — Não adicionar validação de esquema ou middleware

- **Decisão**: validação mínima nos repositórios e nas regras de domínio; sem Zod/Valibot e sem middleware de unicidade.
- **Justificativa**: uma única fonte de escrita controlada, app local e escopo pequeno. Dependências adicionais não se justificam.
- **Alternativas consideradas**: biblioteca de esquema — útil em APIs maiores, mas redundante aqui; middleware do JSON Server — operação extra para um cenário de um usuário.

### D-R21 — Arquivamento de participante com `deletedAt`

- **Decisão**: excluir um participante significa gravar `deletedAt` ISO no documento, mantendo o registro em `participants`. O cadastro e a configuração usam apenas `deletedAt == null`; histórico e ranking resolvem também os arquivados. Nunca usar `DELETE` físico em participantes.
- **Justificativa**: preserva o nome e a identidade sem snapshots, evita referências órfãs nas partidas e permite reutilizar o nome no cadastro ativo. Atende Q1 e FR-081–088.
- **Alternativas consideradas**: `DELETE` físico + snapshot de nome/participação — duplicaria dados e quebraria a regra de nome atual; bloquear exclusão com partidas — contraria a decisão Q1; coluna de arquivo separada — complexidade sem ganho.
- **Status**: aprovado em 2026-11-17 (Q1, A2, D10).

### D-R22 — Exclusão definitiva de partidas finalizadas

- **Decisão**: usar `DELETE /matches/:id` para remover partidas finalizadas. A operação é definitiva, isolada em `matches`, disponível apenas no histórico e não altera participantes nem outras partidas. `404` é tratado como já removida.
- **Justificativa**: atende FR-089–095 e A3/A5; o ranking é derivado e passa a ignorar a partida na próxima leitura.
- **Alternativas consideradas**: soft delete de partidas — não cumpre “remover permanentemente”; exclusão em cascata de participantes — alteraria cadastro e ranking sem requisito.
- **Status**: aprovado em 2026-11-17 (A3, A5, D11).

### D-R23 — Atualização em massa de status na vitória dos assassinos

- **Decisão**: quando `evaluateVictory` retorna `ASSASSINS`, aplicar uma função pura `applyAssassinsVictoryStatuses(session, phase)` antes de fechar e persistir: não assassinos vivos → `DEAD` com `eliminatedAt = { turn: currentTurn, phase }`; não assassinos já mortos mantêm o momento original; assassinos vivos permanecem `ALIVE`; assassinos mortos permanecem `DEAD`; papéis inalterados.
- **Justificativa**: atende FR-102–110 e Q2/Q3, mantém o motor puro e garante que histórico, resultado e ranking usem os status finais. A fase é `NIGHT` ou `VOTE`, conforme onde a vitória foi declarada.
- **Alternativas consideradas**: aplicar apenas na apresentação — persistiria status incorretos; ressuscitar assassinos mortos — contraria Q2 e a invariante de morte definitiva; registrar uma nova representação de morte — desnecessária para Q3.
- **Status**: aprovado em 2026-11-17 (Q2, Q3, D12).

### D-R24 — Ponto único de encerramento manual

- **Decisão**: manter um único `FinishMatchButton` em uma camada persistente de `widgets/match-status-bar`/`LiveMatchPage`, visível em todas as fases em andamento e acima das sobreposições. Remover o `footerAction` de `SpecialOverlay`/`SpecialAnnouncement`. A confirmação fica acima de ambos. Após `FINISHED`, o botão não é oferecido.
- **Justificativa**: atende FR-096–101 e A1, evita duplicação e mantém o encerramento acessível durante qualquer anúncio.
- **Alternativas consideradas**: repetir o botão em cada pop-up — proibido por FR-097; esconder durante sobreposição — falha FR-098; mover o encerramento para o menu de navegação — menos consistente na condução.
- **Status**: aprovado em 2026-11-17 (A1, D13).

### D-R25 — Seleção padrão, ações em massa e memória de papéis

- **Decisão**: o rascunho de configuração separa `selectedIds` de `roles`. Ao carregar os participantes ativos, todos começam selecionados; `selectAll`/`deselectAll` alteram apenas `selectedIds`; o papel atribuído é guardado por `participantId` e preservado ao desmarcar/remarcar. A contagem e a validação de mínimo são recalculadas após cada alteração.
- **Justificativa**: atende FR-075–080 e A4, reduz o esforço do narrador e evita perda acidental de configuração.
- **Alternativas consideradas**: começar sem seleção — contraria FR-075; armazenar papel apenas nos selecionados — perde o papel ao desmarcar; revalidar somente no envio — falha FR-080.
- **Status**: aprovado em 2026-11-17 (A4, D14).

## 3. Unknowns resolvidos

| Unknown inicial | Resolução |
|---|---|
| Como persistir partidas e participantes de partida sem transações? | Documento de partida com `MatchParticipant` embutido e `PUT` idempotente. |
| Onde manter a sessão e as ações noturnas? | `MatchSessionProvider` em memória; motor puro; nada de ações no JSON Server. |
| Como organizar FSD e MVVM sem fragmentar? | Camadas FSD, poucos slices e ViewModels apenas em telas/fluxos com estado. |
| Como testar sem ferramentas instaladas? | Vitest + Testing Library; testes de domínio independentes de DOM. |
| Como reutilizar sobreposições sem acoplar regras? | Componente genérico em `shared/ui` + mapa de frases na feature. |
| Como navegar sem roteador? | Estado de tela em `useAppNavigation`. |
| O que acontece ao recarregar? | Sessão perdida; partida não contabilizada; dados finalizados permanecem. |
| Como evitar encerramento duplo? | Estado `FINISHED`, guarda no ViewModel, `savedMatchId` e `PUT` idempotente. |
| Como calcular ranking? | Derivação de partidas finalizadas + participantes ativos e arquivados com partidas remanescentes. |
| Como garantir nome único? | Normalização e comparação no cliente, incluindo edição, restrita ao cadastro ativo. |
| Como excluir participante sem quebrar histórico/ranking? | Arquivamento com `deletedAt`; registro permanece e nome é preservado. |
| Como excluir partidas do histórico? | `DELETE /matches/:id`, apenas finalizadas; ranking derivado é recalculado. |
| Como aplicar a vitória dos assassinos? | Atualização em massa do status dos não assassinos antes de finalizar/persistir; mortos não ressuscitam. |
| Onde fica o encerramento manual? | Em um ponto único persistente da tela da partida, acima das sobreposições. |
| Como iniciar a configuração? | Todos os ativos pré-selecionados, com selecionar/desmarcar todos, contador e memória de papéis. |

## 4. Decisões aprovadas

Todas as decisões D1–D15 foram aprovadas. D2, D3, D4, D5, D7 e D8 estão registradas na spec (Clarifications de 2026-11-14); Q1, Q2 e Q3 e as premissas A1–A5 estão registradas na spec (2026-11-17). D1, D6, D9 e D10–D15 estão registradas em [plan.md](./plan.md). Nenhuma decisão permanece pendente de confirmação formal.

A revisão de 2026-11-17 incorporou D-R21 (arquivamento de participante), D-R22 (exclusão de partidas), D-R23 (status em massa na vitória dos assassinos), D-R24 (ponto único de encerramento) e D-R25 (seleção padrão/em massa e memória de papéis), além de revisar D-R11, D-R13, D-R16 e D-R19.
