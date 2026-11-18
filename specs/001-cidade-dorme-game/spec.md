# Feature Specification: Cidade Dorme — Aplicação de Apoio ao Narrador

**Feature Branch**: `001-cidade-dorme-game`

**Created**: 2026-11-14

**Updated**: 2026-11-17

**Status**: Draft — atualizado em 2026-11-17

**Input**: User description: "Criar a especificação funcional do sistema Cidade Dorme, documentando funcionalidades, regras de negócio, histórias de usuário e critérios de aceitação para uma aplicação usada exclusivamente pelo narrador na condução de partidas presenciais." Atualização de 2026-11-17: simplificar a atribuição de papéis com seleção padrão e em massa, consolidar o ponto de encerramento manual, permitir excluir participantes e partidas do histórico com regras de dependência documentadas e aplicar a nova regra de vitória dos assassinos com atualização de status antes da persistência.

## Visão Geral

O Cidade Dorme é uma aplicação de uso exclusivo do narrador para apoiar a condução de partidas presenciais do jogo de dedução social Cidade Dorme. A aplicação controla o fluxo da partida, aplica as regras de negócio e registra as ações informadas pelo narrador. O narrador não possui papel no jogo: ele configura os participantes, define os papéis, dispensa as sobreposições, registra as ações noturnas e o resultado da votação.

A aplicação não substitui a condução presencial, não gerencia votos individuais e não realiza sorteio automático de papéis. O foco é reduzir o esforço de controle do narrador e preservar a atmosfera sombria e imersiva do jogo.

## Clarifications

### Session 2026-11-14

- Q: Quando uma eliminação noturna já satisfaz uma condição de vitória, a partida deve ser encerrada imediatamente, antes da votação do turno? → A: Sim. A partida é encerrada imediatamente após as eliminações noturnas, e a votação não é realizada.
- Q: Quais papéis especiais devem ser obrigatórios para iniciar uma partida? → A: Pelo menos um assassino é obrigatório; detetives são opcionais e a etapa dos detetives é dispensada quando não houver nenhum.
- Q: Quais participantes podem ser escolhidos como alvo por assassinos e detetives? → A: Apenas participantes vivos e diferentes do próprio executor; assassinatos entre assassinos são permitidos.
- Q: Se a vitória for atingida já nas eliminações dos assassinos, a etapa dos detetives ainda deve ser conduzida? → A: Não. A partida é encerrada imediatamente após as eliminações dos assassinos, sem etapa dos detetives e sem votação.
- Q: O cadastro deve exigir nomes únicos de participantes ou permitir nomes repetidos? → A: Nome único obrigatório; cadastros com nome repetido são bloqueados com mensagem explicativa.
- Q: O turno decisivo de uma vitória noturna entra na quantidade de turnos? → A: Sim; apenas encerramentos manuais não contam o turno em andamento (D3).
- Q: A unicidade de nome diferencia maiúsculas/minúsculas e espaços? → A: Não; a comparação é case-insensitive após `trim` (D4).
- Q: Configuração com todos os participantes assassinos deve ser permitida? → A: Sim; apenas ao menos um assassino é exigido, e a primeira resolução noturna pode declarar vitória dos assassinos (D7).
- Q: Quando um assassino é eliminado na mesma noite em que escolheu um alvo, a escolha dele ainda deve ser aplicada? → A: Sim; as ações dos assassinos são simultâneas, então um assassino eliminado na mesma resolução ainda tem sua escolha aplicada (D5).
- Q: O turno em andamento conta na quantidade de turnos quando a partida é encerrada manualmente? → A: Não; apenas turnos concluídos entram na contagem (D8).
- Q: Editar o nome de um participante altera o nome exibido nas partidas anteriores do histórico? → A: Sim; a identidade é preservada e o nome atualizado é exibido no histórico (D8).
- Q: O ranking deve listar participantes cadastrados que ainda não têm nenhuma sobrevivência? → A: Sim; todos os cadastrados aparecem, inclusive com zero sobrevivências (D8).
- Q: Ao recarregar ou fechar o navegador, a partida em andamento deve ser recuperada? → A: Não; a sessão em andamento é perdida, não é contabilizada e apenas dados finalizados persistem (D2).

### Session 2026-11-17

- Q: Como deve ser tratada a exclusão de um participante que já possui partidas finalizadas? → A: O participante é removido do cadastro ativo e das novas partidas, mas seu histórico e sua contribuição no ranking são preservados (Q1).
- Q: Na vitória dos assassinos, os assassinos que já estavam mortos devem voltar a ALIVE? → A: Não; apenas os assassinos ainda vivos permanecem ALIVE, e os já eliminados continuam DEAD (Q2).
- Q: Qual momento de eliminação deve constar no histórico para os não assassinos que morrem em massa na vitória dos assassinos? → A: O turno e a fase em que a vitória foi declarada, para todos os eliminados em massa (Q3).
- Q: A unicidade de nome se aplica a participantes excluídos? → A: Não; permanece restrita ao cadastro ativo. Um nome pode ser reutilizado, e histórico e ranking distinguem os registros pela identidade preservada.

## Decisões Aprovadas em 2026-11-17

As decisões abaixo foram aprovadas e estão incorporadas aos requisitos e cenários correspondentes.

### Q1 — Exclusão de participante com partidas finalizadas

**Contexto**: O histórico e o ranking dependem do vínculo entre participantes e partidas. Excluir um participante que já participou de partidas finalizadas pode deixar referências sem cadastro e alterar a leitura do histórico.

**Decisão aprovada**: Opção B. O participante é removido do cadastro ativo e das novas partidas, mas suas partidas finalizadas, seu nome no histórico e sua contribuição no ranking são preservados.

**Opções**:

| Opção | Comportamento | Consequências |
|-------|---------------|---------------|
| A | Bloquear a exclusão de qualquer participante com partidas finalizadas. | Histórico e ranking permanecem intactos, mas a exclusão fica indisponível para quase todos os participantes após a primeira partida. |
| B | Remover o participante da lista de cadastro e das novas partidas, preservando o histórico e a contribuição no ranking. | Atende à exclusão sem quebrar o histórico; o nome pode permanecer associado a partidas antigas e o ranking pode continuar exibindo o participante. |
| C | Excluir em cascata o participante e todas as partidas finalizadas em que ele participou. | Remove o participante por completo, mas apaga partidas do histórico e altera o ranking de todos os envolvidos. |

**Recomendação**: Opção B, por permitir a exclusão sem gerar referências órfãs e sem apagar partidas válidas.

### Q2 — Assassinos já eliminados na vitória dos assassinos

**Contexto**: A nova regra determina que os assassinos permaneçam vivos na vitória dos assassinos. A especificação atual também determina que a morte é definitiva e não há ressurreição.

**Decisão aprovada**: Opção A. Apenas os assassinos ainda vivos permanecem ALIVE; assassinos já eliminados continuam DEAD e não há ressurreição.

**Opções**:

| Opção | Comportamento | Consequências |
|-------|---------------|---------------|
| A | Apenas os assassinos ainda vivos permanecem ALIVE; assassinos já eliminados continuam DEAD. | Preserva a regra vigente de que a eliminação é definitiva e não há ressurreição. |
| B | Todos os assassinos, inclusive os eliminados anteriormente, passam a ALIVE. | Cumpre literalmente "assassinos permanecem ALIVE", mas contraria a invariante atual de morte definitiva e altera o histórico. |

