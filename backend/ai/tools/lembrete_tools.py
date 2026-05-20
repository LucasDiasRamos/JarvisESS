from backend.ai.database import executar_select, executar_insert, executar_update_delete

def criar_lembrete(
        user_id: int,
        titulo: str,
        descricao: str,
        data_hora: str
):
    if not user_id or not titulo or not data_hora:
        return {
            "error": True,
            "message": "user_id, titulo e data_hora são obrigatórios."
        }

    lembrete_id = executar_insert(
        """
        INSERT INTO lembretes 
        (user_id, titulo, descricao, data_hora, origem) 
        VALUES (?, ?, ?, ?, ?)
        """,
        (user_id, titulo, descricao, data_hora, "jarvis")
    )
    lembrete = executar_select(
        """
        SELECT * 
        FROM lembretes 
        WHERE id = ?
        """,
        (lembrete_id,)
    )

    return {
        "error": False,
        "message": "Lembrete criado com sucesso.",
        "dados": lembrete[0] if lembrete else None
    }

def listar_lembretes(user_id: int):
    if not user_id:
        return {
            "error": True,
            "message": "user_id é obrigatório."
        }

    lembretes = executar_select(
        """
        SELECT * 
        FROM lembretes 
        WHERE user_id = ?
        ORDER BY data_hora ASC
        """,
        (user_id,)
    )

    return {
        "error": False,
        "message": f"{len(lembretes)} lembrete(s) encontrado(s).",
        "dados": lembretes
    }

def excluir_lembrete(lembrete_id: int, user_id: int):
    if not lembrete_id or not user_id:
        return {
            "error": True,
            "message": "lembrete_id e user_id são obrigatórios."
        }

    linhas_afetadas = executar_update_delete(
        """
        DELETE FROM lembretes 
        WHERE id = ? AND user_id = ?
        """,
        (lembrete_id, user_id)
    )

    if linhas_afetadas == 0:
        return {
            "error": True,
            "message": "Lembrete não encontrado ou não pertence ao usuário."
        }

    return {
        "error": False,
        "message": "Lembrete excluído com sucesso."
    }
