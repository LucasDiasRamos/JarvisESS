import json

from backend.ai.llm_client import chamar_llm
from backend.ai.tool_router import interpretar_resposta_llm, executar_tool
from backend.ai.prompts.system_prompt import SYSTEM_PROMPT


def gerar_resposta_final(mensagens, resultado_tool):
    mensagens_com_resultado = mensagens + [
        {
            "role": "system",
            "content": (
                "A ferramenta foi executada. "
                "Use o resultado abaixo para responder ao usuário em linguagem natural. "
                "Não responda em JSON."
            )
        },
        {
            "role": "user",
            "content": "Resultado da ferramenta: "
            + json.dumps(resultado_tool, ensure_ascii=False)
        }
    ]

    return chamar_llm(mensagens_com_resultado)


def processar_mensagem_usuario(texto_usuario: str, user_id: int = 1):
    mensagens = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        },
        {
            "role": "user",
            "content": f"user_id={user_id}\nMensagem do usuário: {texto_usuario}"
        }
    ]

    resposta_texto = chamar_llm(mensagens)

    resposta_json = interpretar_resposta_llm(resposta_texto)

    if resposta_json.get("usar_tool") is True:
        nome_tool = resposta_json.get("tool")
        argumentos = resposta_json.get("argumentos", {})

        if "user_id" not in argumentos:
            argumentos["user_id"] = user_id

        resultado_tool = executar_tool(nome_tool, argumentos)

        resposta_final = gerar_resposta_final(mensagens, resultado_tool)

        return {
            "tipo": "tool",
            "tool": nome_tool,
            "argumentos": argumentos,
            "resultado_tool": resultado_tool,
            "resposta": resposta_final
        }

    return {
        "tipo": "resposta",
        "resposta": resposta_json.get("resposta", resposta_texto)
    }