**Recomendação**: Opção A, por preservar a regra existente de morte definitiva.

### Q3 — Momento da eliminação coletiva na vitória dos assassinos

**Contexto**: Os não assassinos passam a DEAD em massa. O histórico atual registra, para cada participante eliminado, o turno e a fase da eliminação.

**Decisão aprovada**: Opção A. O turno e a fase em que a vitória foi declarada são registrados para todos os participantes eliminados em massa.

**Opções**:

| Opção | Comportamento | Consequências |
|-------|---------------|---------------|
| A | Registrar o turno e a fase em que a vitória foi declarada (noite ou votação) para todos os eliminados em massa. | Mantém o histórico detalhado e consistente com o momento real da partida. |
| B | Não registrar momento individual; indicar que a morte decorreu da vitória dos assassinos. | Simplifica o histórico, mas introduz uma nova forma de representar eliminações. |

**Recomendação**: Opção A, por reutilizar a informação já prevista no histórico e não criar uma nova representação.

### Premissas Assumidas

As premissas abaixo foram adotadas para viabilizar a especificação e permanecem sujeitas a confirmação na revisão, sem bloquear o planejamento.

| # | Premissa assumida | Impacto |
|---|-------------------|---------|
| A1 | O encerramento manual fica em um único ponto permanente da tela da partida, acessível em todas as fases em andamento, inclusive durante sobreposições, e não é repetido dentro de cada pop-up. | Define o "local apropriado e consistente" solicitado, sem alterar a confirmação existente. |
| A2 | A exclusão de participante é bloqueada enquanto ele estiver em uma partida em andamento. | Evita inconsistência entre cadastro e sessão ativa. |
| A3 | A exclusão de uma partida finalizada remove sua contribuição do ranking, que é recalculado. | Mantém a coerência entre histórico e ranking. |
| A4 | Desmarcar e remarcar um participante na mesma configuração preserva o papel especial já atribuído a ele. | Evita perda acidental de configuração durante ajustes de seleção. |
| A5 | A exclusão de uma partida não altera o cadastro de participantes nem outras partidas. | Limita o efeito da exclusão ao histórico e ao ranking. |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gerenciar e excluir participantes (Priority: P1)

Como narrador, quero cadastrar, visualizar, editar e excluir participantes para que eles possam ser reutilizados em várias partidas, tenham seu histórico preservado e o cadastro não acumule registros indesejados.

**Why this priority**: Sem participantes cadastrados não é possível configurar nenhuma partida. É a base de todas as demais funcionalidades, e a exclusão precisa ser segura para não comprometer histórico e ranking.

**Independent Test**: Cadastrar três participantes, editar o nome de um deles, excluir outro que não tenha partidas finalizadas e verificar que a lista reflete as alterações, sem depender de nenhuma partida em andamento.

**Acceptance Scenarios**:

1. **Given** que não há participantes cadastrados, **When** o narrador cadastra um participante com nome válido, **Then** o participante passa a aparecer na lista de participantes.
2. **Given** que existe um participante cadastrado, **When** o narrador edita suas informações e confirma, **Then** a lista apresenta os dados atualizados.
3. **Given** que existe um participante cadastrado, **When** o narrador tenta cadastrar outro participante com o mesmo nome, **Then** a aplicação impede o cadastro e apresenta uma mensagem explicativa.
4. **Given** que existem participantes cadastrados, **When** o narrador inicia a configuração de uma nova partida, **Then** todos os participantes cadastrados estão disponíveis para seleção e já aparecem selecionados por padrão.
5. **Given** que um participante já participou de partidas anteriores, **When** ele é selecionado para uma nova partida, **Then** seu vínculo com as partidas anteriores é preservado.
6. **Given** que existe um participante sem partidas finalizadas, **When** o narrador solicita sua exclusão e confirma, **Then** o participante deixa de aparecer na lista e não fica mais disponível para novas partidas.
7. **Given** que existe um participante com partidas finalizadas, **When** o narrador solicita sua exclusão e confirma, **Then** o participante sai do cadastro ativo e das novas partidas, mas suas partidas finalizadas, seu nome no histórico e sua contribuição no ranking são preservados.
8. **Given** que um participante está em uma partida em andamento, **When** o narrador tenta excluí-lo, **Then** a aplicação impede a exclusão e apresenta uma mensagem explicativa.
9. **Given** uma solicitação de exclusão de participante, **When** o narrador cancela a confirmação, **Then** o participante permanece cadastrado e nenhum dado é alterado.

---

### User Story 2 - Configurar uma nova partida (Priority: P1)

Como narrador, quero iniciar a configuração com todos os participantes já selecionados, ajustar a seleção individualmente ou em massa e definir manualmente assassinos e detetives para iniciar uma partida válida com o mínimo de esforço.

**Why this priority**: A configuração define a composição da partida e as condições de vitória. Uma configuração inválida compromete toda a condução, e a seleção padrão reduz o esforço repetitivo do narrador.

**Independent Test**: Abrir a configuração com pelo menos cinco participantes cadastrados, confirmar que todos vêm selecionados e que a quantidade é exibida, desmarcar todos em uma única ação, selecionar cinco individualmente, atribuir um assassino e um detetive, iniciar a partida e confirmar que os demais participantes foram automaticamente classificados como inocentes.

**Acceptance Scenarios**:

1. **Given** que existem participantes cadastrados, **When** o narrador abre a configuração de uma nova partida, **Then** todos os participantes aparecem listados e selecionados por padrão, com a quantidade de selecionados exibida.
2. **Given** a configuração aberta, **When** o narrador aciona a opção de selecionar todos, **Then** todos os participantes ficam selecionados e a quantidade exibida é atualizada.
3. **Given** a configuração aberta, **When** o narrador aciona a opção de desmarcar todos, **Then** nenhum participante fica selecionado e a quantidade exibida passa a ser zero.
4. **Given** a configuração aberta, **When** o narrador altera individualmente a seleção de um participante, **Then** apenas esse participante muda de estado e a quantidade de selecionados é atualizada.
5. **Given** que existem pelo menos cinco participantes cadastrados, **When** o narrador mantém ou ajusta a seleção para cinco participantes, define ao menos um assassino e confirma o início, **Then** a partida é iniciada com exatamente um papel por participante.
6. **Given** que o narrador selecionou menos de cinco participantes, **When** ele tenta iniciar a partida, **Then** a aplicação impede o início e exibe uma mensagem explicativa informando o mínimo de cinco participantes.
7. **Given** que o narrador selecionou os participantes, **When** ele não atribui papel especial a um participante, **Then** esse participante é automaticamente classificado como inocente.
8. **Given** que o narrador atribuiu papéis especiais, **When** ele tenta atribuir dois papéis ao mesmo participante, **Then** a aplicação impede a dupla atribuição.
9. **Given** que o narrador não definiu nenhum assassino, **When** ele tenta iniciar a partida, **Then** a aplicação impede o início e explica que ao menos um assassino é obrigatório.
10. **Given** que o narrador definiu assassinos e nenhum detetive, **When** ele inicia a partida, **Then** a partida é iniciada e a etapa dos detetives é automaticamente dispensada em todos os turnos.
11. **Given** uma configuração válida, **When** a partida é iniciada, **Then** todos os participantes da partida começam com status vivo.

