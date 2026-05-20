import os

from dotenv import load_dotenv
from openai import APIConnectionError, APITimeoutError, OpenAI, OpenAIError


load_dotenv()

API_KEY = os.getenv("JARVIS_LLM_API_KEY")

if not API_KEY:
    raise RuntimeError("JARVIS_LLM_API_KEY nao configurada. Defina a chave no arquivo .env.")

client = OpenAI(
    base_url=os.getenv("JARVIS_LLM_BASE_URL"),
    api_key=API_KEY,
    timeout=float(os.getenv("JARVIS_LLM_TIMEOUT", "30")),
    max_retries=0
)

MODEL = os.getenv("JARVIS_LLM_MODEL", "google/gemma-3-12b-it")


def chamar_llm(mensagens):
    try:
        resposta = client.chat.completions.create(
            model=MODEL,
            messages=mensagens,
            max_tokens=300
        )
    except (APIConnectionError, APITimeoutError):
        return (
            "Não consegui conectar ao servidor da IA agora. "
            "Verifique sua internet, DNS ou se o endpoint da LLM está acessível."
        )
    except OpenAIError as erro:
        return f"A chamada para a IA falhou: {erro}"

    conteudo = resposta.choices[0].message.content or ""
    return conteudo.strip() or "A IA retornou uma resposta vazia."
