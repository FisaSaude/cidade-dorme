# Validation Checklist: Cidade Dorme

**Purpose**: Revisar a qualidade, testabilidade e rastreabilidade dos requisitos de validação antes da implementação e da execução das tarefas da Phase 12.
**Created**: 2026-11-14
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [tasks.md](../tasks.md)

**Note**: Checklist gerada pelo `/speckit.checklist` para revisão de qualidade dos requisitos.
**Review Ownership**: Artefato de revisão pertencente ao revisor. Marcar `[x]` somente quando o critério de qualidade for satisfeito.
**Marker Semantics**: `[x]` indica que o critério foi revisado e satisfeito; não indica que a implementação foi concluída.

## Regras do Motor

- [ ] CHK001 A configuração exige ao menos 5 participantes e ao menos 1 assassino, permite zero detetives e atribui exatamente um papel por participante (FR-008–FR-016).
- [ ] CHK002 A ordem de resolução da noite e do turno está definida: sobreposições, assassinos, vitória imediata, detetives, vitória imediata, votação e novo turno (FR-018–FR-045).
- [ ] CHK003 Ações simultâneas dos assassinos são processadas conjuntamente e alvos repetidos são eliminados uma única vez (FR-026, FR-027).
- [ ] CHK004 A escolha de um assassino eliminado na mesma noite ainda é aplicada (D5, Clarifications).
- [ ] CHK005 O turno decisivo em vitória noturna é contabilizado; o turno em andamento em encerramento manual não é (D3, D8).
- [ ] CHK006 A configuração com todos os participantes assassinos é permitida e a primeira noite pode declarar vitória dos assassinos (D7, FR-014).
- [ ] CHK007 Alvos de assassinos e detetives devem estar vivos, ser diferentes do executor e podem incluir assassinos (FR-023, FR-028, FR-031, FR-035, FR-036).
- [ ] CHK008 A partida sem detetives dispensa automaticamente a etapa dos detetives (FR-016).
- [ ] CHK009 A votação aceita eliminação de alvo vivo ou empate; voto duplicado, alvo morto e votos individuais são bloqueados (FR-040, FR-041, FR-043, FR-044).
- [ ] CHK010 O encerramento manual é permitido em qualquer fase após confirmação e pode ser cancelado (FR-052–FR-054).
- [ ] CHK011 Condições de vitória são avaliadas imediatamente após as eliminações noturnas e após a votação, interrompendo o fluxo sem novo turno (FR-048–FR-051).

## Persistência e API

- [ ] CHK012 Nenhum dado de partida é gravado antes do estado `FINISHED`; partidas em andamento não aparecem no histórico (FR-059, FR-062, plan §5).
- [ ] CHK013 A gravação usa um único `PUT` idempotente por partida finalizada (contrato `json-server-api.md`, plan §5).
- [ ] CHK014 Falhas de gravação exibem mensagem explicativa e permitem nova tentativa sem duplicar a partida (FR-073, plan §6, contrato `json-server-api.md`).
- [ ] CHK015 Histórico e ranking consideram apenas partidas com status `FINISHED` (FR-059, FR-062, FR-064, FR-067).
- [ ] CHK016 O ranking inclui participantes cadastrados com zero sobrevivências (D8, FR-064).
- [ ] CHK017 A edição de nome preserva a identidade e reflete o nome atualizado no histórico (D8, FR-004, FR-063).
- [ ] CHK018 Recarregar ou fechar o navegador perde a sessão em andamento sem criar dados órfãos (D2, Clarifications, plan §4.3).
- [ ] CHK019 O cliente usa o proxy `/api` e não acessa o JSON Server diretamente por outra origem (contrato `json-server-api.md`).

## Interface e Acessibilidade

- [ ] CHK020 As sobreposições cobrem a tela e são dispensadas por clique ou teclado (FR-019–FR-021, FR-029, FR-037, SC-004, SC-011).
- [ ] CHK021 O tema escuro mantém contraste WCAG AA nos tokens e textos principais (SC-011).
- [ ] CHK022 Participantes mortos não aparecem como executores ou alvos elegíveis (FR-028, FR-035, FR-043).
- [ ] CHK023 O encerramento manual exige confirmação explícita em todas as fases (FR-053).
- [ ] CHK024 A tela de votação não é oferecida quando a vitória encerra a partida durante a noite (FR-048, FR-051).

## Critérios de Aceite e Evidências

- [ ] CHK025 A configuração de uma partida completa pode ser concluída em até 3 minutos (SC-001).
- [ ] CHK026 O quickstart 4.1–4.11 e os contratos 5.1–5.2 têm resultados esperados verificáveis (quickstart.md).
- [ ] CHK027 A validação de usabilidade com narradores externos (SC-009) está registrada como pós-entrega e fora do escopo de implementação.
- [ ] CHK028 `npm test`, `npm run lint` e `npm run build` são gates obrigatórios antes da entrega (plan §7.3).
- [ ] CHK029 O teste de arquitetura garante motor sem React/`fetch` e respeita os limites FSD (task T100).
- [ ] CHK030 As tarefas T105–T112 cobrem contratos, regras, persistência, UX, lint/build e evidências de validação (Phase 12).

## Notes

- Marcar itens `[x]` somente após revisão que confirme o critério de qualidade dos requisitos.
- Manter itens desmarcados quando ainda exigirem esclarecimento, correção ou avaliação do revisor.
- `/speckit.implement` lê o estado dos checkboxes como gate e não deve alterar os marcadores.
- `checklists/requirements.md` tem ciclo de vida próprio mantido por `/speckit.specify` e `/speckit.clarify`.
- Registrar achados e justificativas inline; vincular evidências ao quickstart e aos contratos.