---

### User Story 3 - Conduzir as etapas noturnas do turno (Priority: P1)

Como narrador, quero que a aplicação apresente as sobreposições na ordem correta e registre as ações de assassinos e detetives para conduzir cada noite sem controlar regras manualmente.

**Why this priority**: É o núcleo da partida. Sem o fluxo noturno e o registro de ações, a aplicação não cumpre seu propósito.

**Independent Test**: Em uma partida configurada, percorrer as etapas "Cidade Dorme", "Assassinos Acordem" e "Detetives Acordem", registrar ações opcionais e confirmar que as informações são apresentadas ao narrador conforme as regras.

**Acceptance Scenarios**:

1. **Given** que um turno foi iniciado, **When** a etapa "Cidade Dorme" é apresentada, **Then** uma sobreposição cobre toda a tela com a frase "Cidade Dorme" e permanece visível até ação explícita do narrador (clique ou teclado).
2. **Given** a sobreposição "Cidade Dorme" visível, **When** o narrador dispensa por clique ou teclado, **Then** a sobreposição desaparece e a etapa seguinte é apresentada.
3. **Given** a etapa "Assassinos Acordem", **When** o narrador dispensa a sobreposição, **Then** é apresentada uma interface com apenas os assassinos vivos e os participantes vivos elegíveis como alvo.
4. **Given** a interface de ações dos assassinos, **When** um assassino vivo escolhe um participante vivo como alvo, **Then** a escolha é registrada para processamento conjunto ao final da fase.
5. **Given** a interface de ações dos assassinos, **When** o narrador deixa um assassino sem alvo, **Then** nenhuma ação é registrada para esse assassino e o turno prossegue.
6. **Given** que dois assassinos vivos escolhem o mesmo alvo, **When** as eliminações são processadas, **Then** o alvo é eliminado apenas uma vez.
7. **Given** que um participante está morto, **When** a interface de ações é apresentada, **Then** ele não aparece como executor de ação nem como alvo elegível.
8. **Given** a etapa "Detetives Acordem", **When** o narrador dispensa a sobreposição, **Then** é apresentada uma interface para registrar a investigação de cada detetive vivo.
9. **Given** a interface de investigações, **When** o narrador registra a investigação de um detetive sobre um participante, **Then** a aplicação revela ao narrador o papel do participante investigado, sem alterar o status ou eliminar o investigado.
10. **Given** a interface de investigações, **When** o narrador deixa um detetive sem investigação, **Then** nenhuma investigação é registrada para esse detetive e o turno prossegue.
11. **Given** que não há detetives vivos na partida, **When** o turno chega à etapa dos detetives, **Then** a etapa é automaticamente dispensada, sem exigir registro.

---

### User Story 4 - Apresentar o amanhecer e registrar a votação (Priority: P1)

Como narrador, quero visualizar o resultado da noite, incluindo os eliminados, e registrar apenas o resultado da votação presencial para manter o fluxo da partida.

**Why this priority**: O amanhecer comunica o efeito das ações noturnas e a votação é a única forma de eliminação diurna. Ambos são necessários para o ciclo completo do turno.

**Independent Test**: Executar uma noite com um assassinato e registrar uma votação com eliminado; repetir com noite sem assassinatos e votação empatada, verificando as mensagens e os status.

**Acceptance Scenarios**:

1. **Given** que as ações noturnas foram processadas, **When** a etapa "Cidade Acorda" é apresentada, **Then** uma sobreposição cobre toda a tela com a frase "Cidade Acorda" e permanece visível até ação explícita do narrador (clique ou teclado).
2. **Given** a sobreposição "Cidade Acorda" visível, **When** o narrador dispensa por clique ou teclado, **Then** a sobreposição desaparece e o resultado das ações noturnas é apresentado.
3. **Given** que um ou mais participantes foram assassinados na noite, **When** o resultado é apresentado, **Then** a aplicação informa nominalmente quais participantes foram assassinados.
4. **Given** que nenhum participante foi assassinado na noite, **When** o resultado é apresentado, **Then** a aplicação apresenta uma mensagem apropriada informando que ninguém foi assassinado.
5. **Given** a etapa de votação, **When** o narrador seleciona um participante vivo como eliminado, **Then** o status desse participante é atualizado para morto e o turno avança.
6. **Given** a etapa de votação, **When** o narrador informa que houve empate, **Then** nenhum participante é eliminado e o turno avança.
7. **Given** a etapa de votação, **When** o narrador tenta selecionar um participante já morto, **Then** a aplicação impede a seleção.
8. **Given** a etapa de votação, **When** o narrador tenta registrar votos individuais, **Then** a aplicação não oferece essa funcionalidade, permitindo apenas o resultado final.

---

### User Story 5 - Encerrar a partida automaticamente por vitória (Priority: P2)

Como narrador, quero que a aplicação identifique e anuncie o lado vencedor assim que uma condição de vitória for atingida, aplique o status final correspondente antes de persistir o resultado e mantenha o ranking coerente, para não precisar calcular isso manualmente.

**Why this priority**: A verificação correta encerra a partida no momento adequado, evita continuações indevidas e garante que o histórico e o ranking reflitam o desfecho real.

**Independent Test**: Executar partidas roteirizadas em que todos os assassinos são eliminados e em que os assassinos igualam ou superam os demais vivos; no segundo caso, confirmar que todos os não assassinos terminam mortos, que os assassinos ainda vivos permanecem vivos, que o resultado persistido contém esses status e que o ranking é recalculado com base neles.

**Acceptance Scenarios**:

1. **Given** que o último assassino vivo foi eliminado, **When** a eliminação é processada, **Then** a partida é encerrada automaticamente com vitória dos inocentes e detetives, sem exigir nova ação do narrador.
2. **Given** que, após uma eliminação, o número de assassinos vivos é maior ou igual à soma de inocentes e detetives vivos, **When** a eliminação é processada, **Then** a partida é encerrada automaticamente com vitória dos assassinos.
3. **Given** que uma condição de vitória foi atingida com as eliminações dos assassinos, **When** essas eliminações são processadas, **Then** a partida é encerrada antes da etapa dos detetives e antes da votação.
4. **Given** que uma condição de vitória foi atingida após a votação, **When** o resultado da votação é registrado, **Then** a partida é encerrada imediatamente.
5. **Given** que a partida foi encerrada por vitória, **When** o resultado é apresentado, **Then** o lado vencedor é identificado de forma clara.
6. **Given** que a vitória dos assassinos foi atingida, **When** o desfecho é processado, **Then** todos os participantes cujo papel não é assassino recebem o status de morto antes de o resultado final ser persistido.
7. **Given** que a vitória dos assassinos foi atingida, **When** o desfecho é processado, **Then** os assassinos ainda vivos permanecem com status vivo e os assassinos já eliminados continuam com status morto, sem ressurreição.
8. **Given** que a vitória dos assassinos ocorreu após a noite ou após a votação, **When** o desfecho é processado, **Then** a atualização de status ocorre antes da persistência e é aplicada da mesma forma.
9. **Given** uma partida encerrada por vitória dos assassinos, **When** o resultado e o histórico são consultados, **Then** os status exibidos correspondem à atualização em massa e o momento da eliminação coletiva registrado é o turno e a fase em que a vitória foi declarada.
10. **Given** uma partida encerrada por vitória dos assassinos, **When** o ranking é apresentado, **Then** apenas os assassinos que terminaram vivos recebem uma sobrevivência naquela partida e os não assassinos não recebem sobrevivência.

