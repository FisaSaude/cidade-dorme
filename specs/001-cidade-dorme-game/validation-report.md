# Relatório de Validação — Fase 11

**Data**: 2026-11-16
**Escopo**: Polish & Cross-Cutting Concerns (T097–T104)

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
