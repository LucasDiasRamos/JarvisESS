import json 

from backend.ai.database import executar_select, executar_insert, executar_update_delete


def criar_tarefa(
        user_id: int,
        titulo: str,
        descricao: str,
        data_limite: str | None = None
):
    if not user_id or not titulo:
        return {
            "error": True,
            "message": "user_id e titulo são obrigatórios."
        }

    tarefa_id = executar_insert(
        """
        INSERT INTO tarefas 
        (user_id, titulo, descricao, data_limite) 
        VALUES (?, ?, ?, ?)
        """,
        (user_id, titulo, descricao, data_limite)
    )
    tarefa = executar_select(
        """
        SELECT * 
        FROM tarefas 
        WHERE id = ?
        """,
        (tarefa_id,)
    )

    return {
        "error": False,
        "message": "Tarefa criada com sucesso.",
        "dados": tarefa[0] if tarefa else None
    }

def listar_tarefas(user_id: int):
    if not user_id:
        return {
            "error": True,
            "message": "user_id é obrigatório."
        }

    tarefas = executar_select(
        """
        SELECT * 
        FROM tarefas 
        WHERE user_id = ?
        ORDER BY criado_em DESC
        """,
        (user_id,)
    )

    return {
        "error": False,
        "message": f"{len(tarefas)} tarefa(s) encontrada(s).",
        "dados": tarefas
    }

def concluir_tarefa(tarefa_id: int):
    if not tarefa_id:
        return {
            "error": True,
            "message": "tarefa_id é obrigatório."
        }

    linhas_afetadas = executar_update_delete(
        """
        UPDATE tarefas 
        SET concluida = 1 
        WHERE id = ?
        """,
        (tarefa_id,)
    )

    if linhas_afetadas == 0:
        return {
            "error": True,
            "message": "Tarefa não encontrada ou já concluída."
        }

    return {
        "error": False,
        "message": "Tarefa concluída com sucesso."
    }

def excluir_tarefa(tarefa_id: int):
    if not tarefa_id:
        return {
            "error": True,
            "message": "tarefa_id é obrigatório."
        }

    linhas_afetadas = executar_update_delete(
        """
        DELETE FROM tarefas 
        WHERE id = ?
        """,
        (tarefa_id,)
    )

    if linhas_afetadas == 0:
        return {
            "error": True,
            "message": "Tarefa não encontrada."
        }

    return {
        "error": False,
        "message": "Tarefa excluída com sucesso."
    }