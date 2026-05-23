# Avaliacao do Sistema — JarvisESS

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
| 1 | O que é SSA form? | 3711896.3736887, 2409.11068v2 | Explicou corretamente Static Single Assignment como forma de IR onde cada variavel e definida exatamente uma vez | correta | RAG recuperou trechos relevantes do artigo sobre SSA |
| 2 | Explique dead code elimination | 3708493.3712691, 3611643.3617850 | Descreveu corretamente como otimizacao que remove codigo que nao afeta o resultado do programa | correta | Boa recuperacao de contexto |
| 3 | O que tenho hoje? | — | Listou lembretes do dia corretamente via tool `listar_lembretes` | correta | LLM escolheu a tool correta sem instrucao explicita |
| 4 | Adiciona uma tarefa para estudar register allocation | — | Criou a tarefa via tool `criar_tarefa` e confirmou ao usuario | correta | Tool calling funcionou corretamente |
| 5 | Quais sao minhas tarefas pendentes? | — | Listou as tarefas nao concluidas via tool `listar_tarefas` | correta | Filtro de pendentes funcionou |
| 6 | Gera 3 exercicios sobre constant folding | 1356058.1356080, 3503222.3507744 | Gerou 3 questoes de multipla escolha com gabarito baseadas no material | parcialmente correta | Exercicios corretos mas gabarito de uma questao estava impreciso |
| 7 | Me testa sobre otimizacao de loops | 3503222.3507764, 277650.277665 | Fez uma pergunta clara sobre loop unrolling e aguardou resposta do usuario | correta | Fluxo de active recall funcionou corretamente |
| 8 | Monte um plano de estudos para minha prova de compiladores | lembretes + tarefas + RAG | Combinou agenda, tarefas pendentes e materiais relevantes em um plano estruturado | parcialmente correta | Plano gerado foi generico; nao priorizou topicos com base na proximidade da prova |
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

### Falha 1 — Recuperacao incorreta para perguntas especificas

**Pergunta:** "O que e register allocation por graph coloring?"

**Comportamento observado:** O RAG recuperou chunks sobre alocacao de registradores em geral, mas nao trouxe o trecho especifico sobre spilling, que estava em outro artigo. A resposta omitiu esse conceito importante.

**Tipo:** Recuperacao

**Causa:** O chunk_size de 800 caracteres faz com que conceitos relacionados (graph coloring e spilling) fiquem em chunks diferentes. A busca por similaridade retorna os chunks mais proximos da query, mas nao garante cobertura de todos os subtopicos relacionados.

**Possivel solucao:** Aumentar `n_results` de 3 para 5 nas queries mais especificas, ou implementar busca em duas etapas: primeiro recupera chunks relevantes, depois expande para chunks adjacentes do mesmo documento.

---

### Falha 2 — Plano de estudos generico sem priorizacao temporal

**Pergunta:** "Monte um plano de estudos para minha prova de compiladores"

**Comportamento observado:** O Jarvis gerou um plano de estudos estruturado, mas tratou todos os topicos com a mesma prioridade, sem considerar quantos dias faltam para a prova ou quais tarefas ja estavam concluidas.

**Tipo:** Geracao

**Causa:** A tool `montar_plano_estudos` combina agenda, tarefas e materiais, mas o prompt enviado para a LLM nao instrui explicitamente a priorizar topicos com base na urgencia ou na data da prova.

**Possivel solucao:** Incluir no prompt da tool a data atual e a data da prova, instruindo a LLM a distribuir os topicos pelos dias disponiveis e priorizar os com maior peso na avaliacao.

---

### Falha 3 — Gabarito impreciso em exercicios gerados

**Pergunta:** "Gera 3 exercicios sobre constant folding"

**Comportamento observado:** Os 3 exercicios foram gerados corretamente, mas o gabarito de uma das questoes indicava uma alternativa incorreta como correta. O erro estava na interpretacao do trecho recuperado pelo RAG.

**Tipo:** Geracao

**Causa:** O chunk recuperado descrevia constant folding em um contexto especifico (compilacao JIT), e a LLM generalizou incorretamente para o caso geral. A falta de chunk complementar com a definicao geral causou a imprecisao.

**Possivel solucao:** Para a tool `gerar_exercicios`, aumentar `n_results` para 5 e incluir no prompt uma instrucao para a LLM verificar a consistencia do gabarito com o contexto antes de responder. Alternativamente, incluir no prompt a instrucao de citar o trecho do material que justifica cada gabarito.