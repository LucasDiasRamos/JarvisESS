import sys
from pathlib import Path

# Permite importar o módulo RAG
sys.path.append(str(Path(__file__).resolve().parent.parent.parent.parent))

try:
    from rag.retriever import search, build_context
except ModuleNotFoundError as erro:
    search = None
    build_context = None
    RAG_IMPORT_ERROR = erro
else:
    RAG_IMPORT_ERROR = None

def buscar_material_rag(query: str, n_results: int = 3):
    if not query:
        return {
            "error": True,
            "message": "é obrigatória realizar uma query."
        }

    if search is None or build_context is None:
        return {
            "error": True,
            "message": f"RAG indisponível: dependência ausente ({RAG_IMPORT_ERROR}).",
            "dados": {
                "context": "",
                "fontes": [],
                "chunks": []
            }
        }
    
    chunks = search(query, n_results)
    
    if not chunks:
        return {
            "error": False,
            "message": "Nenhum material relevante encontrado.",
            "dados": {
                "context": "",
                "fontes": [],
                "chunks": []
            }
        }
        
    context = build_context(query, n_results, chunks=chunks)
    
    return {
        "error": False,
        "message": f"{len(chunks)} trecho(s) relevante(s) encontrado(s).",
        "dados": {
            "context": context,
            "fontes": list({c["source"] for c in chunks}),
            "chunks": chunks
        }
    }
    
