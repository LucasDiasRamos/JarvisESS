from backend.ai.llm_client import chamar_llm


print("Enviando mensagem para a LLM...")

try:
    resposta = chamar_llm([
        {
            "role": "user",
            "content": "Responda apenas: teste ok"
        }
    ])

    print("Resposta da LLM:")
    print(repr(resposta))

except Exception as erro:
    print("Erro ao chamar a LLM:")
    print(type(erro).__name__)
    print(erro)