---

### User Story 6 - Encerrar a partida manualmente em um ponto único (Priority: P2)

Como narrador, quero encerrar a partida a qualquer momento por meio de um local único e consistente, com confirmação, para lidar com situações imprevistas sem atribuir vencedor e sem procurar a ação em cada pop-up.

**Why this priority**: Partidas reais podem ser interrompidas. O encerramento controlado preserva o histórico e o ranking sem resultados indevidos, e um ponto único evita confusão durante a condução.

**Independent Test**: Iniciar uma partida, percorrer fases com e sem sobreposição, confirmar que o encerramento manual está sempre no mesmo ponto da tela, eliminar um participante e encerrar manualmente; verificar status final, ausência de vencedor e contabilização de sobrevivência apenas para os vivos.

**Acceptance Scenarios**:

1. **Given** uma partida em andamento, **When** a tela da partida é exibida em qualquer fase, **Then** a ação de encerramento manual está disponível em um único local consistente da tela.
2. **Given** uma sobreposição ou pop-up em exibição, **When** o narrador precisa encerrar a partida, **Then** a ação não é repetida dentro de cada pop-up, mas continua acessível por meio do ponto único da tela da partida.
3. **Given** que a partida está em andamento, **When** o narrador aciona o encerramento manual, **Then** a aplicação apresenta uma confirmação antes de encerrar.
4. **Given** a confirmação de encerramento manual, **When** o narrador cancela, **Then** a partida permanece no estado anterior, sem alterações.
5. **Given** a confirmação de encerramento manual, **When** o narrador confirma, **Then** a partida recebe o status de encerrada, sem vencedor atribuído.
6. **Given** um encerramento manual, **When** o resultado é consultado, **Then** os participantes vivos permanecem vivos, os mortos permanecem mortos e nenhum vencedor é indicado.
7. **Given** um encerramento manual, **When** o ranking é atualizado, **Then** cada participante vivo recebe uma sobrevivência naquela partida.
8. **Given** uma partida já encerrada, **When** o resultado é exibido, **Then** a ação de encerramento manual não é mais oferecida.

---

### User Story 7 - Consultar e excluir partidas do histórico (Priority: P3)

Como narrador, quero consultar as partidas finalizadas para revisar participantes, papéis, status final, quantidade de turnos e resultado, e excluir registros que não desejo manter.

**Why this priority**: O histórico dá transparência e suporte à análise das partidas, mas não é necessário para conduzir uma partida. A exclusão permite descartar registros indevidos ou de teste.

**Independent Test**: Finalizar duas partidas (uma por vitória e uma manualmente), conferir os dados de cada uma, excluir uma delas com confirmação e verificar que ela sai do histórico e deixa de contribuir para o ranking.

**Acceptance Scenarios**:

1. **Given** que existem partidas finalizadas, **When** o narrador acessa o histórico, **Then** apenas partidas encerradas (por vitória ou manualmente) são listadas.
2. **Given** uma partida finalizada no histórico, **When** o narrador abre seus detalhes, **Then** são apresentados participantes, papéis atribuídos, status final de cada participante, quantidade de turnos e resultado.
3. **Given** que uma partida foi encerrada manualmente, **When** seus detalhes são consultados, **Then** o resultado indica encerramento sem vencedor.
4. **Given** que uma partida está em andamento, **When** o narrador acessa o histórico, **Then** essa partida não aparece no histórico.
5. **Given** uma partida finalizada no histórico, **When** o narrador solicita sua exclusão e confirma, **Then** a partida é removida do histórico.
6. **Given** uma solicitação de exclusão de partida, **When** o narrador cancela a confirmação, **Then** a partida permanece no histórico e nenhum dado é alterado.
7. **Given** que uma partida foi excluída do histórico, **When** o ranking é apresentado, **Then** as sobrevivências daquela partida deixam de ser contabilizadas e o ranking é recalculado.
8. **Given** que uma partida foi excluída do histórico, **When** o cadastro de participantes é consultado, **Then** nenhum participante é excluído ou alterado.
9. **Given** que uma partida está em andamento, **When** o narrador procura a ação de exclusão, **Then** a exclusão não é oferecida para partidas em andamento, apenas para partidas finalizadas.
10. **Given** que a última partida do histórico é excluída, **When** o histórico é consultado, **Then** a aplicação apresenta o estado vazio apropriado.

---

### User Story 8 - Consultar o ranking de participantes (Priority: P3)

Como narrador, quero visualizar os participantes ordenados pela quantidade de partidas sobrevividas para reconhecer o desempenho ao longo do tempo.

**Why this priority**: O ranking agrega valor ao histórico, mas depende de partidas finalizadas e não bloqueia a condução.

**Independent Test**: Finalizar partidas com sobreviventes conhecidos, incluindo um encerramento manual, e conferir a ordem e a contagem do ranking.

**Acceptance Scenarios**:

1. **Given** que existem partidas finalizadas, **When** o ranking é apresentado, **Then** os participantes aparecem em ordem decrescente de sobrevivências.
2. **Given** um participante que terminou uma partida vivo, **When** a partida foi finalizada, **Then** ele recebe uma sobrevivência, seja a partida encerrada por vitória ou manualmente.
3. **Given** um participante eliminado em uma partida, **When** a partida foi finalizada, **Then** ele não recebe sobrevivência naquela partida.
4. **Given** uma partida em andamento, **When** o ranking é apresentado, **Then** essa partida não é contabilizada.
5. **Given** dois participantes com a mesma quantidade de sobrevivências, **When** o ranking é apresentado, **Then** eles são ordenados alfabeticamente pelo nome.

---

### Edge Cases

