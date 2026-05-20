import chromadb
from sentence_transformers import SentenceTransformer
from pathlib import Path

CHROMA_DIR = str(Path(__file__).parent.parent / "data" / "chroma_db")
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

_model = None
_collection = None

def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model

def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        _collection = client.get_collection(name="jarvis_rag")
    return _collection

def search(query: str, n_results: int = 3) -> list[dict]:
    """
    Busca o chunks mais relevantes para query.
    Retorna lista de dicts com 'text', 'source' e score de relevancia.
    """
    model = _get_model()
    collection = _get_collection()
    
    query_embedding = model.encode(query).tolist()
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "metadatas", "distances"]
    )
    
    chunks = []
    distances = results.get("distances", [[]])[0]
    for text, metadata, distance in zip(results["documents"][0], results["metadatas"][0], distances):
        score = max(0.0, 1.0 - float(distance)) if distance is not None else None
        chunks.append({
            "text": text,
            "source": metadata["source"],
            "score_relevancia": score
        })
        
    return chunks

def build_context(query: str, n_results: int = 3, chunks: list[dict] | None = None) -> str:
    """Monta o contexto formatado para passar à LLM."""
    if chunks is None:
        chunks = search(query, n_results)
    
    context = ""
    for i, chunk in enumerate(chunks):
        context += f"[Fonte: {chunk['source']}]\n{chunk['text']}\n\n"
        
    return context
    
