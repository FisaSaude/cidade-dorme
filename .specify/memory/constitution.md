<!-- Sync Impact Report
Version change: — → 1.0.0 (initial constitution)
Modified principles: none (new document)
Added sections: Core Principles (Princípios I–V), Restrições, Evolução do Projeto, Governance
Removed sections: none
Follow-up TODOs: none
-->

# Cidade Dorme Constitution

## Core Principles

### I. Arquitetura e Organização
- Organizar o código seguindo Feature-Sliced Design (FSD), agrupando funcionalidades por domínio de negócio (features) em camadas bem definidas.
- Adotar MVVM para separar a interface (View), o estado (ViewModel) e a lógica de apresentação (Model).
- Manter as regras de negócio independentes da interface e da camada de persistência.
- Evitar abstrações e camadas desnecessárias; adicionar apenas quando houver justificativa clara.
- Priorizar componentes reutilizáveis apenas quando houver justificativa de reuso real.
Rationale: separar preocupações por domínio facilita a manutenção e a testabilidade das regras de negócio do jogo.

### II. Tecnologias e Padrões
- Utilizar React com JavaScript; TypeScript não é permitido.
- Preservar a configuração e os recursos existentes do Vite.
- Utilizar JSON Server como mecanismo de persistência simulada.
- Nomear variáveis, funções, componentes e identificadores em inglês.
- Manter documentação, especificações e demais documentos do projeto em português brasileiro.

### III. Qualidade de Código
- Priorizar código simples, legível e de fácil manutenção.
- Aplicar responsabilidade única e baixo acoplamento.
- Evitar duplicação de lógica.
- Utilizar tratamento adequado de erros.
- Não introduzir dependências sem necessidade justificada.

### IV. Interface e Experiência
- Adotar identidade visual dark / sombria, coerente com a temática de mistério do jogo.
- Priorizar atmosfera imersiva com animações, transições e elementos visuais dramáticos quando apropriado.
- Garantir boa legibilidade, hierarquia visual e facilidade de utilização pelo narrador.
- Utilizar pop-ups e sobreposições para momentos especiais da experiência.
- Garantir que a interface continue funcional e compreensível mesmo sem animações.

### V. Testes e Confiabilidade
- Definir padrões para testes de regras de negócio e comportamentos relevantes.
- Priorizar testes para regras que possam alterar o resultado de uma partida.
- Evitar dependência da interface para validar regras de negócio.

## Restrições
- Não utilizar TypeScript.
- Não implementar autenticação ou sistema de login.
- Não implementar sorteio automático de papéis.
- Não antecipar requisitos específicos das funcionalidades nas regras gerais desta Constituição.

## Evolução do Projeto
- Preservar decisões arquiteturais e padrões estabelecidos.
- Evitar refatorações amplas sem justificativa.
- Toda alteração relevante deverá respeitar os princípios definidos nesta Constituição.
- Mudanças de arquitetura ou de escopo deverão ser justificadas e validadas.

## Governance
- Esta Constituição prevalece sobre todas as demais práticas de desenvolvimento do projeto.
- Alterações nesta Constituição devem ser documentadas, aprovadas e acompanhadas de plano de migração quando aplicável.
- Todas as pull requests e revisões devem verificar o cumprimento dos princípios definidos.
- Qualquer desvio dos princípios deve ser justificado.
- O documento deve ser revisado periodicamente para garantir conformidade com a evolução do projeto.

**Version**: 1.0.0 | **Ratified**: 2026-11-14 | **Last Amended**: 2026-11-14
