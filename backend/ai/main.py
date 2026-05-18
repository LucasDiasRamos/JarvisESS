from backend.ai.chat_service import processar_mensagem_usuario
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

def main():
    print("Jarvis iniciado. Digite 'sair' para encerrar.\n")

    user_id = 1

    while True:
        texto = input("Você: ")

        if texto.lower().strip() in ["sair", "exit", "quit"]:
            print("Jarvis: Até mais!")
            break

        resultado = processar_mensagem_usuario(texto, user_id=user_id)

        print("\nJarvis:")
        print(resultado["resposta"])
        print()




if __name__ == "__main__":
    main()