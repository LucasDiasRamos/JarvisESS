# JarvisIA

## Feito por Lucas Mateus Dias Ramos e Marco Antônio de Rezende Zarate 

Assistente academico com chat, RAG sobre PDFs, tarefas, lembretes, historico de conversas, upload de documentos e logs de observabilidade.

## Stack

- Frontend: React + Vite servido por Nginx
- Backend: Node.js + Express
- IA: cliente Python OpenAI-compatible
- Banco: SQLite
- RAG: ChromaDB + sentence-transformers
- Runtime: Docker Compose

## Executar com Docker

Suba backend e frontend:

```bash
docker compose up --build -d
```

Acesse:

```text
Frontend: http://localhost:5173
API: http://localhost:3001
```

Verifique se tudo subiu:

```bash
docker compose ps
curl http://localhost:3001/
curl -I http://localhost:5173/
```

O backend deve aparecer como `healthy`, a API deve responder:

```json
{"app":"Jarvis API","status":"ok"}
```

Para parar:

```bash
docker compose down
```

## Variaveis de ambiente

Configure a LLM no `.env` da raiz ou no ambiente do shell:

```env
JARVIS_LLM_API_KEY=sua_chave
JARVIS_LLM_BASE_URL=https://seu-endpoint/v1
JARVIS_LLM_MODEL=google/gemma-3-12b-it
JARVIS_LLM_TIMEOUT=30
JARVIS_LLM_MAX_TOKENS=1500
JARVIS_CHAT_TIMEOUT_MS=90000
```

O `docker-compose.yml` repassa essas variaveis para o backend.

## Banco de dados

O SQLite usado pelo Docker fica dentro do volume nomeado `jarvis-data`:

```text
/app/data/jarvis.db
```

```bash
docker compose exec backend sqlite3 /app/data/jarvis.db
```

## Requisitos do trabalho atendidos

| Requisito | Status | Onde encontrar |
|---|---|---|
| RAG com embeddings e ChromaDB | Implementado | `rag/`, `backend/ai/tools/rag_tools.py` |
| Consulta a materiais de estudo | Implementado | Tool `buscar_material_rag` |
| Agenda academica | Implementado | Tools `criar_lembrete`, `listar_lembretes` |
| Lista de tarefas | Implementado | Tools `criar_tarefa`, `listar_tarefas`, `concluir_tarefa` |
| Tool calling com decisao pela LLM | Implementado | `backend/ai/tool_router.py` |
| Logs de tool calling | Implementado | `data/logs/tools.jsonl` |
| Geracao de exercicios | Implementado | Tool `gerar_exercicios` |
| Active recall interativo | Implementado | Tools `iniciar_active_recall`, `avaliar_resposta_active_recall` |
| Avaliacao com 10 perguntas | Documentado | `docs/avaliacao_sistema.md` |
| Analise de erros | Documentado | `docs/avaliacao_sistema.md` |
| Dataset com 10+ documentos | Implementado | `data/` — 41 documentos |
| Documentacao do dataset | Documentado | `data/README.md` |

## Ferramentas de IA utilizadas no desenvolvimento

| Ferramenta | Uso |
|---|---|
| Claude (Anthropic) | Apoio na arquitetura, revisao de codigo, geracao de modulos RAG e logs |
| GitHub Copilot | Sugestao de trechos de codigo no editor |
| Codex (OpenAI) | Apoio na arquitetura, revisao de codigo, apoio na geração do frontend e Integração com o Backend. |

## Dataset e chunking

O dataset contém 41 artigos científicos sobre otimização e geração de código em compiladores,
coletados do ACM Digital Library, arXiv e Google Scholar.

A estratégia de chunking usa dois estágios:
1. Split por headers Markdown (`MarkdownHeaderTextSplitter`)
2. Split por tamanho com `chunk_size=800` e `chunk_overlap=100`

Chunks com menos de 100 caracteres de conteúdo real são descartados automaticamente.

Documentação completa em [`data/README.md`](data/README.md).

## Avaliacao e analise de erros

O sistema foi avaliado com 10 perguntas cobrindo RAG, agenda, tarefas, planejamento e aprendizado.
Foram identificadas e documentadas 3 falhas reais com tipo, causa e possível solução.

Documentação completa em [`docs/avaliacao_sistema.md`](docs/avaliacao_sistema.md).

## Funcionalidades

### Chat

- Envia mensagens para `/jarvis/chat`.
- Cria uma conversa automaticamente na primeira mensagem.
- Salva mensagens do usuario e respostas do Jarvis.
- Lista o historico real na gaveta lateral do chat.
- Carrega mensagens antigas ao clicar numa conversa.
- Resposta do Jarvis aparece com animacao de digitacao.

