import sys
sys.path.append(".")

from pathlib import Path
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
import re

PROCESSED_DIR = Path(__file__).parent.parent / "data" / "processed"

def _limpar_chunk(texto: str) -> str:
    texto = re.sub(r'^#+\s*$', '', texto, flags=re.MULTILINE)
    texto = re.sub(r'==>.*?<==', '', texto)
    texto = re.sub(r'^\|[-| ]+\|$', '', texto, flags=re.MULTILINE)
    texto = re.sub(r'\n{3,}', '\n\n', texto)
    return texto.strip()

def _chunk_valido(texto: str, min_chars: int = 100) -> bool:
    sem_markdown = re.sub(r'[#\|\-\s]', '', texto)
    return len(sem_markdown) >= min_chars

def diagnosticar(chunk_size=800, chunk_overlap=100):
    header_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=[("#", "t"), ("##", "s"), ("###", "ss")],
        strip_headers=False
    )
    char_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    chunks = []
    ignorados = 0

    for md_path in PROCESSED_DIR.glob("*.md"):
        text = md_path.read_text(encoding="utf-8")
        for chunk in header_splitter.split_text(text):
            limpo = _limpar_chunk(chunk.page_content)
            if not _chunk_valido(limpo):
                ignorados += 1
                continue
            for sub in char_splitter.split_text(limpo):
                sub_limpo = _limpar_chunk(sub)
                if _chunk_valido(sub_limpo):
                    chunks.append({"text": sub_limpo})
                else:
                    ignorados += 1

    tamanhos = [len(c["text"]) for c in chunks]
    print(f"\n{'='*40}")
    print(f"chunk_size={chunk_size} | overlap={chunk_overlap}")
    print(f"{'='*40}")
    print(f"Total de chunks : {len(chunks)}")
    print(f"Ignorados        : {ignorados}")
    print(f"Tamanho médio    : {sum(tamanhos)//len(tamanhos)} chars")
    print(f"Menor chunk      : {min(tamanhos)} chars")
    print(f"Maior chunk      : {max(tamanhos)} chars")
    print(f"Chunks < 100     : {len([t for t in tamanhos if t < 100])}")

    print("\n--- 3 exemplos de chunks bons ---")
    bons = [c for c in chunks if 400 < len(c["text"]) < 600]
    for c in bons[:3]:
        print(f"\n{c['text'][:200]}...")

if __name__ == "__main__":
    # Testa diferentes configurações sem mexer no banco
    diagnosticar(chunk_size=500, chunk_overlap=50)   # configuração atual
    diagnosticar(chunk_size=800, chunk_overlap=100)  # configuração nova
    diagnosticar(chunk_size=1000, chunk_overlap=150) # configuração maior