- Início de partida com menos de cinco participantes: bloqueado com mensagem explicativa.
- Configuração sem nenhum assassino: bloqueada, pois a partida ficaria sem condição de vitória válida.
- Configuração sem nenhum detetive: permitida; a etapa dos detetives é automaticamente dispensada em todos os turnos.
- Todos os assassinos eliminados durante a noite: partida encerrada antes da etapa dos detetives e da votação.
- Assassinos atingem a paridade durante a noite: partida encerrada antes da etapa dos detetives e da votação.
- Nenhum assassinato na noite: mensagem informando que ninguém foi assassinado; a votação prossegue normalmente.
- Vários assassinos escolhem o mesmo alvo: eliminação única.
- Assassino escolhe outro assassino como alvo: permitido, desde que ambos estejam vivos.
- Assassino eliminado na mesma noite em que escolheu um alvo: sua escolha é aplicada (resolução simultânea).
- Detetive investiga participante morto: bloqueado; alvos de investigação devem estar vivos.
- Detetive tenta investigar a si mesmo: bloqueado.
- Participante morto tenta agir em etapa posterior: não é oferecido como executor.
- Participante morto escolhido como alvo ou eliminado na votação: bloqueado.
- Votação com empate: ninguém é eliminado.
- Encerramento manual durante uma sobreposição, uma ação ou a votação: permitido após confirmação.
- Encerramento manual no meio de um turno: o turno em andamento não é contabilizado; apenas turnos concluídos entram na quantidade de turnos.
- Participante com nome duplicado: cadastro bloqueado para evitar ambiguidade na seleção de alvos.
- Edição de participante após partidas finalizadas: a identidade é preservada e o nome atualizado é exibido em todo o histórico.
- Partida com apenas um sobrevivente: condições de vitória continuam sendo avaliadas normalmente.
- Duas condições de vitória simultâneas: não podem ocorrer com participantes no jogo, pois exigiriam zero assassinos e zero inocentes/detetives ao mesmo tempo.
- Configuração com todos os participantes assassinos: permitida; a primeira resolução noturna pode declarar vitória dos assassinos.
- Recarregar ou fechar o navegador durante uma partida: a sessão em andamento é perdida e não é contabilizada; apenas dados finalizados permanecem.
- Configuração de nova partida sem nenhum participante cadastrado: nenhum participante é selecionado e o início permanece bloqueado pelo mínimo de cinco.
- Selecionar todos e depois desmarcar todos: a quantidade de selecionados acompanha cada ação e o início é bloqueado quando a seleção fica abaixo de cinco.
- Desmarcar e remarcar um participante na mesma configuração: o papel especial já atribuído é preservado, conforme A4.
- Exclusão do último participante cadastrado: a lista fica vazia e a configuração de nova partida passa a exigir novos cadastros.
- Exclusão de participante com partidas finalizadas: o participante sai do cadastro ativo e das novas partidas, mas suas partidas finalizadas, seu nome no histórico e sua contribuição no ranking são preservados.
- Reutilização do nome de um participante excluído em um novo cadastro: os registros históricos e de ranking permanecem distintos pela identidade preservada.
- Exclusão de participante em partida em andamento: bloqueada, conforme A2.
- Exclusão de partida em andamento: não é oferecida, pois apenas partidas finalizadas aparecem no histórico.
- Exclusão de partida finalizada: a partida sai do histórico e sua contribuição para o ranking é removida, conforme A3.
- Exclusão da última partida finalizada: o histórico apresenta estado vazio e o ranking mantém os participantes do cadastro ativo com zero sobrevivências; participantes excluídos que não tenham partidas finalizadas remanescentes deixam de ser representados.
- Cancelamento de exclusão de participante ou de partida: nenhum dado é alterado.
- Vitória dos assassinos com assassinos já eliminados: eles continuam mortos; apenas os assassinos ainda vivos permanecem vivos, sem ressurreição.
- Vitória dos assassinos com participantes já mortos: eles permanecem mortos, sem duplicação de eliminação.
- Momento da eliminação coletiva: o turno e a fase da vitória são registrados para todos os não assassinos eliminados em massa.
- Vitória dos assassinos após a votação: a atualização em massa dos não assassinos ocorre antes da persistência, assim como no encerramento após a noite.
- Encerramento manual durante uma sobreposição: a ação permanece acessível no ponto único da tela da partida, sem ser duplicada dentro da sobreposição.

## Requirements *(mandatory)*

### Functional Requirements — Participantes

- **FR-001**: O sistema MUST permitir ao narrador cadastrar participantes com nome obrigatório.
- **FR-002**: O sistema MUST impedir o cadastro de dois participantes com o mesmo nome no cadastro ativo e apresentar mensagem explicativa.
- **FR-003**: O sistema MUST listar todos os participantes cadastrados com suas informações atuais.
- **FR-004**: O sistema MUST permitir ao narrador editar as informações de um participante cadastrado.
- **FR-005**: O sistema MUST permitir que um mesmo participante seja selecionado em várias partidas, preservando o vínculo com o histórico anterior.
- **FR-006**: O sistema MUST disponibilizar todos os participantes cadastrados para seleção ao configurar uma nova partida, já selecionados por padrão, com possibilidade de alteração individual ou em massa.
- **FR-007**: O sistema MUST manter os dados dos participantes disponíveis entre sessões de uso.

### Functional Requirements — Configuração da Partida

- **FR-008**: O sistema MUST permitir ao narrador selecionar os participantes de uma nova partida.
- **FR-009**: O sistema MUST permitir ao narrador definir manualmente quais participantes são assassinos.
- **FR-010**: O sistema MUST permitir ao narrador definir manualmente quais participantes são detetives.
- **FR-011**: O sistema MUST classificar automaticamente como inocentes todos os participantes selecionados sem papel especial.
- **FR-012**: O sistema MUST garantir exatamente um papel por participante da partida.
- **FR-013**: O sistema MUST impedir o início de partida com menos de cinco participantes e apresentar mensagem explicativa.
- **FR-014**: O sistema MUST impedir o início de partida sem ao menos um assassino e apresentar mensagem explicativa.
- **FR-015**: O sistema MUST iniciar todos os participantes da partida com status vivo.
- **FR-016**: O sistema MUST permitir partida sem detetives, dispensando automaticamente a etapa dos detetives.
- **FR-017**: O sistema MUST NOT realizar sorteio automático de papéis.

### Functional Requirements — Turnos e Etapas

- **FR-018**: O sistema MUST organizar a partida em turnos sequenciais.
- **FR-019**: O sistema MUST apresentar, no início de cada turno, uma sobreposição de tela cheia com a frase exata "Cidade Dorme".
- **FR-020**: O sistema MUST manter cada sobreposição visível até que o narrador a dispense por clique ou ativação equivalente por teclado.
- **FR-021**: O sistema MUST apresentar a sobreposição "Assassinos Acordem" após a dispensa da etapa anterior.
- **FR-022**: O sistema MUST apresentar, após a dispensa de "Assassinos Acordem", uma interface para registrar a ação de cada assassino vivo.
- **FR-023**: O sistema MUST permitir que cada assassino vivo escolha no máximo um participante vivo e diferente de si mesmo como alvo por turno.
- **FR-024**: O sistema MUST permitir que um assassino vivo não escolha alvo.
- **FR-025**: O sistema MUST permitir que diferentes assassinos escolham o mesmo alvo.
- **FR-026**: O sistema MUST processar todas as escolhas dos assassinos conjuntamente ao final da fase dos assassinos.
- **FR-027**: O sistema MUST eliminar apenas uma vez um participante escolhido por vários assassinos.
- **FR-028**: O sistema MUST impedir que participantes mortos executem ações ou sejam escolhidos como alvo.
- **FR-029**: O sistema MUST apresentar a sobreposição "Detetives Acordem" após o processamento da fase dos assassinos, desde que nenhuma condição de vitória tenha sido atingida.
- **FR-030**: O sistema MUST apresentar, após a dispensa de "Detetives Acordem", uma interface para registrar a investigação de cada detetive vivo.
- **FR-031**: O sistema MUST permitir que cada detetive vivo investigue no máximo um participante vivo e diferente de si mesmo por turno.
- **FR-032**: O sistema MUST permitir que o narrador não registre investigação para um detetive vivo.
- **FR-033**: O sistema MUST revelar ao narrador o papel do participante investigado.
- **FR-034**: O sistema MUST impedir que a investigação elimine ou altere o status do participante investigado.
- **FR-035**: O sistema MUST impedir que detetives mortos investiguem.
- **FR-036**: O sistema MUST impedir que um detetive investigue a si mesmo.
- **FR-037**: O sistema MUST apresentar a sobreposição "Cidade Acorda" após a fase dos detetives.
- **FR-038**: O sistema MUST apresentar, após a dispensa de "Cidade Acorda", o resultado das ações noturnas com os nomes dos participantes assassinados.
- **FR-039**: O sistema MUST informar que ninguém foi assassinado quando não houver eliminações noturnas.
- **FR-040**: O sistema MUST permitir registrar o resultado da votação apenas como um participante vivo eliminado ou como empate.
- **FR-041**: O sistema MUST NOT gerenciar votos individuais.
- **FR-042**: O sistema MUST atualizar o status do participante eliminado na votação para morto.
- **FR-043**: O sistema MUST impedir a eliminação de participantes já mortos.
- **FR-044**: O sistema MUST manter o status de todos os participantes inalterado quando a votação resultar em empate.
- **FR-045**: O sistema MUST iniciar um novo turno após a votação quando nenhuma condição de vitória for atingida.

