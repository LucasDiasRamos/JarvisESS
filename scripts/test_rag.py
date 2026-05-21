import sys
sys.path.append(".") # encontra o pacote rag/

from rag.embedder import index_documents
from rag.retriever import build_context

# Indexa os documentos do Dataset
index_documents()

# Testa uma busca genérica
query = "What is dead code elimination?"
context = build_context(query)
print(f"\nQuery: {query}")
print(f"\nContexto recuperado:\n{context}")