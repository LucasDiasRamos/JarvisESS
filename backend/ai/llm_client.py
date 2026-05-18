from openai import OpenAI


client = OpenAI(
    base_url="https://llm.liaufms.org/v1/gemma-3-12b-it",
    api_key="",
    timeout=30.0,
    max_retries=0
)


def chamar_llm(mensagens):
    resposta = client.chat.completions.create(
        model="google/gemma-3-12b-it",
        messages=mensagens,
        max_tokens=300
    )

    return resposta.choices[0].message.content or ""