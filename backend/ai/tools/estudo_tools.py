from datetime import datetime, timedelta
import json
import os
from zoneinfo import ZoneInfo

from backend.ai.database import executar_insert, executar_select
from backend.ai.tools.rag_tools import buscar_material_rag


def _hoje():
    timezone = os.getenv("JARVIS_TIMEZONE", "America/Cuiaba")
    return datetime.now(ZoneInfo(timezone)).date()


def _normalizar_data(valor):
    if not valor:
        return None
    texto = str(valor).strip()[:10]
    try:
        return datetime.fromisoformat(texto).date()
    except ValueError:
        return None


def _buscar_tarefas_pendentes(user_id: int):
    return executar_select(
        """
        SELECT id, titulo, descricao, data_limite, origem
        FROM tarefas
        WHERE user_id = ? AND concluida = 0
        ORDER BY
          CASE WHEN data_limite IS NULL THEN 1 ELSE 0 END,
          data_limite ASC,
          criado_em DESC
        LIMIT 12
        """,
        (user_id,)
    )


def _buscar_lembretes(user_id: int, data_inicio: str, data_fim: str):
    return executar_select(
        """
        SELECT id, titulo, descricao, tipo, data_hora, origem
        FROM lembretes
        WHERE user_id = ?
          AND date(data_hora) >= date(?)
          AND date(data_hora) <= date(?)
        ORDER BY data_hora ASC
        LIMIT 20
        """,
        (user_id, data_inicio, data_fim)
    )


def _extrair_topicos_dos_materiais(rag_resultado):
    dados = rag_resultado.get("dados", {}) if isinstance(rag_resultado, dict) else {}
    chunks = dados.get("chunks") or []
    topicos = []

    for chunk in chunks[:5]:
        texto = str(chunk.get("text", "")).replace("\n", " ").strip()
        if texto:
            topicos.append(texto[:220])

    return topicos


def _distribuir_sessoes(tema, tarefas, topicos, inicio, fim):
    dias_disponiveis = max((fim - inicio).days + 1, 1)
    total_sessoes = min(max(dias_disponiveis, 3), 7)
    sessoes = []
    temas_base = []

    for tarefa in tarefas[:4]:
        temas_base.append(tarefa["titulo"])

    for indice, topico in enumerate(topicos[:4], start=1):
        temas_base.append(f"{tema}: ponto {indice}")

    if not temas_base:
        temas_base = [
            f"Revisar conceitos centrais de {tema}",
            f"Resolver exercícios de {tema}",
            f"Fazer revisão ativa de {tema}",
        ]

    for indice in range(total_sessoes):
        data_sessao = inicio + timedelta(days=min(indice, dias_disponiveis - 1))
        foco = temas_base[indice % len(temas_base)]
        sessoes.append({
            "data": data_sessao.isoformat(),
            "foco": foco,
            "atividades": [
                "Revisar o material recuperado e produzir um resumo curto.",
                "Responder pelo menos uma pergunta sem consultar a resposta.",
                "Registrar dúvidas ou pontos fracos para revisão posterior.",
            ],
        })

    return sessoes


def planejar_estudos(
    user_id: int,
    tema: str,
    data_prova: str | None = None,
    data_inicio: str | None = None,
    data_fim: str | None = None,
    objetivo: str | None = None,
    salvar: bool = True,
):
    if not user_id or not tema:
        return {
            "error": True,
            "message": "user_id e tema são obrigatórios."
        }

    hoje = _hoje()
    inicio = _normalizar_data(data_inicio) or hoje
    fim = _normalizar_data(data_fim) or _normalizar_data(data_prova) or (inicio + timedelta(days=6))

    if fim < inicio:
        fim = inicio

    tarefas = _buscar_tarefas_pendentes(user_id)
    lembretes = _buscar_lembretes(user_id, inicio.isoformat(), fim.isoformat())
    materiais = buscar_material_rag(tema, n_results=5)
    topicos = _extrair_topicos_dos_materiais(materiais)
    sessoes = _distribuir_sessoes(tema, tarefas, topicos, inicio, fim)

    plano = {
        "tema": tema,
        "objetivo": objetivo or f"Preparar o estudo de {tema}",
        "periodo": {
            "inicio": inicio.isoformat(),
            "fim": fim.isoformat(),
            "data_prova": _normalizar_data(data_prova).isoformat() if _normalizar_data(data_prova) else None,
        },
        "prioridades": [
            tarefa["titulo"] for tarefa in tarefas[:5]
        ],
        "agenda_considerada": lembretes,
        "fontes": materiais.get("dados", {}).get("fontes", []) if isinstance(materiais, dict) else [],
        "topicos_recuperados": topicos,
        "sessoes": sessoes,
        "recomendacao": (
            "Priorize tarefas com prazo próximo, intercale leitura com active recall "
            "e gere exercícios sobre os tópicos em que houver mais dificuldade."
        ),
    }

    sessao_id = None
    if salvar:
        sessao_id = executar_insert(
            """
            INSERT INTO sessoes_estudo (user_id, tema, objetivo, data_inicio, data_fim, plano)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                tema,
                plano["objetivo"],
                inicio.isoformat(),
                fim.isoformat(),
                json.dumps(plano, ensure_ascii=False, default=str),
            )
        )

    return {
        "error": False,
        "message": "Plano de estudos criado com sucesso.",
        "dados": {
            "sessao_id": sessao_id,
            "plano": plano,
        }
    }


def criar_plano_estudos(**kwargs):
    return planejar_estudos(**kwargs)


def registrar_dificuldade(
    sessao_id: int,
    pergunta: str,
    resposta_usuario: str,
    avaliacao: str = "dificuldade",
    feedback: str | None = None,
):
    if not sessao_id or not pergunta or not resposta_usuario:
        return {
            "error": True,
            "message": "sessao_id, pergunta e resposta_usuario são obrigatórios."
        }

    resposta_id = executar_insert(
        """
        INSERT INTO respostas_estudo (sessao_id, pergunta, resposta_usuario, avaliacao, feedback)
        VALUES (?, ?, ?, ?, ?)
        """,
        (sessao_id, pergunta, resposta_usuario, avaliacao, feedback or "")
    )

    return {
        "error": False,
        "message": "Dificuldade registrada com sucesso.",
        "dados": {"resposta_id": resposta_id}
    }


def recomendar_revisao(user_id: int, tema: str | None = None):
    if not user_id:
        return {
            "error": True,
            "message": "user_id é obrigatório."
        }

    filtro_tema = ""
    params = [user_id]
    if tema:
        filtro_tema = "AND lower(s.tema) LIKE lower(?)"
        params.append(f"%{tema}%")

    dificuldades = executar_select(
        f"""
        SELECT s.tema, r.pergunta, r.avaliacao, r.feedback, r.data_resposta
        FROM respostas_estudo r
        JOIN sessoes_estudo s ON s.id = r.sessao_id
        WHERE s.user_id = ?
          {filtro_tema}
          AND lower(coalesce(r.avaliacao, '')) IN ('dificuldade', 'incorreta', 'parcialmente correta')
        ORDER BY r.data_resposta DESC
        LIMIT 8
        """,
        tuple(params)
    )

    return {
        "error": False,
        "message": f"{len(dificuldades)} ponto(s) de revisão encontrado(s).",
        "dados": {
            "tema": tema,
            "pontos_revisao": dificuldades,
            "sugestao": (
                "Revise os pontos listados, gere novos exercícios sobre eles "
                "e faça uma sessão curta de active recall no dia seguinte."
            )
        }
    }