### Functional Requirements — Condições de Vitória

- **FR-046**: O sistema MUST encerrar a partida automaticamente quando todos os assassinos forem eliminados, declarando vitória dos inocentes e detetives.
- **FR-047**: O sistema MUST encerrar a partida automaticamente quando o número de assassinos vivos for maior ou igual à soma de inocentes e detetives vivos, declarando vitória dos assassinos e aplicando a atualização de status descrita em FR-102 a FR-110 antes de persistir o resultado.
- **FR-048**: O sistema MUST verificar as condições de vitória imediatamente após o processamento das eliminações dos assassinos; se a vitória dos assassinos for atingida, MUST aplicar a atualização de status descrita em FR-102 a FR-110, encerrar a partida sem realizar a etapa dos detetives e sem realizar a votação.
- **FR-049**: O sistema MUST verificar as condições de vitória imediatamente após o registro do resultado da votação.
- **FR-050**: O sistema MUST apresentar ao narrador o resultado da partida com a identificação clara do lado vencedor.
- **FR-051**: O sistema MUST aplicar as interrupções de fluxo descritas em FR-048 e FR-049, sem iniciar novo turno.

### Functional Requirements — Encerramento Manual

- **FR-052**: O sistema MUST permitir ao narrador encerrar uma partida em andamento a qualquer momento por meio de um único ponto de ação consistente na tela da partida.
- **FR-053**: O sistema MUST solicitar confirmação antes de efetivar o encerramento manual.
- **FR-054**: O sistema MUST permitir cancelar o encerramento manual e retornar ao estado anterior da partida.
- **FR-055**: O sistema MUST atribuir status de encerrada à partida confirmada manualmente.
- **FR-056**: O sistema MUST NOT atribuir vencedor em encerramento manual.
- **FR-057**: O sistema MUST preservar o status vivo ou morto dos participantes no encerramento manual.
- **FR-058**: O sistema MUST contabilizar uma sobrevivência no ranking para cada participante vivo ao final de um encerramento manual.

### Functional Requirements — Histórico

- **FR-059**: O sistema MUST manter, entre sessões de uso, o histórico de partidas finalizadas por vitória ou por encerramento manual e MUST permitir a exclusão de partidas finalizadas conforme FR-089 a FR-095.
- **FR-060**: O sistema MUST apresentar, para cada partida finalizada, seus participantes, papéis atribuídos, status final de cada participante, quantidade de turnos realizados e resultado.
- **FR-061**: O sistema MUST indicar encerramentos manuais como partidas sem vencedor.
- **FR-062**: O sistema MUST excluir partidas em andamento do histórico de partidas finalizadas.
- **FR-063**: O sistema MUST preservar a identidade dos participantes no histórico mesmo após edição de seus dados.

### Functional Requirements — Ranking

- **FR-064**: O sistema MUST apresentar um ranking dos participantes do cadastro ativo e dos participantes excluídos que possuam partidas finalizadas, ordenado de forma decrescente pela quantidade de partidas sobrevividas.
- **FR-065**: O sistema MUST considerar como sobrevivência cada partida finalizada em que o participante terminou com status vivo, inclusive encerramentos manuais, utilizando os status finais após a atualização em massa da vitória dos assassinos.
- **FR-066**: O sistema MUST NOT contabilizar sobrevivência para participantes eliminados na partida.
- **FR-067**: O sistema MUST excluir partidas em andamento da contagem do ranking.
- **FR-068**: O sistema MUST desempatar participantes com a mesma quantidade de sobrevivências em ordem alfabética de nome.

### Functional Requirements — Interface e Experiência

- **FR-069**: (Subsumido por FR-019/FR-021/FR-029/FR-037: frases especiais exibidas em sobreposições de tela cheia.)
- **FR-070**: (Subsumido por FR-020: dispensa apenas por ação explícita do narrador, por clique ou teclado.)
- **FR-071**: O sistema MUST manter uma atmosfera visual sombria, coerente com a temática de mistério do jogo.
- **FR-072**: O sistema MUST manter a interface funcional e compreensível mesmo sem animações.
- **FR-073**: O sistema MUST apresentar mensagens explicativas em todas as situações de bloqueio de regra de negócio.
- **FR-074**: O sistema MUST permitir ao narrador identificar claramente o estado atual da partida, a próxima etapa a ser conduzida e a quantidade de participantes selecionados na configuração.

### Functional Requirements — Seleção Padrão e em Massa

- **FR-075**: O sistema MUST apresentar todos os participantes cadastrados já selecionados ao abrir a configuração de uma nova partida.
- **FR-076**: O sistema MUST oferecer uma ação de selecionar todos os participantes na configuração de uma nova partida.
- **FR-077**: O sistema MUST oferecer uma ação de desmarcar todos os participantes na configuração de uma nova partida.
- **FR-078**: O sistema MUST permitir alterar individualmente a seleção de cada participante, independentemente da seleção padrão ou das ações em massa.
- **FR-079**: O sistema MUST exibir claramente a quantidade de participantes selecionados e o mínimo exigido para iniciar a partida.
- **FR-080**: O sistema MUST reaplicar a validação de no mínimo cinco participantes após qualquer alteração individual ou em massa na seleção, impedindo o início quando a quantidade for inferior a cinco.

### Functional Requirements — Exclusão de Participantes

- **FR-081**: O sistema MUST permitir ao narrador excluir um participante cadastrado.
- **FR-082**: O sistema MUST solicitar confirmação antes de efetivar a exclusão de um participante e MUST permitir cancelar a exclusão sem alterar dados.
- **FR-083**: O sistema MUST remover o participante excluído da lista de cadastro e das seleções de novas partidas.
- **FR-084**: O sistema MUST impedir a exclusão de um participante que esteja em uma partida em andamento e apresentar mensagem explicativa.
- **FR-085**: O sistema MUST permitir a exclusão de participante com partidas finalizadas, removendo-o do cadastro ativo e das novas partidas e preservando suas partidas finalizadas, seu nome no histórico e sua contribuição no ranking.
- **FR-086**: O sistema MUST apresentar mensagem explicativa sempre que uma exclusão de participante for bloqueada.
- **FR-087**: O sistema MUST preservar as partidas finalizadas e o nome exibido no histórico e no ranking do participante excluído, sem deixar referências órfãs.
- **FR-088**: O sistema MUST recalcular o ranking após a exclusão de participante, mantendo a contribuição histórica do participante excluído, sem contabilizar novas partidas para ele e mantendo distintos os registros por identidade quando houver reutilização de nome.

### Functional Requirements — Exclusão de Partidas do Histórico

