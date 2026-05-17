import chromadb
from sentence_transformers import SentenceTransformer
from pathlib import Path
from rag.chunker import load_chunks

CHROMA_DIR = str(Path(__file__).parent.parent / "data" / "chroma_db")

# Modelo multiligue
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

def get_collection():
    """Retorna a coleção do ChromaDB"""
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    return client.get_or_create_collection(name="jarvis_rag")

def index_documents():
    """Processa os chunks e armazena no ChromaDB."""
    model = SentenceTransformer(MODEL_NAME)
    collection = get_collection()
    
    # Evita reindexar se já tem documentos
    if collection.count() > 0:
        print(f"[EMBEDDER] Coleção já tem {collection.count()} chunks.")
        return 
        
    chunks = load_chunks()
    
    texts = [c["text"] for c in chunks]
    ids = [c["chunk_id"] for c in chunks]
    metadatas = [{"source": c["source"]} for c in chunks]
    
    print(f"[EMBEDDER] Gerando embeddings para {len(texts)} chunks...")
    embeddings = model.encode(texts, show_progress_bar=True).tolist()
    
    collection.add(
        documents = texts,
        embeddings = embeddings,
        ids = ids,
        metadatas = metadatas
    )
    print(f"[EMBEDDER] {len(chunks)} chunks indexados no ChromaDB.")
    
if __name__ == "__main__":
    index_documents()