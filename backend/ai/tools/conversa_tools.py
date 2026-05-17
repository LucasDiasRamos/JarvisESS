from backend.ai.database import executar_select, executar_insert

def criar_conversa(user_id: int, titulo: str = "Nova Conversa"):
    if not user_id:
        return {
            "error": True,
            "message": "user_id é obrigatório."
        }

    conversa_id = executar_insert(
        """
        INSERT INTO conversas 
        (user_id, titulo) 
        VALUES (?, ?)
        """,
        (user_id, titulo)
    )
    conversa = executar_select(
        """
        SELECT * 
        FROM conversas 
        WHERE id = ?
        """,
        (conversa_id,)
    )

    return {
        "error": False,
        "message": "Conversa criada com sucesso.",
        "dados": conversa[0] if conversa else None
    }

def listar_conversas(user_id: int):
    if not user_id:
        return {
            "error": True,
            "message": "user_id é obrigatório."
        }

    conversas = executar_select(
        """
        SELECT * 
        FROM conversas 
        WHERE user_id = ?
        ORDER BY criado_em DESC
        """,
        (user_id,)
    )

    return {
        "error": False,
        "message": f"{len(conversas)} conversa(s) encontrada(s).",
        "dados": conversas
    }

def salvar_mensagem(conversa_id: int, remetente: str, conteudo: str):
    if not conversa_id or not remetente or not conteudo:
        return {
            "error": True,
            "message": "conversa_id, remetente e conteudo são obrigatórios."
        }

    mensagem_id = executar_insert(
        """
        INSERT INTO mensagens 
        (conversa_id, remetente, conteudo) 
        VALUES (?, ?, ?)
        """,
        (conversa_id, remetente, conteudo)
    )

    mensagem = executar_select(
        """
        SELECT * 
        FROM mensagens 
        WHERE id = ?
        """,
        (mensagem_id,)
    )

    return {
        "error": False,
        "message": "Mensagem salva com sucesso.",
        "dados": mensagem[0] if mensagem else None
    }

def listar_mensagens(conversa_id: int):
    if not conversa_id:
        return {
            "error": True,
            "message": "conversa_id é obrigatório."
        }

    mensagens = executar_select(
        """
        SELECT * 
        FROM mensagens 
        WHERE conversa_id = ?
        ORDER BY criado_em ASC
        """,
        (conversa_id,)
    )

    return {
        "error": False,
        "message": f"{len(mensagens)} mensagem(s) encontrada(s).",
        "dados": mensagens
    }