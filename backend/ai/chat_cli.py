import json
import sys

from backend.ai.chat_service import processar_mensagem_usuario


def main():
    try:
        payload = json.load(sys.stdin)
        texto = str(payload.get("message", "")).strip()
        user_id = int(payload.get("user_id") or 1)

        if not texto:
            resposta = {"erro": True, "resposta": "Mensagem vazia."}
        else:
            resposta = processar_mensagem_usuario(texto, user_id=user_id)

    except Exception as erro:
        resposta = {
            "erro": True,
            "resposta": f"Erro ao processar mensagem no Jarvis: {erro}",
        }

    print("__JARVIS_RESPONSE__" + json.dumps(resposta, ensure_ascii=False))


if __name__ == "__main__":
    main()
