import re
from pathlib import Path
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

PROCESSED_DIR = Path(__file__).parent.parent / "data" / "processed"

def _limpar_chunk(texto: str) -> str:
    """Remove ruído comum em artigos científicos convertidos de PDF."""
    # Remove linhas com apenas # ou espaços
    texto = re.sub(r'^#+\s*$', '', texto, flags=re.MULTILINE)
    # Remove avisos de imagem omitida
    texto = re.sub(r'==>.*?<==', '', texto)
    # Remove linhas de tabela vazias (|---|---|)
    texto = re.sub(r'^\|[-| ]+\|$', '', texto, flags=re.MULTILINE)
    # Remove espaços extras e linhas em branco múltiplas
    texto = re.sub(r'\n{3,}', '\n\n', texto)
    return texto.strip()

def _chunk_valido(texto: str, min_chars: int = 100) -> bool:
    """Verifica se o chunk tem conteúdo útil ignorando markdown."""
    sem_markdown = re.sub(r'[#\|\-\s]', '', texto)
    return len(sem_markdown) >= min_chars

def load_chunks(chunk_size: int = 800, chunk_overlap: int = 100) -> list[dict]:
    """
    Carrega todos os .md de data/processed e divide em chunks.
    Aplica limpeza e filtragem de qualidade.
    Retorna lista de dicts com 'text', 'source' e 'chunk_id'.
    """
    header_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=[
            ("#", "titulo"),
            ("##", "secao"),
            ("###", "subsecao"),
        ],
        strip_headers=False
    )

    char_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    all_chunks = []
    ignorados = 0
    global_i = 0

    md_files = list(PROCESSED_DIR.glob("*.md"))
    print(f"[CHUNKER] {len(md_files)} arquivos encontrados.")

    for md_path in md_files:
        text = md_path.read_text(encoding="utf-8")
        header_chunks = header_splitter.split_text(text)

        for chunk in header_chunks:
            texto_limpo = _limpar_chunk(chunk.page_content)

            if not _chunk_valido(texto_limpo):
                ignorados += 1
                continue

            sub_chunks = char_splitter.split_text(texto_limpo)

            for sub in sub_chunks:
                sub_limpo = _limpar_chunk(sub)

                if not _chunk_valido(sub_limpo):
                    ignorados += 1
                    continue

                all_chunks.append({
                    "text": sub_limpo,
                    "source": md_path.stem,
                    "chunk_id": f"chunk_{global_i}"
                })
                global_i += 1

    print(f"[CHUNKER] {len(all_chunks)} chunks gerados. ({ignorados} ignorados por baixa qualidade)")
    return all_chunks