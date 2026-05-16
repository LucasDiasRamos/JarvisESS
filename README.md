# JarvisIA

## Executar o frontend

O frontend foi migrado para Vite + React e fica na pasta `frontend`.

```bash
cd frontend
npm install
npm run dev
```

Depois acesse:

```text
http://localhost:5173/
```

Para gerar a versao de producao:

```bash
cd frontend
npm run build
```

Os PDFs da pasta `data/raw` sao servidos pelo Vite como arquivos estaticos em `/raw/...`, por exemplo:

```text
http://localhost:5173/raw/1062261.1062293.pdf
```

## Executar o backend

O backend usa Node.js, Express e SQLite. Ao iniciar, ele cria automaticamente o banco `backend/jarvis.db` usando o schema em `backend/database/schema.sql`.

```bash
cd backend
npm install
npm run dev
```

A API fica disponivel em:

```text
http://localhost:3001
```

### Exemplos de uso da API

Criar usuario:

```bash
curl -X POST http://localhost:3001/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome":"Mariana Reis","email":"mariana@example.com","tipo":"aluno"}'
```

Listar usuarios:

```bash
curl http://localhost:3001/usuarios
```

Cadastrar PDF:

```bash
curl -X POST http://localhost:3001/arquivos \
  -H "Content-Type: application/json" \
  -d '{"usuario_id":1,"nome_arquivo":"aula.pdf","caminho_arquivo":"data/raw/aula.pdf"}'
```

Criar conversa e mensagem:

```bash
curl -X POST http://localhost:3001/conversas \
  -H "Content-Type: application/json" \
  -d '{"usuario_id":1,"titulo":"Duvidas de Calculo"}'

curl -X POST http://localhost:3001/mensagens \
  -H "Content-Type: application/json" \
  -d '{"conversa_id":1,"remetente":"usuario","conteudo":"Resuma este PDF"}'
```

Criar e concluir tarefa:

```bash
curl -X POST http://localhost:3001/tarefas \
  -H "Content-Type: application/json" \
  -d '{"usuario_id":1,"titulo":"Revisar derivadas","data_limite":"2026-05-20"}'

curl -X PUT http://localhost:3001/tarefas/1/concluir
```

Criar lembrete:

```bash
curl -X POST http://localhost:3001/lembretes \
  -H "Content-Type: application/json" \
  -d '{"usuario_id":1,"titulo":"Prova de Calculo","data_hora":"2026-05-20 19:00:00"}'
```
