import json
import os
from datetime import datetime
from zoneinfo import ZoneInfo

from backend.ai.llm_client import chamar_llm
from backend.ai.logger import registrar_agenda, registrar_erro, registrar_rag, registrar_tarefa
from backend.ai.tool_router import interpretar_resposta_llm, executar_tool
from backend.ai.prompts.system_prompt import SYSTEM_PROMPT
from backend.ai.database import executar_select


def contexto_data_hora_atual():
    timezone = os.getenv("JARVIS_TIMEZONE", "America/Cuiaba")
    agora = datetime.now(ZoneInfo(timezone))
    return (
        f"Data/hora atual: {agora.strftime('%Y-%m-%d %H:%M:%S')} "
        f"({timezone}). Use esta data para interpretar termos como hoje, amanha, sexta, semana que vem."
    )


def _resumir_chunks_rag(chunks):
    resumo = []
    for indice, chunk in enumerate(chunks or [], start=1):
        texto = str(chunk.get("text", ""))
        resumo.append({
            "ordem": indice,
            "documento": chunk.get("source"),
            "texto": texto[:500],
            "score_relevancia": chunk.get("score_relevancia"),
        })
    return resumo


def _score_medio_rag(chunks):
    scores = [
        float(chunk["score_relevancia"])
        for chunk in chunks or []
        if chunk.get("score_relevancia") is not None
    ]
    if not scores:
        return None
    return round(sum(scores) / len(scores), 4)


def _registrar_rag_se_aplicavel(nome_tool, argumentos, resultado_tool, resposta_final):
    if nome_tool != "buscar_material_rag":
        return

    dados = (
        resultado_tool.get("resultado", {})
        .get("dados", {})
        if isinstance(resultado_tool, dict)
        else {}
    )
    chunks = dados.get("chunks", [])
    documentos = dados.get("fontes", [])

    registrar_rag(
        pergunta=argumentos.get("query", ""),
        documentos_recuperados=documentos,
        chunks_usados=_resumir_chunks_rag(chunks),
        resposta_gerada=resposta_final,
        score_relevancia=_score_medio_rag(chunks),
    )


def _resultado_sucesso(resultado_tool):
    if not isinstance(resultado_tool, dict):
        return False
    if resultado_tool.get("erro"):
        return False
    resultado = resultado_tool.get("resultado")
    if isinstance(resultado, dict) and resultado.get("error"):
        return False
    return True


def _registrar_agenda_se_aplicavel(nome_tool, argumentos, resultado_tool):
    if nome_tool not in {"criar_lembrete", "listar_lembretes", "alterar_lembrete", "excluir_lembrete"}:
        return

    resultado = resultado_tool.get("resultado", {}) if isinstance(resultado_tool, dict) else {}
    registrar_agenda(
        acao=nome_tool,
        entrada={
            "periodo": argumentos.get("data_hora") or argumentos.get("periodo"),
            "user_id": argumentos.get("user_id"),
            "lembrete_id": argumentos.get("lembrete_id") or argumentos.get("id"),
        },
        saida=resultado.get("dados") if isinstance(resultado, dict) else resultado,
    )


def _registrar_tarefa_se_aplicavel(nome_tool, argumentos, resultado_tool):
    if nome_tool not in {"criar_tarefa", "listar_tarefas", "concluir_tarefa", "excluir_tarefa"}:
        return

    resultado = resultado_tool.get("resultado", {}) if isinstance(resultado_tool, dict) else {}
    sucesso = _resultado_sucesso(resultado_tool)
    mensagem = resultado.get("message") if isinstance(resultado, dict) else ""
    tarefa = argumentos.get("titulo") or argumentos.get("tarefa_id") or argumentos.get("id")
    if tarefa is None and isinstance(resultado, dict):
        tarefa = resultado.get("dados")
    if tarefa is None:
        tarefa = argumentos

    registrar_tarefa(
        acao=nome_tool,
        tarefa=tarefa,
        status=mensagem or ("sucesso" if sucesso else "erro"),
        sucesso=sucesso,
    )


def _registrar_erro_se_aplicavel(texto_usuario, tipo_erro, mensagem, possivel_causa):
    registrar_erro(
        tipo_erro=tipo_erro,
        mensagem=mensagem,
        pergunta_usuario=texto_usuario,
        possivel_causa=possivel_causa,
    )


