# Dataset — JarvisESS

## Tema geral

Otimização e geração de código em compiladores, com foco em representação intermediária.
Os documentos cobrem desde fundamentos teóricos (SSA, CFG, análise de fluxo de dados) até
técnicas modernas de otimização assistida por aprendizado de máquina.

## Origem dos documentos

| Fonte | Quantidade aproximada |
|---|---|
| ACM Digital Library | ~20 artigos |
| arXiv | ~10 artigos |
| Google Scholar | ~8 artigos |
| Outros (teses, relatórios técnicos) | ~3 documentos |

## Tipo de conteúdo

- Artigos científicos revisados por pares
- Teses de mestrado e relatórios técnicos
- Notas de aula e materiais didáticos sobre compiladores

## Quantidade de documentos

- **41 PDFs** em `data/raw/`
- **41 arquivos Markdown** processados em `data/processed/`

## Tópicos cobertos

- Representação intermediária (IR, SSA form, CFG, three-address code)
- Otimizações clássicas (dead code elimination, constant folding, CSE, loop unrolling)
- Alocação de registradores (graph coloring, linear scan)
- Análise de fluxo de dados (liveness analysis, dataflow)
- Geração de código (instruction selection, peephole optimization)
- LLVM: arquitetura, IR e backend
- Aprendizado de máquina aplicado a compiladores
- Geração de código com modelos de linguagem

## Arquivos do dataset

```
0952.pdf
1062261.1062293.pdf
1064979.1064998.pdf
1083142.1083143.pdf
1356058.1356080.pdf
1772954.1772979.pdf
177492.177575.pdf
1863523.1863538.pdf
1999tcad.pdf
2002-12-LattnerMSThesis-book.pdf
2003-09-30-LifelongOptimizationTR.pdf
2048147.2048224.pdf
2309.07062v1.pdf
237721.237727.pdf
2402.05256v2.pdf
2409.11068v2.pdf
277650.277665.pdf
3-540-08342-1_1.pdf
326619.326791.pdf
330249.330250.pdf
335231.335246.pdf
3503222.3507744.pdf
3503222.3507764.pdf
356893.356897.pdf
3611643.3617850.pdf
3708493.3712691.pdf
3711896.3736887.pdf
53_BSDCan2008ChrisLattnerBSDCompiler.pdf
565816.503298.pdf
75277.75280.pdf
773473.178256.pdf
800028.808480.pdf
800192.805690.pdf
872726.806984.pdf
FeautrierEDFAijpp91.pdf
code instruction.pdf
e3sconf_iconnect2023_04047.pdf
flowgraph.pdf
teja.pdf
translating_ssa.pdf
unpub-liveness.pdf
```

## Limitações do dataset

- **Idioma:** todos os documentos estão em inglês. O sistema usa modelo de embedding
  multilíngue (`paraphrase-multilingual-MiniLM-L12-v2`) para suportar perguntas em português.
- **Perda de figuras:** diagramas de CFG, ASTs e grafos de fluxo são ignorados na conversão
  PDF → Markdown, pois não há representação textual equivalente.
- **Tabelas de assembly:** tabelas com instruções de baixo nível perdem estrutura na conversão
  e podem gerar chunks de difícil interpretação pelo modelo de embedding.
- **Fórmulas matemáticas:** notações matemáticas complexas podem ser convertidas de forma
  imprecisa ou incompleta.
- **Artigos sem acesso aberto:** alguns artigos do ACM podem ter restrições de redistribuição;
  o dataset é de uso exclusivamente acadêmico.

## Processo de conversão PDF → Markdown

A conversão é feita pelo script `scripts/convert_pdfs.py` usando a biblioteca `pymupdf4llm`,
desenvolvida especificamente para preparar documentos para LLMs.

```bash
python3 scripts/convert_pdfs.py
```

O script:
- Lê todos os PDFs de `data/raw/`
- Converte cada um para Markdown preservando títulos, listas e tabelas
- Salva os resultados em `data/processed/`
- Pula arquivos já convertidos (`[SKIP]`)

## Estratégia de chunking

O chunking é implementado em `rag/chunker.py` em dois estágios:

### Estágio 1 — Split por headers Markdown

Usa `MarkdownHeaderTextSplitter` para dividir o documento respeitando a estrutura semântica:

```
# Título       → metadado "titulo"
## Seção        → metadado "secao"
### Subseção    → metadado "subsecao"
```

Isso garante que cada chunk não misture seções diferentes do artigo.

### Estágio 2 — Split por tamanho

Usa `RecursiveCharacterTextSplitter` com os parâmetros:

```python
chunk_size    = 800   # tamanho máximo em caracteres
chunk_overlap = 100   # sobreposição entre chunks consecutivos
separators    = ["\n\n", "\n", ". ", " ", ""]
```

O `chunk_overlap` de 100 caracteres evita perda de contexto nas bordas dos chunks.
Os separadores priorizam quebras em parágrafos antes de quebrar no meio de frases.

### Filtragem de qualidade

Após o split, chunks com menos de 100 caracteres de conteúdo real (excluindo
marcadores Markdown) são descartados. Isso elimina:

- Linhas com apenas `##` ou espaços
- Avisos de imagem omitida (`==> picture omitted <==`)
- Linhas de tabela vazias (`|---|---|`)

### Resultado

Com o dataset de 41 documentos:

| Métrica | Valor |
|---|---|
| Chunks gerados | ~750 |
| Chunks ignorados por baixa qualidade | ~49 |
| Tamanho médio | ~565 chars |
| Menor chunk válido | ~121 chars |
| Maior chunk | 799 chars |

## Modelo de embedding

```
paraphrase-multilingual-MiniLM-L12-v2
```

Escolhido por suportar múltiplos idiomas — mapeia perguntas em português e
conteúdo em inglês para vetores semanticamente próximos no mesmo espaço vetorial.

## Impacto do chunking no RAG

- Chunks maiores (800 chars) fornecem contexto suficiente para artigos científicos densos,
  evitando respostas baseadas em trechos isolados sem sentido.
- O split por headers garante que a LLM receba trechos coerentes com início e fim definidos.
- A filtragem elimina ruído que prejudicaria a similaridade semântica na busca.
- O overlap reduz a chance de uma informação importante ser cortada exatamente na divisão.