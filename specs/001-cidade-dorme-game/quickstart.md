# Guia Rápido: Validação do Cidade Dorme

**Feature**: `001-cidade-dorme-game`
**Objetivo**: guiar a validação funcional e técnica após a implementação, sem substituir os testes automatizados.
**Referências**: [spec.md](./spec.md), [data-model.md](./data-model.md), [contracts/json-server-api.md](./contracts/json-server-api.md), [contracts/match-engine.md](./contracts/match-engine.md)

## 1. Pré-requisitos

- Node.js 24 ou compatível com Vite 8.
- npm.
- Portas livres: `5173` (Vite) e `3001` (JSON Server).
- Dependências instaladas com `npm install` após a inclusão das dependências do plano.

## 2. Preparação

1. Confirmar que `db.json` existe na raiz com:

```json
{ "participants": [], "matches": [] }
```

2. Iniciar API simulada e aplicação:

```bash
npm run dev:all
```

Alternativa em dois terminais:

```bash
npm run dev:api
npm run dev
```

3. Abrir a aplicação em `http://localhost:5173`.
4. Confirmar que `GET http://localhost:3001/participants` responde `[]`.

## 3. Verificações automatizadas

```bash
npm test
npm run lint
npm run build
```

Resultados esperados:

- Testes de domínio, ViewModel e integração passam.
- Nenhum erro de lint.
- Build de produção conclui sem erros.
- Nenhum teste unitário depende do JSON Server em execução.

## 4. Cenários de validação manual

### 4.1 Participantes

1. Cadastrar “Ana”.
2. Tentar cadastrar “ana” ou “ Ana ”.
3. Editar “Ana” para “Ana Maria”.
4. Recarregar a página.
5. Excluir “Ana Maria” e confirmar; cancelar previamente em outra tentativa.
6. Cadastrar novamente “Ana Maria”.
7. Iniciar uma partida com um participante e tentar excluí-lo durante a partida.

**Esperado**

- “Ana” aparece na lista.
- O duplicado é bloqueado com mensagem explicativa.
- A edição atualiza a lista.
- Após recarregar, o participante permanece e mantém o mesmo ID.
- Cancelar a exclusão não altera nada.
- Confirmar remove o participante do cadastro ativo e das novas partidas, com mensagem de sucesso.
- O nome “Ana Maria” pode ser reutilizado; o novo cadastro recebe outro ID.
- A exclusão durante a partida é bloqueada com mensagem explicativa.

### 4.2 Configuração e seleção

1. Cadastrar seis participantes e abrir a configuração.
2. Observar a seleção e o contador inicial.
3. Usar “Desmarcar todos” e depois “Selecionar todos”.
4. Desmarcar um participante com papel especial, remarcá-lo e verificar o papel.
5. Selecionar quatro participantes e tentar iniciar.
6. Selecionar cinco ou mais e não atribuir assassino.
7. Selecionar cinco ou mais, atribuir um assassino e nenhum detetive.

**Esperado**

- Todos os ativos começam selecionados; o contador mostra “6 de 6”.
- “Desmarcar todos” zera a seleção e “Selecionar todos” restaura todos os ativos.
- O contador acompanha cada alteração.
- O papel especial é preservado ao desmarcar e remarcar.
- Início bloqueado com mensagem sobre o mínimo de cinco.
- Início bloqueado com mensagem sobre a necessidade de ao menos um assassino.
- Configuração sem detetive é aceita; a fase dos detetives será omitida.

### 4.3 Início e papéis

1. Cadastrar pelo menos cinco participantes.
2. Manter a seleção padrão ou usar “Selecionar todos”, atribuir um assassino e um detetive.
3. Iniciar a partida.

**Esperado**

- Exatamente um papel por participante.
- Os demais são inocentes.
- Todos começam vivos.
- A partida abre no turno 1 com a sobreposição “Cidade Dorme”.

### 4.4 Sobreposições

