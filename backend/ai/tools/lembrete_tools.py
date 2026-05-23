from datetime import datetime, timedelta
import os
from zoneinfo import ZoneInfo

from backend.ai.database import executar_select, executar_insert, executar_update_delete


def _hoje():
    timezone = os.getenv("JARVIS_TIMEZONE", "America/Cuiaba")
    return datetime.now(ZoneInfo(timezone)).date()


def _intervalo_periodo(periodo: str | None):
    if not periodo:
        return None, None

    periodo_normalizado = periodo.strip().lower()
    hoje = _hoje()

    if periodo_normalizado in {"hoje", "today"}:
        return hoje.isoformat(), hoje.isoformat()

    if periodo_normalizado in {"amanha", "amanhã", "tomorrow"}:
        amanha = hoje + timedelta(days=1)
        return amanha.isoformat(), amanha.isoformat()

    if periodo_normalizado in {"semana", "esta_semana", "essa_semana", "semana_atual", "this_week"}:
        inicio = hoje - timedelta(days=hoje.weekday())
        fim = inicio + timedelta(days=6)
        return inicio.isoformat(), fim.isoformat()

    if periodo_normalizado in {"proximos_7_dias", "próximos_7_dias", "7_dias"}:
        return hoje.isoformat(), (hoje + timedelta(days=7)).isoformat()

    return None, None


def _formatar_lembrete(lembrete: dict):
    data_hora = lembrete.get("data_hora")
    if not data_hora:
        return lembrete

    try:
        parsed = datetime.fromisoformat(str(data_hora).replace(" ", "T"))
    except ValueError:
        return lembrete

    dias = [
        "segunda-feira",
        "terça-feira",
        "quarta-feira",
        "quinta-feira",
        "sexta-feira",
        "sábado",
        "domingo",
    ]
    return {
        **lembrete,
        "data": parsed.date().isoformat(),
        "hora": parsed.strftime("%H:%M"),
        "dia_semana": dias[parsed.weekday()],
    }

def criar_lembrete(
        user_id: int,
        titulo: str,
        descricao: str,
        data_hora: str
):
    if not user_id or not titulo or not data_hora:
        return {
            "error": True,
            "message": "user_id, titulo e data_hora são obrigatórios."
        }

    lembrete_id = executar_insert(
        """
        INSERT INTO lembretes 
        (user_id, titulo, descricao, data_hora, origem) 
        VALUES (?, ?, ?, ?, ?)
        """,
        (user_id, titulo, descricao, data_hora, "jarvis")
    )
    lembrete = executar_select(
        """
        SELECT * 
        FROM lembretes 
        WHERE id = ?
        """,
        (lembrete_id,)
    )

    return {
        "error": False,
        "message": "Lembrete criado com sucesso.",
        "dados": lembrete[0] if lembrete else None
    }

def listar_lembretes(
        user_id: int,
        data_inicio: str | None = None,
        data_fim: str | None = None,
        periodo: str | None = None
):
    if not user_id:
        return {
            "error": True,
            "message": "user_id é obrigatório."
        }

    if periodo and (not data_inicio or not data_fim):
        inicio_periodo, fim_periodo = _intervalo_periodo(periodo)
        data_inicio = data_inicio or inicio_periodo
        data_fim = data_fim or fim_periodo

    params = [user_id]
    filtros = ["user_id = ?"]

    if data_inicio:
        filtros.append("date(data_hora) >= date(?)")
        params.append(data_inicio)

    if data_fim:
        filtros.append("date(data_hora) <= date(?)")
        params.append(data_fim)

    lembretes = executar_select(
        f"""
        SELECT * 
        FROM lembretes 
        WHERE {" AND ".join(filtros)}
        ORDER BY data_hora ASC
        """,
        tuple(params)
    )

    return {
        "error": False,
        "message": f"{len(lembretes)} lembrete(s) encontrado(s).",
        "dados": [_formatar_lembrete(lembrete) for lembrete in lembretes],
        "filtro": {
            "periodo": periodo,
            "data_inicio": data_inicio,
            "data_fim": data_fim
        }
    }

def alterar_lembrete(
        lembrete_id: int,
        user_id: int,
        titulo: str | None = None,
        descricao: str | None = None,
        data_hora: str | None = None,
        tipo: str | None = None
):
    if not lembrete_id or not user_id:
        return {
            "error": True,
            "message": "lembrete_id e user_id são obrigatórios."
        }

    campos = {
        "titulo": titulo,
        "descricao": descricao,
        "data_hora": data_hora,
        "tipo": tipo,
    }
    atualizacoes = {campo: valor for campo, valor in campos.items() if valor is not None}

    if not atualizacoes:
        return {
            "error": True,
            "message": "Informe ao menos um campo para alterar: titulo, descricao, data_hora ou tipo."
        }

    set_clause = ", ".join([f"{campo} = ?" for campo in atualizacoes])
    parametros = list(atualizacoes.values()) + [lembrete_id, user_id]

    linhas_afetadas = executar_update_delete(
        f"""
        UPDATE lembretes
        SET {set_clause}
        WHERE id = ? AND user_id = ?
        """,
        tuple(parametros)
    )

    if linhas_afetadas == 0:
        return {
            "error": True,
            "message": "Lembrete não encontrado ou não pertence ao usuário."
        }

    lembrete = executar_select(
        """
        SELECT *
        FROM lembretes
        WHERE id = ? AND user_id = ?
        """,
        (lembrete_id, user_id)
    )

    return {
        "error": False,
        "message": "Lembrete alterado com sucesso.",
        "dados": _formatar_lembrete(lembrete[0]) if lembrete else None
    }

def excluir_lembrete(lembrete_id: int, user_id: int):
    if not lembrete_id or not user_id:
        return {
            "error": True,
            "message": "lembrete_id e user_id são obrigatórios."
        }

    linhas_afetadas = executar_update_delete(
        """
        DELETE FROM lembretes 
        WHERE id = ? AND user_id = ?
        """,
        (lembrete_id, user_id)
    )

    if linhas_afetadas == 0:
        return {
            "error": True,
            "message": "Lembrete não encontrado ou não pertence ao usuário."
        }

    return {
        "error": False,
        "message": "Lembrete excluído com sucesso."
    }
