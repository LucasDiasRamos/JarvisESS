from pathlib import Path
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

PROCESSED_DIR = Path(__file__).parent.parent / "data" / "processed"

def load_chunks(chunk_size=500, chunk_overlap=50):
    """Carrega todos os .md e divide em chunks."""
    
    # Splitter principal
    header_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=[
            ("#", "titulo"),
            ("##", "secao"),
            ("###", "subsecao"),
        ],
        strip_headers = False
    )
    
    # Splitter secundário
    char_splitter = RecursiveCharacterTextSplitter(
        chunk_size = chunk_size,
        chunk_overlap = chunk_overlap,
    )
    
    all_chunks = []
    global_i = 0
    md_files = list(PROCESSED_DIR.glob("*.md"))
    print(f"[CHUNKER] {len(md_files)} arquivos encontrados.")
    
    for md_path in md_files:
        text = md_path.read_text(encoding="utf-8")
        
        # Primeiro split por headers
        header_chunks = header_splitter.split_text(text)
        
        # Segundo split por tamanho
        for chunk in header_chunks:
            sub_chunks = char_splitter.split_text(chunk.page_content)
            
            for i, sub in enumerate(sub_chunks):
                all_chunks.append({
                    "text": sub,
                    "source": md_path.stem,
                    "chunk_id": f"chunk_{global_i}",
                })
                global_i += 1
                
    print(f"[CHUNKER] {len(all_chunks)} chunks gerados.")
    return all_chunks