### Documentos

- Upload de PDFs pelo frontend.
- Conversao para Markdown no backend.
- PDFs ficam acessiveis no frontend via `/raw/...`.
- A tela de Documentos lista arquivos reais vindos do banco.
- Exemplos de perguntas para avaliar RAG estao em [`docs/avaliacao-rag.md`](docs/avaliacao-rag.md).

### Area do aluno

- Tarefas reais do usuario em `/tarefas/user/:user_id`.
- Lembretes reais em `/lembretes/user/:user_id`.
- Itens criados pela tela recebem `origem: "user"`.
- Itens criados pelas tools da IA recebem `origem: "jarvis"`.
- Apenas itens com `origem: "jarvis"` mostram o selo "criado pelo Jarvis".
- Calendario permite criar itens por tipo: Prova, Entrega, Aula e Evento.

## Tools disponiveis

As tools abaixo ficam registradas em `backend/ai/tool_router.py` e podem ser chamadas pela LLM via tool calling.

### Tarefas

- `criar_tarefa`: cria uma tarefa para o aluno.
- `listar_tarefas`: lista as tarefas do aluno.
- `concluir_tarefa`: marca uma tarefa como concluida.
- `excluir_tarefa`: exclui uma tarefa.

### Calendario e lembretes

- `criar_lembrete`: cria um lembrete no calendario.
- `listar_lembretes`: lista lembretes por usuario, periodo ou intervalo de datas.
- `alterar_lembrete`: altera titulo, descricao, data/hora ou tipo de um lembrete.
- `excluir_lembrete`: exclui um lembrete.

### Conversas

- `criar_conversa`: cria uma conversa.
- `listar_conversas`: lista conversas do usuario.
- `salvar_mensagem`: salva uma mensagem em uma conversa.
- `listar_mensagens`: lista mensagens de uma conversa.

### Arquivos

- `registrar_arquivo`: registra um PDF enviado pelo usuario.
- `listar_arquivos`: lista PDFs enviados pelo usuario.
- `deletar_arquivo`: exclui um PDF registrado.

### RAG e estudo

- `buscar_material_rag`: busca informacoes nos materiais enviados pelo aluno.
- `gerar_exercicios`: gera exercicios reais para o aluno responder com base nos materiais.
- `iniciar_active_recall`: inicia uma pergunta de active recall sobre um tema.
- `avaliar_resposta_active_recall`: avalia a resposta do aluno em uma sessao de active recall.

### Logs

A tela `Logs` no frontend permite visualizar:

- Tool calling
- RAG
- Agenda
- Tarefas
- Erros
- Uploads

No Docker, os logs persistem em:

```text
/app/data/logs
```

Arquivos:

```text
tools.jsonl
rag.jsonl
agenda.jsonl
tarefas.jsonl
erros.jsonl
uploads.jsonl
jarvis.log
```

Endpoints:

```text
GET /logs/tools?limit=200
GET /logs/rag?limit=200
GET /logs/agenda?limit=200
GET /logs/tarefas?limit=200
GET /logs/erros?limit=200
GET /logs/uploads?limit=200
```

## Endpoints principais

Tipos usados no calendario:

```text
exam      Prova
deadline  Entrega
class     Aula
event     Evento
```

### Documentos

Listar:

```bash
curl http://localhost:3001/arquivos
```

Upload:

```bash
curl -X POST "http://localhost:3001/arquivos/upload?usuario_id=1" \
  -F "arquivo=@/caminho/arquivo.pdf"
```

## Testes rapidos de diagnostico

Testar API:

```bash
curl http://localhost:3001/
```

Testar LLM pelo endpoint do app:

```bash
curl -X POST http://localhost:3001/jarvis/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"responda apenas ok","user_id":1}'
```

Ver logs do backend:

```bash
docker compose logs -f backend
```

Ver logs estruturados:

```bash
docker compose exec backend tail -f /app/data/logs/tools.jsonl
docker compose exec backend tail -f /app/data/logs/erros.jsonl
```

## Observacoes

- O backend usa `sqlite3`, um pacote nativo. A imagem Docker usa `node:22-trixie-slim` para evitar problemas de runtime com glibc.
- O volume `jarvis-data` persiste SQLite, ChromaDB e logs; os PDFs e Markdown ficam nos diretórios locais `./data/raw` e `./data/processed`.
- O arquivo local `./data/jarvis.db` pode estar diferente do banco real do container.
