# Avaliação do Sistema — JarvisESS

## Metodologia

O sistema foi avaliado com 10 perguntas cobrindo as principais funcionalidades:
RAG, agenda, tarefas, planejamento de estudos e melhorias de aprendizado.

Para cada pergunta foram registrados:
- pergunta enviada ao sistema
- documentos recuperados pelo RAG (quando aplicavel)
- resposta gerada pelo Jarvis
- classificacao: **correta**, **parcialmente correta** ou **incorreta**
- observacoes sobre o comportamento

---

## Tabela de avaliacao

| # | Pergunta | Docs recuperados | Resposta resumida | Classificacao | Observacoes |
|---|---|---|---|---|---|
| 1 | O que é SSA form? | 1772954.1772979 | Explicou corretamente Static Single Assignment como forma de IR onde cada variavel e definida exatamente uma vez | correta | RAG recuperou trechos relevantes do artigo sobre SSA |
| 2 | Explique dead code elimination | - | Descreveu corretamente como otimizacao que remove codigo que nao afeta o resultado do programa | parcialmente correta | Boa recuperacao de contexto |
| 3 | O que tenho hoje? | — | Listou lembretes do dia corretamente via tool `listar_lembretes` | correta | LLM escolheu a tool correta sem instrucao explicita |
| 4 | Adiciona uma tarefa para estudar register allocation | — | Criou a tarefa via tool `criar_tarefa` e confirmou ao usuario | correta | Tool calling funcionou corretamente |
| 5 | Quais sao minhas tarefas pendentes? | — | Listou as tarefas nao concluidas via tool `listar_tarefas` | correta | Filtro de pendentes funcionou |
| 6 | Gera 3 exercicios sobre constant folding | 1356058.1356080, 3503222.3507744 | Gerou 3 questoes de multipla escolha com gabarito baseadas no material | parcialmente correta | Exercicios corretos mas gabarito de uma questao estava impreciso |
| 7 | Me testa sobre otimizacao de loops | e3sconf_iconnect2023_04047 | Fez uma pergunta clara sobre loop unrolling e aguardou resposta do usuario | correta | Fluxo de active recall funcionou corretamente |
| 8 | Monte um plano de estudos para minha prova de compiladores | lembretes + tarefas + RAG | Combinou agenda, tarefas pendentes e materiais relevantes em um plano estruturado | parcialmente correta | Plano gerado foi generico; |
| 9 | O que e register allocation por graph coloring? | 800028.808480, 75277.75280 | Explicou o algoritmo corretamente mas sem detalhes sobre spilling | parcialmente correta | RAG nao recuperou o trecho especifico sobre spilling |
| 10 | Resuma o conteudo sobre LLVM IR | 2002-12-LattnerMSThesis-book, 53_BSDCan2008 | Gerou um resumo coerente sobre a arquitetura do LLVM e seu IR | correta | Boa sintese de multiplas fontes |

---

## Resumo

| Classificacao | Quantidade |
|---|---|
| Correta | 6 |
| Parcialmente correta | 3 |
| Incorreta | 0 |
| **Total** | **10** |

---

## Analise de Erros


### Falha 1 — Geração de longas mensagens

**Pergunta:** "Resuma o conteudo sobre LLVM IR"

**Comportamento observado:** O Jarvis gerou uma resposta resumindo o conteudo com tudo a geração foi interrempida por provavelmente uma limitação de tokens assim impendindo a criação de grandes textos.

**Tipo:** Geracao

**Causa:** No arquivo `llm_clients,py` existe uma variavel nomeada MAX_TOKENS que está diretamente alocado no `.env` do projeto, onde ela limita a geração de tokens e também no arquivo `jarvisController` existe um controller de timeout que pode estar entrando.  .

**Possivel solucao:** Aumentar os valores mencionados no arquivo `.env` para valores maiores..

### Falha 2 — Inconsistencia de Recuperção de Documentos

**Pergunta:** "Explique oque é dead code elimination"

**Comportamento observado:** O Jarvis tem uma insconsistencia com relação a conhecimentos que foram usados no treinamento da LLM. Priorizando o conhecimento ao Inves dos Documentos de RAG. 

**Possivel solucao:** Ajustes no arquivo `System_Prompt` para priorizar o RAG e os documentos do usuario ao inves dos conhecimentos da LLM. 

### Falha 3 — Realização de duas ou mais Tool calling

**Pergunta:** "Monte um plano de estudos para minha prova de compiladores que será no dia 23/06, marque na minha agenda a data da prova"

**Comportamento observado:** O Jarvis tem uma inconsistencia a chamar 2 ou mais tool calling, gerando apenas uma das tools e a outra sendo uma resposta generica.

**Possivel solucao:** Implementar um mecanismo de execução sequencial de múltiplas tools, permitindo que o Jarvis identifique quando uma solicitação do usuário contém mais de uma intenção. Nesse caso, a IA deve dividir a pergunta em subtarefas independentes, executar cada tool necessária em ordem e ao final, consolidar uma única resposta para o usuário.
