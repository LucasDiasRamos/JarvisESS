# Análise de Erros

## Falha 1 - Recuperação incorreta no RAG

Tipo: Recuperação.

Causa:
O sistema pode recuperar trechos pouco relacionados quando a pergunta usa termos amplos ou quando o conceito está distribuído em vários documentos.

Possível solução:
Adicionar metadados de disciplina, tema e tipo de conteúdo aos chunks, além de ajustar ranking e tamanho de chunk para perguntas conceituais.

---

## Falha 2 - Resposta genérica da LLM

Tipo: Geração.

Causa:
Quando o contexto recuperado é pequeno ou indireto, a LLM pode usar conhecimento geral em vez de se apoiar claramente nos documentos.

Possível solução:
Reforçar o prompt para priorizar os trechos recuperados e declarar quando não houver evidência suficiente nos materiais.

---

## Falha 3 - Execução incompleta de múltiplas tools

Tipo: Tool Calling.

Causa:
O fluxo anterior executava apenas uma ferramenta por mensagem, o que prejudicava pedidos compostos como criar um evento e montar um plano.

Possível solução:
Implementar fluxo iterativo de tool calling. A versão atual permite múltiplas rodadas de tools e também aceita uma lista de tools na mesma resposta JSON.