def _registrar_falha_llm_se_aplicavel(texto_usuario, resposta_texto):
    mensagens_erro = [
        "Não consegui conectar ao servidor da IA",
        "A chamada para a IA falhou",
        "A IA não está configurada",
    ]
    if any(mensagem in resposta_texto for mensagem in mensagens_erro):
        _registrar_erro_se_aplicavel(
            texto_usuario,
            "llm",
            resposta_texto,
            "configuracao ausente, endpoint indisponivel, timeout ou falha de rede",
        )


def _pedido_para_gerar_exercicio(texto_usuario: str) -> bool:
    texto = texto_usuario.lower()
    termos_exercicio = (
        "exercicio",
        "exercício",
        "questao",
        "questão",
        "quiz",
        "simulado",
        "pratica",
        "prática",
        "me teste",
    )
    termos_tarefa_explicita = (
        "crie uma tarefa",
        "criar uma tarefa",
        "adicione uma tarefa",
        "adicionar uma tarefa",
        "nova tarefa",
        "to-do",
        "pendencia",
        "pendência",
    )

    return any(termo in texto for termo in termos_exercicio) and not any(
        termo in texto for termo in termos_tarefa_explicita
    )


def _corrigir_tool_exercicio(texto_usuario, nome_tool, argumentos):
    if nome_tool not in {"criar_tarefa", "concluir_tarefa", "excluir_tarefa"}:
        return nome_tool, argumentos

    if not _pedido_para_gerar_exercicio(texto_usuario):
        return nome_tool, argumentos

    query = (
        argumentos.get("query")
        or argumentos.get("titulo")
        or argumentos.get("descricao")
        or texto_usuario
    )

    return "gerar_exercicios", {
        "query": query,
        "quantidade": argumentos.get("quantidade", 1),
        "user_id": argumentos.get("user_id"),
    }


def _carregar_historico_conversa(conversation_id: int | None, texto_atual: str, limite: int = 12):
    if not conversation_id:
        return []

    mensagens = executar_select(
        """
        SELECT remetente, conteudo
        FROM mensagens
        WHERE conversa_id = ?
        ORDER BY criado_em DESC, id DESC
        LIMIT ?
        """,
        (conversation_id, limite)
    )
    historico = list(reversed(mensagens))

    if historico:
        ultima = historico[-1]
        if ultima.get("remetente") == "usuario" and str(ultima.get("conteudo", "")).strip() == texto_atual.strip():
            historico = historico[:-1]

    mensagens_llm = []
    for mensagem in historico:
        conteudo = str(mensagem.get("conteudo", "")).strip()
        if not conteudo:
            continue

        mensagens_llm.append({
            "role": "assistant" if mensagem.get("remetente") == "jarvis" else "user",
            "content": conteudo,
        })

    return mensagens_llm


def _normalizar_alternancia(mensagens):
    normalizadas = []

    for mensagem in mensagens:
        role = mensagem.get("role")
        content = str(mensagem.get("content", "")).strip()

        if role not in {"system", "user", "assistant"} or not content:
            continue

        if role == "system":
            if not normalizadas:
                normalizadas.append({"role": role, "content": content})
            else:
                normalizadas[0]["content"] = f"{normalizadas[0]['content']}\n\n{content}"
            continue

        if normalizadas and normalizadas[-1]["role"] == role:
            normalizadas[-1]["content"] = f"{normalizadas[-1]['content']}\n\n{content}"
        else:
            normalizadas.append({"role": role, "content": content})

    return normalizadas


def _preparar_mensagens(system_prompt, historico, texto_usuario):
    mensagens = [{"role": "system", "content": system_prompt}]
    mensagens.extend(historico)

    if mensagens and mensagens[-1]["role"] == "user":
        mensagens = mensagens[:-1]

    mensagens.append({"role": "user", "content": texto_usuario})
    normalizadas = _normalizar_alternancia(mensagens)

    while len(normalizadas) > 1 and normalizadas[1]["role"] != "user":
        normalizadas.pop(1)

    return normalizadas


def _extrair_resposta_natural(resposta_texto):
    resposta_json = interpretar_resposta_llm(resposta_texto)

    if isinstance(resposta_json, dict) and resposta_json.get("resposta"):
        return str(resposta_json["resposta"])

    if isinstance(resposta_json, dict) and resposta_json.get("usar_tool") is True:
        return "Pronto. A ação foi executada."

    return resposta_texto


