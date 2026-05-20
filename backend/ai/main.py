from backend.ai.chat_service import processar_mensagem_usuario


def main():
    print("Jarvis iniciado. Digite 'sair' para encerrar.\n")

    user_id = 1

    while True:
        texto = input("Você: ")

        if texto.lower().strip() in ["sair", "exit", "quit"]:
            print("Jarvis: Até mais!")
            break

        print("Jarvis: pensando...", flush=True)
        resultado = processar_mensagem_usuario(texto, user_id=user_id)

        print("\nJarvis:")
        print(resultado["resposta"])
        print()


if __name__ == "__main__":
    main()
