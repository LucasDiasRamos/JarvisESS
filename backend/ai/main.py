from backend.ai.tool_router import executar_tool


def testar_criar_tarefa():
    resultado = executar_tool(
        "criar_tarefa",
        {
            "user_id": 1,
            "titulo": "Estudar tool calling",
            "descricao": "Criar tools em Python usando SQLite",
            "data_limite": "2026-05-20"
        }
    )

    print(resultado)


def testar_listar_tarefas():
    resultado = executar_tool(
        "listar_tarefas",
        {
            "user_id": 1
        }
    )

    print(resultado)


def testar_criar_lembrete():
    resultado = executar_tool(
        "criar_lembrete",
        {
            "user_id": 1,
            "titulo": "Revisar RAG",
            "descricao": "Estudar embeddings e recuperação de documentos",
            "data_hora": "2026-05-20 19:00:00"
        }
    )

    print(resultado)


if __name__ == "__main__":
    testar_criar_tarefa()
    testar_listar_tarefas()
    testar_criar_lembrete()