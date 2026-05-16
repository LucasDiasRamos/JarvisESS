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