- **FR-089**: O sistema MUST permitir ao narrador excluir uma partida finalizada do histórico.
- **FR-090**: O sistema MUST solicitar confirmação antes de efetivar a exclusão de uma partida e MUST permitir cancelar a exclusão sem alterar dados.
- **FR-091**: O sistema MUST remover permanentemente do histórico a partida excluída.
- **FR-092**: O sistema MUST recalcular o ranking após a exclusão de uma partida, removendo as sobrevivências que ela contribuía.
- **FR-093**: O sistema MUST NOT permitir excluir uma partida em andamento por meio do histórico.
- **FR-094**: O sistema MUST NOT alterar o cadastro de participantes nem outras partidas ao excluir uma partida do histórico.
- **FR-095**: O sistema MUST apresentar estado vazio ou mensagem apropriada quando não houver partidas no histórico após exclusões.

### Functional Requirements — Ponto Único de Encerramento Manual

- **FR-096**: O sistema MUST disponibilizar o encerramento manual em um único local consistente na tela da partida.
- **FR-097**: O sistema MUST NOT duplicar o botão de encerramento manual dentro de cada pop-up ou sobreposição; a ação deve existir apenas no ponto único definido em FR-096.
- **FR-098**: O sistema MUST manter o encerramento manual acessível durante todas as fases da partida em andamento, inclusive quando uma sobreposição especial estiver visível.
- **FR-099**: O sistema MUST solicitar confirmação antes de efetivar o encerramento manual em qualquer fase, inclusive durante uma sobreposição.
- **FR-100**: O sistema MUST permitir cancelar o encerramento manual em qualquer fase e retornar ao estado anterior, sem interromper o fluxo da partida.
- **FR-101**: O sistema MUST NOT oferecer o encerramento manual depois que a partida estiver encerrada.

### Functional Requirements — Vitória dos Assassinos e Status Final

- **FR-102**: O sistema MUST, ao atingir a condição de vitória dos assassinos, alterar para morto o status de todos os participantes cujo papel não seja assassino, antes de persistir o resultado final da partida.
- **FR-103**: O sistema MUST manter com status vivo os assassinos que já estavam vivos quando a vitória dos assassinos foi atingida.
- **FR-104**: O sistema MUST manter com status morto os assassinos já eliminados quando a vitória dos assassinos foi atingida, sem ressurreição.
- **FR-105**: O sistema MUST registrar, para cada não assassino eliminado em massa, o turno e a fase (noite ou votação) em que a vitória dos assassinos foi declarada, sem alterar o momento de eliminação de participantes que já estavam mortos.
- **FR-106**: O sistema MUST NOT alterar o papel atribuído a qualquer participante ao aplicar a atualização em massa de status.
- **FR-107**: O sistema MUST aplicar a atualização em massa de status tanto quando a vitória dos assassinos ocorrer após a noite quanto quando ocorrer após a votação.
- **FR-108**: O sistema MUST refletir os status atualizados no resultado apresentado ao narrador, no histórico e nos detalhes da partida.
- **FR-109**: O sistema MUST calcular o ranking com base nos status finais após a atualização em massa, contabilizando sobrevivência apenas para os assassinos que permanecerem vivos nas partidas encerradas por vitória dos assassinos.
- **FR-110**: O sistema MUST persistir a partida somente depois de concluída a atualização em massa de status decorrente da vitória dos assassinos.

### Key Entities *(include if feature involves data)*

**Nota de modelagem**: Turno, Ação de Assassinato, Investigação e Registro de Votação são entidades de domínio mantidas em memória durante a partida e não são persistidas individualmente. O turno atual da Partida é derivado como `turnCount + 1`.

**Nota de terminologia**: "cadastro ativo" designa a lista de participantes disponíveis para novas partidas. Participantes excluídos deixam de fazer parte do cadastro ativo, mas podem permanecer no histórico e no ranking.

- **Participante**: pessoa cadastrada reutilizável em partidas. Atributos: identificador, nome, vínculo histórico com partidas. O nome é obrigatório e único no cadastro ativo. Pode ser excluído conforme FR-081 a FR-088, com bloqueio durante partida em andamento; ao ser excluído, sai do cadastro ativo e das novas partidas, mas seu nome e sua contribuição histórica no ranking são preservados.
- **Partida**: execução do jogo com participantes, papéis e turnos. Atributos: identificador, participantes, status (em andamento ou encerrada), forma de encerramento (vitória ou manual), turno atual, quantidade de turnos concluídos, resultado e lado vencedor quando houver. Partidas finalizadas podem ser excluídas do histórico conforme FR-089 a FR-095.
- **Participação na Partida**: vínculo entre participante e partida. Atributos: participante, papel (assassino, detetive ou inocente), status (vivo ou morto) e momento da eliminação. Na vitória dos assassinos, o status de todos os não assassinos é atualizado para morto antes da persistência, com o turno e a fase da vitória registrados; assassinos já eliminados permanecem mortos.
- **Turno**: ciclo de etapas noturnas e diurnas. Atributos: número sequencial, ações dos assassinos, investigações dos detetives, eliminações noturnas, resultado da votação e conclusão.
- **Ação de Assassinato**: escolha opcional de um assassino vivo por um alvo vivo diferente dele em um turno. Atributos: assassino, alvo e turno.
- **Investigação**: escolha opcional de um detetive vivo por um participante vivo investigado em um turno. Atributos: detetive, investigado, papel revelado e turno.
- **Registro de Votação**: resultado da votação presencial em um turno. Atributos: turno, participante eliminado ou indicação de empate.
- **Resultado da Partida**: desfecho final. Atributos: partida, lado vencedor (inocentes/detetives, assassinos ou nenhum) e forma de encerramento.
- **Ranking**: classificação derivada dos participantes. Atributos: participante e quantidade de sobrevivências em partidas finalizadas. É recalculado após exclusão de participante, exclusão de partida e vitória dos assassinos com atualização em massa de status. Participantes excluídos que tenham partidas finalizadas continuam representados com sua contribuição histórica.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O narrador consegue cadastrar participantes e configurar uma partida válida com pelo menos cinco participantes em até 3 minutos.
- **SC-002**: 100% das tentativas de iniciar partida com menos de cinco participantes ou sem assassino são bloqueadas com mensagem explicativa.
- **SC-003**: O narrador consegue conduzir um turno completo apenas com cliques/teclado e registros na aplicação, sem realizar cálculos manuais de eliminação ou vitória.
- **SC-004**: 100% das sobreposições especiais cobrem toda a tela e permanecem visíveis até uma ação explícita do narrador (clique ou teclado).
- **SC-005**: Em um conjunto de cenários de teste roteirizados, 100% das regras de ação, eliminação, votação e vitória são aplicadas sem violação.
- **SC-006**: 100% das partidas finalizadas podem ser reconstruídas a partir do histórico, incluindo participantes, papéis, status final, turnos e resultado.
- **SC-007**: O ranking reflete exatamente as sobrevivências esperadas em 100% dos cenários de teste, incluindo encerramentos manuais e partidas em andamento.
- **SC-008**: Após uma eliminação que satisfaça uma condição de vitória, o narrador visualiza o resultado da partida na mesma interação, sem etapa adicional de confirmação.
- **SC-009**: Em teste de usabilidade com pelo menos cinco narradores, pelo menos 90% concluem a condução de um turno na primeira tentativa sem ajuda externa.
- **SC-010**: A interface permanece totalmente utilizável com animações desativadas.
- **SC-011**: O tema utiliza os tokens dark aprovados e mantém contraste mínimo WCAG AA para texto principal e controles.
- **SC-012**: Em 100% das aberturas de configuração de nova partida, todos os participantes cadastrados aparecem selecionados por padrão e a quantidade de selecionados é exibida.
- **SC-013**: O narrador consegue selecionar todos ou desmarcar todos os participantes em uma única ação, com a contagem atualizada imediatamente em 100% das tentativas.
- **SC-014**: 100% das tentativas de iniciar partida com menos de cinco participantes são bloqueadas, inclusive após ações de seleção em massa ou alterações individuais.
- **SC-015**: 100% das exclusões de participantes e de partidas finalizadas exigem confirmação e, quando efetivadas, não deixam referências órfãs nem inconsistências entre histórico e ranking.
- **SC-016**: Em 100% das partidas com vitória dos assassinos, todos os participantes sem papel de assassino terminam com status morto e os assassinos ainda vivos terminam com status vivo antes da persistência do resultado.
- **SC-017**: Em 100% das partidas com vitória dos assassinos, o ranking contabiliza sobrevivência apenas para os assassinos que permaneceram vivos.
- **SC-018**: Em 100% das partidas em andamento, a ação de encerramento manual está disponível em um único ponto consistente da tela, não é duplicada dentro de cada pop-up e exige confirmação.
- **SC-019**: Após a exclusão de uma partida finalizada, o ranking reflete a remoção de suas sobrevivências em 100% dos cenários de teste.

