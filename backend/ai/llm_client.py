import os

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    def load_dotenv():
        return False

try:
    from openai import APIConnectionError, APITimeoutError, OpenAI, OpenAIError
except ModuleNotFoundError:
    APIConnectionError = APITimeoutError = OpenAIError = Exception
    OpenAI = None

load_dotenv()

MAX_TOKENS = int(os.getenv("JARVIS_LLM_MAX_TOKENS", "1500"))
client = None


def _get_model():
    return (os.getenv("JARVIS_LLM_MODEL") or "").strip()


def _get_client():
    global client

    if OpenAI is None:
        return None

    api_key = os.getenv("JARVIS_LLM_API_KEY")
    if not api_key:
        return None

    if client is None:
        client = OpenAI(
            base_url=os.getenv("JARVIS_LLM_BASE_URL") or None,
            api_key=api_key,
            timeout=float(os.getenv("JARVIS_LLM_TIMEOUT", "30")),
            max_retries=0
        )

    return client


def chamar_llm(mensagens):
    llm_client = _get_client()
    if llm_client is None:
        return (
            "A IA não está configurada no backend. "
            "Defina JARVIS_LLM_API_KEY no ambiente ou no arquivo .env."
        )

    model = _get_model()
    if not model:
        return (
            "A IA não está configurada no backend. "
            "Defina JARVIS_LLM_MODEL no ambiente ou no arquivo .env."
        )

    try:
        resposta = llm_client.chat.completions.create(
            model=model,
            messages=mensagens,
            max_tokens=MAX_TOKENS
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