1. Observar “Cidade Dorme”.
2. Dispensar a sobreposição por clique ou teclado.
3. Observar “Assassinos Acordem” e dispensar.
4. Registrar ações e prosseguir até “Detetives Acordem”.
5. Se houver detetive vivo, dispensar e observar a interface de investigação.
6. Prosseguir até “Cidade Acorda” e dispensar.

**Esperado**

- Cada frase cobre toda a tela.
- Nenhuma desaparece sem ação explícita do narrador (clique ou teclado).
- A ordem é exatamente a definida na especificação.
- “Cidade Acorda” não aparece se a partida terminar durante a noite.

### 4.5 Ações dos assassinos

1. Com dois ou mais assassinos vivos, escolher o mesmo alvo.
2. Processar as ações.
3. Repetir com alvos diferentes.
4. Tentar deixar um assassino sem alvo.

**Esperado**

- Alvo repetido é eliminado uma única vez.
- Alvos diferentes são eliminados.
- Ausência de alvo é permitida.
- Mortos não aparecem como executores nem como alvos.
- Um assassino pode escolher outro assassino.

### 4.6 Investigações

1. Na fase dos detetives, escolher um alvo vivo.
2. Verificar o papel revelado.
3. Tentar escolher um morto ou o próprio detetive.

**Esperado**

- O papel é revelado apenas ao narrador.
- O alvo não muda de status.
- Mortos e o próprio detetive não são elegíveis.

### 4.7 Amanhecer e votação

1. Concluir uma noite com um assassinato.
2. Dispensar “Cidade Acorda”.
3. Verificar os nomes dos eliminados.
4. Registrar um participante vivo como eliminado.
5. Em outro turno, registrar empate.

**Esperado**

- Eliminados são informados nominalmente.
- Sem mortes noturnas, aparece “Ninguém foi assassinado nesta noite”.
- Votação atualiza o status do eliminado para morto.
- Empate não altera status.
- Mortos não podem ser votados.
- Não existe interface de votos individuais.

### 4.8 Vitória automática

Cenários mínimos:

1. Eliminar o último assassino (por votação ou por ação de outro assassino).
2. Fazer os assassinos alcançarem paridade ou superioridade.
3. Provocar vitória durante a noite.

**Esperado**

- Vitória dos inocentes quando não há assassinos vivos.
- Vitória dos assassinos quando `assassinos >= inocentes + detetives`.
- A partida encerra imediatamente, sem etapa de detetives e sem votação quando a vitória ocorre à noite.
- O resultado aparece na mesma interação, sem confirmação adicional.
- O lado vencedor é exibido claramente.
- O turno decisivo entra em `turnCount` conforme a decisão D3.
- Na vitória dos assassinos, todos os não assassinos aparecem como mortos no resultado.
- Assassinos vivos permanecem vivos; assassinos já mortos permanecem mortos, sem ressurreição.
- O histórico salvo já mostra os status finais em massa.

### 4.9 Encerramento manual

1. Iniciar uma partida.
2. Abrir “Encerrar partida”, cancelar a confirmação.
3. Reabrir e confirmar.
4. Repetir durante uma sobreposição, uma ação noturna e a votação.
5. Observar se há apenas um botão de encerrar na tela.

**Esperado**

- Cancelar mantém a partida exatamente como estava.
- Confirmar encerra sem vencedor.
- Status vivo/morto é preservado.
- O turno em andamento não entra em `turnCount`.
- O botão único continua acessível acima da sobreposição, sem dispensá-la por engano.
- O encerramento não é duplicado dentro das sobreposições ou pop-ups.
- Não é possível encerrar duas vezes.

### 4.10 Persistência, histórico e ranking

1. Finalizar uma partida por vitória.
2. Finalizar outra manualmente com sobreviventes.
3. Abrir o histórico.
4. Abrir o ranking.
5. Recarregar a página.

**Esperado**

