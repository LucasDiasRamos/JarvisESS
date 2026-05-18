# JarvisIA

## Executar com Docker

Suba o backend e o frontend juntos:

```bash
docker compose up --build
```

Depois acesse:

```text
Frontend: http://localhost:5173
API: http://localhost:3001
```

O compose usa o volume `jarvis-data` para persistir o SQLite e os PDFs/Markdown em `data`. O frontend e o backend compartilham esse volume para que os PDFs cadastrados fiquem disponiveis em `/raw/...`.

Para subir em background:

```bash
docker compose up --build -d
```

Para conferir se tudo subiu corretamente:

```bash
docker compose ps
curl http://localhost:3001/
curl -I http://localhost:5173/
```

O backend deve aparecer como `healthy`, a API deve responder `{"app":"Jarvis API","status":"ok"}` e o frontend deve responder `HTTP/1.1 200 OK`.

Para consultar logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

Para parar os containers:

```bash
docker compose down
```

Observacao: o backend usa o pacote nativo `sqlite3`. A imagem Docker do backend usa `node:22-trixie-slim` para evitar erro de runtime com glibc, como `GLIBC_2.38 not found`, que pode acontecer em bases Debian mais antigas.

### Exemplos de uso da API

Criar usuario:

```bash
curl -X POST http://localhost:3001/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome":"Mariana Reis","email":"mariana@example.com","tipo":"aluno"}'
```
