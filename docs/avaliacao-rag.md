# Avaliacao RAG

Use estas perguntas para testar manualmente se o Jarvis esta recuperando trechos relevantes dos materiais e respondendo com base nos documentos.

## Perguntas factuais

- O que e LLVM IR e por que ele e usado como representacao intermediaria?
- Quais sao as principais diferencas entre LLVM IR textual, em memoria e binario?
- Qual problema o backend LLVM do GHC tenta resolver?
- O que e SSA e qual a vantagem de usar esse formato em compiladores?
- O que o Emscripten faz ao compilar codigo para JavaScript?

## Perguntas de comparacao

- Compare o backend nativo do GHC com o backend LLVM.
- Compare Csmith e tecnicas baseadas em mutacao para teste de compiladores.
- Compare otimizacao por passes tradicionais com abordagens usando modelos de linguagem.
- Quais diferencas aparecem entre fuzzing end-to-end e fuzzing direto de LLVM IR?

## Perguntas de explicacao

- Explique de forma simples o que e dead code elimination.
- Explique por que programas grandes podem ser um problema para modelos de linguagem em tarefas de compiladores.
- Explique como ferramentas de fuzzing ajudam a encontrar bugs em compiladores.
- Explique o papel de um pass list em otimizacao de LLVM.

## Perguntas que exigem citacao de fonte

- Cite quais documentos ou trechos sustentam a resposta sobre LLVM IR.
- Em quais materiais aparece discussao sobre fuzzing de compiladores?
- Quais documentos falam sobre modelos de linguagem aplicados a otimizacao de compiladores?
- Quais fontes mencionam GHC e LLVM?

## Perguntas de exercicio

- Gere 3 exercicios de multipla escolha sobre LLVM IR.
- Gere um quiz sobre dead code elimination.
- Me teste com active recall sobre fuzzing de compiladores.
- Crie uma pergunta sobre backend LLVM do GHC para eu responder.

## Perguntas fora do escopo

Estas perguntas devem testar se o Jarvis reconhece falta de contexto em vez de inventar resposta:

- O que meu professor falou na aula de ontem?
- Qual foi minha nota na prova?
- Resuma um PDF que eu ainda nao enviei.
- Segundo meus materiais, qual e a melhor linguagem para aprender em 2026?

## Criterios de avaliacao

- A resposta usa informacoes recuperadas dos materiais, nao conhecimento generico solto.
- A resposta menciona incerteza quando os materiais nao sustentam a pergunta.
- A resposta nao inventa fonte.
- Perguntas de exercicio geram questoes reais para responder, nao tarefas no calendario.
- Respostas curtas como `A`, `B`, `C` ou `D` continuam a conversa do exercicio anterior.
- O log `rag.jsonl` registra documentos recuperados, chunks usados e resposta gerada.

Ver logs de RAG:

```bash
docker compose exec backend tail -f /app/data/logs/rag.jsonl
```
