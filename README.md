
# Cidade Dorme — Apoio ao Narrador

## 1. Projeto e integrantes

O Cidade Dorme é uma aplicação web desenvolvida para facilitar a organização de partidas presenciais do jogo. A ideia é ajudar o narrador a gerenciar os participantes, configurar os papéis, conduzir as fases da noite e da votação, além de consultar o histórico e o ranking das partidas. O projeto busca reduzir o trabalho manual e tornar a condução das partidas mais simples e organizada.

**Integrantes:** Wendel, Edson, Dandara, Isabela e Vinicius.

## 2. Framework utilizado

O grupo utilizou o **GitHub Spec Kit**, que trabalha com a abordagem Spec-Driven Development. Escolhemos esse framework para organizar melhor o desenvolvimento com inteligência artificial, definindo primeiro o que deveria ser feito antes de partir para a implementação. Isso ajudou a manter as funcionalidades alinhadas com a proposta do projeto e diminuiu as chances de o agente tomar decisões diferentes do que o grupo havia planejado.

## 3. Como rodar

**Pré-requisitos:** Node.js 24 ou compatível com Vite 8 e npm.

Na raiz do projeto, execute:

```bash
npm install
npm run dev:all
```

Esse comando inicia o frontend e a API ao mesmo tempo. Também é possível iniciar os serviços separadamente, utilizando dois terminais:

```bash
npm run dev:api
npm run dev
```

Depois, acesse `http://localhost:5173`. A API simulada fica disponível em `http://localhost:3001`.

## 4. Onde estão os artefatos

Os documentos utilizados durante o desenvolvimento seguem a organização do GitHub Spec Kit:

- **Spec:** `specs/001-cidade-dorme/spec.md`
- **Plano:** `specs/001-cidade-dorme/plan.md`
- **Tarefas:** `specs/001-cidade-dorme/tasks.md`

## 5. Reflexão

**Que decisão o agente teria tomado sozinho e a spec evitou?**

Sem uma especificação clara, o agente poderia implementar funcionalidades que não faziam parte da proposta, como um sistema de votação dentro da aplicação. A spec ajudou a deixar claro que a votação acontece presencialmente e que o narrador é responsável por registrar o resultado.

**Que inconsistência a validação encontrou? Estava na spec ou no código?**

Um exemplo seria o comportamento das eliminações durante a votação. Caso o sistema eliminasse um jogador automaticamente em uma situação de empate, estaria contrariando a regra definida. Nesse caso, o problema estaria no código, e não na especificação.

**Como o framework ajudou (ou atrapalhou) a coordenação do grupo?**

O Spec Kit ajudou a organizar as funcionalidades e dividir o desenvolvimento em tarefas menores, facilitando o acompanhamento do que precisava ser feito. Por outro lado, foi necessário dedicar um tempo maior à documentação e à atualização dos arquivos sempre que alguma decisão do projeto mudava.

**O que fariam diferente com outro framework?**

Com outro framework, tentaríamos simplificar um pouco a documentação e validar as funcionalidades com mais frequência durante a implementação. Mesmo assim, manteríamos a ideia de definir os requisitos e organizar as tarefas antes de começar a desenvolver.
