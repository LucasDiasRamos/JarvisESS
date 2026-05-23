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
        (user_id, titulo, descricao, data_limite, origem) 
        VALUES (?, ?, ?, ?, ?)
        """,
        (user_id, titulo, descricao, data_limite, "jarvis")
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

def _buscar_tarefa_pendente_por_texto(user_id: int, texto: str):
    termo = f"%{texto.strip()}%"
    tarefas = executar_select(
        """
        SELECT *
        FROM tarefas
        WHERE user_id = ?
          AND concluida = 0
          AND (
            lower(titulo) LIKE lower(?)
            OR lower(descricao) LIKE lower(?)
          )
        ORDER BY data_limite ASC, criado_em DESC
        LIMIT 5
        """,
        (user_id, termo, termo)
    )
    return tarefas


def concluir_tarefa(
        tarefa_id: int | None = None,
        user_id: int | None = None,
        titulo: str | None = None,
        texto: str | None = None
):
    termo_busca = (titulo or texto or "").strip()

    if not tarefa_id and termo_busca and user_id:
        tarefas = _buscar_tarefa_pendente_por_texto(user_id, termo_busca)

        if len(tarefas) == 1:
            tarefa_id = tarefas[0]["id"]
        elif len(tarefas) > 1:
            return {
                "error": True,
                "message": "Encontrei mais de uma tarefa parecida. Peça para o usuário escolher uma.",
                "dados": tarefas
            }
        else:
            return {
                "error": True,
                "message": "Não encontrei tarefa pendente com esse texto.",
                "busca": termo_busca
            }

    if not tarefa_id:
        return {
            "error": True,
            "message": "tarefa_id é obrigatório, ou informe user_id com titulo/texto da tarefa."
        }

    linhas_afetadas = executar_update_delete(
        """
        UPDATE tarefas 
        SET concluida = 1 
        WHERE id = ? AND concluida = 0
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
        "message": "Tarefa concluída com sucesso.",
        "dados": executar_select(
            """
            SELECT *
            FROM tarefas
            WHERE id = ?
            """,
            (tarefa_id,)
        )[0]
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
