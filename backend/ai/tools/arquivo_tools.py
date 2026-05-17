from backend.ai.database import executar_select, executar_insert, executar_update_delete

def registrar_arquivo(user_id: int, nome: str, caminho: str):
    if not user_id or not nome or not caminho:
        return {
            "error": True,
            "message": "user_id, nome e caminho são obrigatórios."
        }

    arquivo_id = executar_insert(
        """
        INSERT INTO arquivos 
        (user_id, nome, caminho) 
        VALUES (?, ?, ?)
        """,
        (user_id, nome, caminho)
    )
    arquivo = executar_select(
        """
        SELECT * 
        FROM arquivos 
        WHERE id = ?
        """,
        (arquivo_id,)
    )

    return {
        "error": False,
        "message": "Arquivo registrado com sucesso.",
        "dados": arquivo[0] if arquivo else None
    }

def listar_arquivos(user_id: int):
    if not user_id:
        return {
            "error": True,
            "message": "user_id é obrigatório."
        }

    arquivos = executar_select(
        """
        SELECT * 
        FROM arquivos_pdf 
        WHERE user_id = ?
        ORDER BY criado_em DESC
        """,
        (user_id,)
    )

    return {
        "error": False,
        "message": f"{len(arquivos)} arquivo(s) encontrado(s).",
        "dados": arquivos
    }

def deletar_arquivo(arquivo_id: int):
    if not arquivo_id:
        return {
            "error": True,
            "message": "arquivo_id é obrigatório."
        }

    linhas_afetadas = executar_update_delete(
        """
        DELETE FROM arquivos 
        WHERE id = ?
        """,
        (arquivo_id,)
    )

    if linhas_afetadas > 0:
        return {
            "error": False,
            "message": "Arquivo deletado com sucesso."
        }
    else:
        return {
            "error": True,
            "message": "Nenhum arquivo encontrado para deletar."
        }