import random
from backend.ai.database import executar_insert

try:
    from rag.retriever import search
except ModuleNotFoundError as erro:
    search = None
    RAG_IMPORT_ERROR = erro
else:
    RAG_IMPORT_ERROR = None

def gerar_exercicios(query: str, quantidade: int = 3) -> dict:
    """
    Busca material relevante e retorna contexto para a LLM gerar exercícios.
    A LLM usa esse contexto para formular questões para o aluno responder.
    """
    if not query:
        return {
            "error": True,
            "message": "query é obrigatória."
        }

    if search is None:
        return {
            "error": True,
            "message": f"RAG indisponível: dependência ausente ({RAG_IMPORT_ERROR})."
        }
        
    chunks = search(query, n_results=5)
    
    if not chunks:
        return {
            "error": True,
            "message": "Nenhum material encontrado para o tema informado."
        }
        
    contexto = "\n\n".join([c["text"] for c in chunks])
    fontes = list({c["source"] for c in chunks})
    
    return {
        "error": False,
        "message": f"Material encontrado. Gere {quantidade} exercício(s) baseado(s) no contexto.",
        "dados": {
            "query": query,
            "quantidade": quantidade,
            "contexto": contexto,
            "fontes": fontes,
            "instrucao_llm": (
                f"Com base no contexto fornecido, gere {quantidade} questões de múltipla escolha "
                f"sobre '{query}' para o aluno responder agora. Para cada questão inclua enunciado "
                f"e 4 alternativas (A, B, C, D). Não mostre o gabarito nem a explicação ainda. "
                f"Peça para o aluno responder com a letra da alternativa. Responda em português."
            )
        }
    }
    
def iniciar_active_recall(tema: str) -> dict:
    """
    Busca um trecho aleatório sobre o tema e retorna contexto
    para a LLM formular uma pergunta interativa ao usuário.
    """
    if not tema:
        return {
            "error": True,
            "message": "tema é obrigatório."
        }

    if search is None:
        return {
            "error": True,
            "message": f"RAG indisponível: dependência ausente ({RAG_IMPORT_ERROR})."
        }

    chunks = search(tema, n_results=5)

    if not chunks:
        return {
            "error": True,
            "message": "Nenhum material encontrado para o tema informado."
        }

    # Escolhe um chunk aleatório para variar as perguntas
    chunk_escolhido = random.choice(chunks)

    return {
        "error": False,
        "message": "Contexto encontrado. Formule uma pergunta para o usuário.",
        "dados": {
            "tema": tema,
            "contexto": chunk_escolhido["text"],
            "fonte": chunk_escolhido["source"],
            "instrucao_llm": (
                "Com base no trecho fornecido, faça UMA pergunta clara e objetiva ao usuário "
                "para testar se ele entende o conceito. Não entregue a resposta ainda. "
                "Aguarde a resposta do usuário para avaliar. Responda em português."
            )
        }
    }

def avaliar_resposta_active_recall(
    pergunta: str,
    resposta_usuario: str,
    contexto_original: str,
    sessao_id: int | None = None,
    avaliacao: str | None = None,
    feedback: str | None = None,
) -> dict:
    """
    Recebe a resposta do usuário e retorna contexto para a LLM avaliar.
    """
    if not pergunta or not resposta_usuario or not contexto_original:
        return {
            "error": True,
            "message": "pergunta, resposta_usuario e contexto_original são obrigatórios."
        }

    resposta_id = None
    if sessao_id:
        resposta_id = executar_insert(
            """
            INSERT INTO respostas_estudo (sessao_id, pergunta, resposta_usuario, avaliacao, feedback)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                sessao_id,
                pergunta,
                resposta_usuario,
                avaliacao or "pendente_avaliacao_llm",
                feedback or "",
            )
        )

    return {
        "error": False,
        "message": "Avalie a resposta do usuário com base no contexto.",
        "dados": {
            "resposta_id": resposta_id,
            "pergunta": pergunta,
            "resposta_usuario": resposta_usuario,
            "contexto_original": contexto_original,
            "instrucao_llm": (
                f"O usuário respondeu '{resposta_usuario}' para a pergunta '{pergunta}'. "
                f"Com base no contexto original, avalie se a resposta está: "
                f"correta, parcialmente correta ou incorreta. "
                f"Explique o que acertou, o que errou e mostre a resposta completa. "
                f"Seja encorajador e educado. Responda em português."
            )
        }
    }