def gerar_resposta_final(historico, texto_usuario, resultado_tool):
    system_prompt = (
        "Você é o Jarvis, um assistente acadêmico. "
        "Responda ao usuário de forma natural, em português. "
        "Nunca responda em JSON, nunca mostre estruturas internas de tool calling "
        "e nunca mencione chaves como usar_tool, tool ou argumentos."
    )
    mensagem_usuario = (
        f"Mensagem original do usuário: {texto_usuario}\n\n"
        "Resultado interno da ferramenta:\n"
        f"{json.dumps(resultado_tool, ensure_ascii=False)}\n\n"
        "Use esse resultado para responder naturalmente ao usuário."
    )
    mensagens_com_resultado = _preparar_mensagens(
        system_prompt,
        historico,
        mensagem_usuario
    )

    resposta_texto = chamar_llm(mensagens_com_resultado)
    return _extrair_resposta_natural(resposta_texto)


def _system_prompt_tool_calling():
    return (
        SYSTEM_PROMPT
        + "\n\nImportante: o JSON acima é apenas um protocolo interno para escolher tools. "
        "A resposta final exibida ao usuário nunca deve ser JSON."
    )


def _mensagem_usuario_atual(texto_usuario, user_id):
    return (
        f"{contexto_data_hora_atual()}\n"
        f"user_id={user_id}\n"
        f"Mensagem do usuário: {texto_usuario}"
    )


def _responder_sem_json(historico, texto_usuario, user_id):
    mensagens = _preparar_mensagens(
        (
            "Você é o Jarvis, um assistente acadêmico. "
            "Responda sempre de forma natural, em português. "
            "Nunca responda em JSON."
        ),
        historico,
        _mensagem_usuario_atual(texto_usuario, user_id)
    )
    resposta_texto = chamar_llm(mensagens)
    return _extrair_resposta_natural(resposta_texto)


def _fallback_resposta_final(resultado_tool):
    resultado = resultado_tool.get("resultado", {}) if isinstance(resultado_tool, dict) else {}
    if isinstance(resultado, dict):
        return resultado.get("message") or resultado.get("mensagem") or "Pronto."
    return "Pronto."


def _gerar_resposta_final_segura(historico, texto_usuario, resultado_tool):
    resposta = gerar_resposta_final(historico, texto_usuario, resultado_tool)

    if "A chamada para a IA falhou" in resposta:
        return _fallback_resposta_final(resultado_tool)

    return resposta


def _mensagens_tool_calling(historico, texto_usuario, user_id):
    return _preparar_mensagens(
        _system_prompt_tool_calling(),
        historico,
        _mensagem_usuario_atual(texto_usuario, user_id)
    )


def processar_mensagem_usuario(texto_usuario: str, user_id: int = 1, conversation_id: int | None = None):
    historico = _carregar_historico_conversa(conversation_id, texto_usuario)
    mensagens = _mensagens_tool_calling(historico, texto_usuario, user_id)

    resposta_texto = chamar_llm(mensagens)
    _registrar_falha_llm_se_aplicavel(texto_usuario, resposta_texto)

    if os.getenv("JARVIS_DEBUG_LLM") == "1":
        print("\n[DEBUG] Resposta bruta da LLM:")
        print(resposta_texto)

    resposta_json = interpretar_resposta_llm(resposta_texto)

    if resposta_json.get("usar_tool") is True:
        nome_tool = resposta_json.get("tool")
        argumentos = resposta_json.get("argumentos", {})

        if "user_id" not in argumentos:
            argumentos["user_id"] = user_id

        nome_tool, argumentos = _corrigir_tool_exercicio(texto_usuario, nome_tool, argumentos)

        resultado_tool = executar_tool(nome_tool, argumentos)
        _registrar_agenda_se_aplicavel(nome_tool, argumentos, resultado_tool)
        _registrar_tarefa_se_aplicavel(nome_tool, argumentos, resultado_tool)

        if isinstance(resultado_tool, dict) and resultado_tool.get("erro"):
            _registrar_erro_se_aplicavel(
                texto_usuario,
                "tool_calling",
                resultado_tool.get("mensagem", "Falha ao executar ferramenta."),
                "tool inexistente, argumentos invalidos ou excecao durante execucao",
            )

        resposta_final = _gerar_resposta_final_segura(historico, texto_usuario, resultado_tool)
        _registrar_rag_se_aplicavel(nome_tool, argumentos, resultado_tool, resposta_final)

        return {
            "tipo": "tool",
            "tool": nome_tool,
            "argumentos": argumentos,
            "resultado_tool": resultado_tool,
            "resposta": resposta_final
        }

    return {
        "tipo": "resposta",
        "resposta": _extrair_resposta_natural(resposta_texto)
    }