## Assumptions

- O narrador é o único usuário da aplicação e não há autenticação ou login.
- O narrador possui acesso à aplicação durante toda a partida presencial.
- Os nomes dos participantes são únicos no cadastro ativo; o narrador usa sobrenomes ou apelidos para diferenciar pessoas com o mesmo nome. Participantes excluídos mantêm o nome histórico, e um novo cadastro pode reutilizar o nome, com registros distintos pela identidade preservada.
- A ordem dos papéis especiais é definida pelo narrador antes do início da partida; não há sorteio automático.
- A partida deve ter ao menos um assassino; detetives são opcionais.
- Cada participante pode ter no máximo um papel por partida, sendo inocente o papel padrão.
- Alvos de assassinos e de investigações devem ser participantes vivos, diferentes do próprio executor; assassinatos entre assassinos são permitidos.
- Detetives investigam apenas participantes vivos e não a si mesmos.
- As ações noturnas são registradas pelo narrador conforme a decisão presencial dos jogadores.
- As eliminações noturnas de todos os assassinos são resolvidas em conjunto e aplicadas uma única vez.
- A votação é conduzida presencialmente; a aplicação registra apenas o eliminado ou o empate.
- O empate na votação não elimina ninguém.
- A verificação de vitória ocorre imediatamente após as eliminações dos assassinos e novamente após a votação; se a partida terminar após a noite, a etapa dos detetives e a votação não são realizadas.
- Em encerramento manual, apenas turnos concluídos são contabilizados; o turno em andamento não entra na contagem.
- Partidas em andamento não aparecem no histórico nem no ranking.
- O encerramento manual não atribui vencedor, mas conta sobrevivência para os participantes vivos.
- A edição de um participante preserva sua identidade e atualiza o nome exibido também em partidas anteriores.
- Todos os participantes cadastrados são selecionados por padrão ao abrir a configuração de uma nova partida; a seleção pode ser alterada individualmente ou em massa.
- A seleção de participantes na configuração não altera o cadastro; selecionar todos ou desmarcar todos apenas modifica a composição da partida em preparação.
- Desmarcar e remarcar um participante na mesma configuração preserva o papel especial previamente atribuído (A4).
- É possível excluir participantes cadastrados, com confirmação e com bloqueio durante partida em andamento (A2).
- A exclusão de um participante com partidas finalizadas remove-o do cadastro ativo e das novas partidas, mas preserva suas partidas finalizadas, seu nome no histórico e sua contribuição no ranking (Q1). O nome preservado é o último nome cadastrado antes da exclusão.
- O ranking inclui todos os participantes do cadastro ativo e também os participantes excluídos que tenham partidas finalizadas, preservando a contribuição histórica de ambos.
- É possível excluir partidas finalizadas do histórico, com confirmação, removendo sua contribuição do ranking (A3).
- A exclusão de uma partida não altera o cadastro de participantes nem outras partidas (A5).
- O encerramento manual fica em um único ponto permanente da tela da partida, acessível em todas as fases em andamento, inclusive durante sobreposições, e não é repetido em pop-ups (A1).
- Na vitória dos assassinos, a atualização de status dos não assassinos ocorre antes da persistência do resultado e o ranking utiliza os status finais.
- Na vitória dos assassinos, apenas os assassinos ainda vivos permanecem vivos; assassinos já eliminados continuam mortos, sem ressurreição (Q2).
- Os não assassinos eliminados em massa na vitória dos assassinos têm o turno e a fase da vitória registrados como momento da eliminação (Q3).
- Os dados devem persistir entre sessões de uso.
- A aplicação não gerencia votos individuais, comunicação entre jogadores ou sorteio de papéis.

## Fora de Escopo

- Sistema de autenticação e login.
- Sorteio automático de papéis.
- Gerenciamento de votos individuais.
- Comunicação ou interação entre jogadores por meio da aplicação.
- Funcionalidades que substituam o papel do narrador na condução presencial.
- Exclusão de partidas em andamento; a exclusão é oferecida apenas para partidas finalizadas no histórico.
- Exclusão em massa de participantes ou de partidas.
- Restauração ou desfazer exclusões de participantes ou de partidas.
- Edição de partidas finalizadas.
- Regras adicionais de papéis especiais não descritas nesta especificação.
- Validação de usabilidade com narradores externos (SC-009): executada após a entrega, fora do escopo de implementação.

## Interpretações Confirmadas

As interpretações da sessão de 2026-11-14 permanecem válidas e incorporadas às regras acima:

1. **Contagem de turnos em encerramento manual**: apenas turnos concluídos são contabilizados.
2. **Edição de participante e histórico**: a identidade é preservada e o nome atualizado é exibido no histórico.
3. **Participantes sem sobrevivências no ranking**: todos os participantes do cadastro ativo aparecem, inclusive com zero sobrevivências; participantes excluídos aparecem apenas enquanto tiverem partidas finalizadas que sustentem sua contribuição histórica.

### Atualização 2026-11-17

Os quatro ajustes solicitados foram incorporados: seleção padrão e em massa na configuração, ponto único de encerramento manual, exclusão de participantes e de partidas do histórico com regras de dependência e nova regra de vitória dos assassinos com atualização de status antes da persistência.

As decisões de 2026-11-17 foram aprovadas:

1. **Exclusão de participante com partidas finalizadas (Q1)**: sai do cadastro ativo e das novas partidas, com histórico e contribuição no ranking preservados.
2. **Assassinos já eliminados na vitória dos assassinos (Q2)**: continuam mortos; não há ressurreição.
3. **Momento da eliminação coletiva (Q3)**: turno e fase da vitória são registrados para os não assassinos eliminados em massa.

As premissas A1 a A5 permanecem documentadas para confirmação na revisão, mas não impedem o avanço para planejamento.

