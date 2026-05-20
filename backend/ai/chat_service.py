import json
import os
from datetime import datetime
from zoneinfo import ZoneInfo

from backend.ai.llm_client import chamar_llm
from backend.ai.logger import registrar_agenda, registrar_erro, registrar_rag, registrar_tarefa
from backend.ai.tool_router import interpretar_resposta_llm, executar_tool
from backend.ai.prompts.system_prompt import SYSTEM_PROMPT


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
    if nome_tool not in {"criar_lembrete", "listar_lembretes", "excluir_lembrete"}:
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


def gerar_resposta_final(mensagens, resultado_tool):
    mensagens_com_resultado = mensagens + [
        {
            "role": "system",
            "content": (
                "A ferramenta foi executada. "
                "Use o resultado abaixo para responder ao usuário de forma natural. "
                "Não responda em JSON."
            )
        },
        {
            "role": "user",
            "content": "Resultado da ferramenta: "
            + json.dumps(resultado_tool, ensure_ascii=False)
        }
    ]

    resposta_texto = chamar_llm(mensagens_com_resultado)
    resposta_json = interpretar_resposta_llm(resposta_texto)

    return resposta_json.get("resposta", resposta_texto)


def processar_mensagem_usuario(texto_usuario: str, user_id: int = 1):
    mensagens = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        },
        {
            "role": "user",
            "content": f"{contexto_data_hora_atual()}\nuser_id={user_id}\nMensagem do usuário: {texto_usuario}"
        }
    ]

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

        resposta_final = gerar_resposta_final(mensagens, resultado_tool)
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
        "resposta": resposta_json.get("resposta", resposta_texto)
    }