- Apenas partidas finalizadas aparecem no histórico.
- Cada detalhe mostra participantes, papéis, status final, turnos e resultado.
- Encerramento manual aparece como “sem vencedor”.
- O ranking conta uma sobrevivência por participante vivo em cada partida finalizada.
- Mortos não contam; na vitória dos assassinos, apenas assassinos vivos contam.
- Participantes com zero aparecem.
- Empates no ranking são ordenados alfabeticamente e, se necessário, por ID.
- Partidas em andamento não aparecem.
- Após recarregar, partidas finalizadas permanecem.
- Editar o nome de um participante atualiza o nome no histórico e no ranking.
- Um participante excluído continua no histórico e no ranking das partidas remanescentes, com o último nome.

### 4.11 Exclusão de partidas finalizadas

1. Finalizar duas partidas com o mesmo participante.
2. Abrir o histórico e excluir uma delas; cancelar em outra tentativa.
3. Confirmar a exclusão.
4. Abrir o ranking.
5. Recarregar a página.
6. Tentar excluir uma partida em andamento.

**Esperado**

- Cancelar mantém o histórico inalterado.
- Confirmar remove a partida do histórico de forma definitiva.
- O ranking é recalculado sem a contribuição da partida excluída.
- Participantes e outras partidas não são alterados.
- Após recarregar, a partida continua ausente.
- Não há ação de excluir partida em andamento.

### 4.12 Recarregamento durante a partida

1. Iniciar uma partida e conduzir parte de um turno.
2. Recarregar o navegador.

**Esperado**

- A sessão em andamento é perdida.
- Nenhuma partida incompleta aparece no histórico.
- Nenhum registro órfão é criado.
- Participantes e partidas anteriormente finalizadas permanecem.
- O narrador pode iniciar uma nova partida.

Essa é a limitação aceita pela estratégia D2.

## 5. Verificações de contrato

### 5.1 API

```bash
curl http://localhost:3001/participants
curl "http://localhost:3001/matches?status=FINISHED&_sort=endedAt&_order=desc"
```

- Participantes retornam `id`, `name` e `deletedAt`.
- Arquivar um participante via `PATCH` com `deletedAt` mantém o documento na API.
- Excluir uma partida finalizada via `DELETE /matches/:id` a remove; repetir retorna `404` e é tratado como já removida.
- Partidas retornam `MatchParticipant` embutidos, com status finais em massa quando aplicável.
- Não há recursos de turnos, ações, investigações ou ranking.
- Repetir `PUT` da mesma partida não cria duplicata.
- Não existe `DELETE /participants/:id` no fluxo da aplicação.

### 5.2 Motor

- Nenhuma função do motor importa React, `fetch` ou repositórios.
- Comandos fora da fase retornam erro de domínio por código.
- Mortos não agem, não são alvos e não votam.
- A fase dos detetives é omitida sem detetives vivos.
- A vitória interrompe o fluxo.
- A vitória dos assassinos aplica a atualização em massa antes de finalizar.
- `applyAssassinsVictoryStatuses` não ressuscita mortos nem altera papéis.

## 6. Critérios de aceite da validação

- [ ] Participantes criados/editados persistem e têm nome único no cadastro ativo.
- [ ] Excluir participante arquiva, preserva histórico/ranking e é bloqueado na partida ativa.
- [ ] Configuração inicia com todos os ativos selecionados, tem ações em massa e preserva papéis.
- [ ] Configuração exige cinco participantes e ao menos um assassino.
- [ ] Partida sem detetive funciona com a fase omitida.
- [ ] Sobreposições cobrem a tela e só somem com ação explícita (clique ou teclado).
- [ ] Ações noturnas e investigações funcionam sem persistência individual.
- [ ] Eliminações conjuntas e votação respeitam as regras.
- [ ] Vitória é automática e interrompe o fluxo.
- [ ] Na vitória dos assassinos, os status finais são atualizados em massa antes da persistência.
- [ ] Encerramento manual pede confirmação, não atribui vencedor e usa ponto único acima das sobreposições.
- [ ] Histórico e ranking consideram apenas partidas finalizadas.
- [ ] Partidas finalizadas podem ser excluídas e o ranking é recalculado.
- [ ] Recarregar perde a partida em andamento sem criar órfãos.
- [ ] `npm test`, `npm run lint` e `npm run build` passam.
