import json
import logging
import os
import sqlite3
from datetime import datetime
from pathlib import Path

LOG_DIR = Path(os.getenv("JARVIS_LOG_DIR") or Path(__file__).parent.parent.parent / "logs")
LOG_DIR.mkdir(exist_ok=True)
DB_PATH = Path(os.getenv("DB_PATH", Path(__file__).resolve().parent.parent.parent / "data" / "jarvis.db"))

# Log em formato legível
logging.basicConfig(
    filename=LOG_DIR / "jarvis.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)


def data_formatada():
    return datetime.now().isoformat(timespec="seconds")


def _append_jsonl(nome_arquivo: str, entrada: dict):
    with open(LOG_DIR / nome_arquivo, "a", encoding="utf-8") as arquivo:
        arquivo.write(json.dumps(entrada, ensure_ascii=False, default=str) + "\n")


def _registrar_tool_no_banco(ferramenta: str, argumentos: dict, resultado: dict, user_id: int = None):
    try:
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(DB_PATH) as conexao:
            conexao.execute(
                """
                CREATE TABLE IF NOT EXISTS tool_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    tool_name TEXT NOT NULL,
                    input TEXT,
                    output TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conexao.execute(
                """
                INSERT INTO tool_logs (user_id, tool_name, input, output)
                VALUES (?, ?, ?, ?)
                """,
                (
                    user_id,
                    ferramenta,
                    json.dumps(argumentos, ensure_ascii=False, default=str),
                    json.dumps(resultado, ensure_ascii=False, default=str),
                )
            )
    except Exception as erro:
        logging.warning("[TOOL_LOG_DB] falha ao registrar no banco: %s", erro)


def registrar_chamada_tool(
    ferramenta: str,
    argumentos: dict,
    resultado: dict,
    user_id: int = None
):
    """Registra uma chamada de tool nos logs."""
    entrada = {
        "data_hora": data_formatada(),
        "user_id": user_id,
        "ferramenta": ferramenta,
        "entrada": argumentos,
        "saida": resultado,
        "sucesso": not bool(resultado.get("erro", False))
    }

    _append_jsonl("tools.jsonl", entrada)
    _registrar_tool_no_banco(ferramenta, argumentos, resultado, user_id=user_id)

    # Log legível para debug
    status = "OK" if entrada["sucesso"] else "ERRO"
    logging.info(f"[{status}] ferramenta={ferramenta} user_id={user_id} entrada={argumentos}")


def registrar_rag(
    pergunta: str,
    documentos_recuperados: list,
    chunks_usados: list,
    resposta_gerada: str = "",
    score_relevancia=None
):
    """Registra uso do RAG nos logs."""
    entrada = {
        "data_hora": data_formatada(),
        "pergunta": pergunta,
        "documentos_recuperados": documentos_recuperados,
        "chunks_usados": chunks_usados,
        "resposta_gerada": resposta_gerada,
        "score_relevancia": score_relevancia
    }

    _append_jsonl("rag.jsonl", entrada)
    logging.info(
        "[RAG] pergunta=%r documentos=%s chunks=%s score=%s",
        pergunta,
        len(documentos_recuperados or []),
        len(chunks_usados or []),
        score_relevancia,
    )


def registrar_agenda(acao: str, entrada, saida):
    entrada_log = {
        "data_hora": data_formatada(),
        "acao": acao,
        "entrada": entrada,
        "saida": saida,
    }

    _append_jsonl("agenda.jsonl", entrada_log)
    logging.info("[AGENDA] acao=%s entrada=%s", acao, entrada)


def registrar_tarefa(acao: str, tarefa, status: str, sucesso: bool):
    entrada_log = {
        "data_hora": data_formatada(),
        "acao": acao,
        "tarefa": tarefa,
        "status": status,
        "sucesso": bool(sucesso),
    }

    _append_jsonl("tarefas.jsonl", entrada_log)
    logging.info("[TAREFA] acao=%s status=%s sucesso=%s", acao, status, sucesso)


def registrar_erro(tipo_erro: str, mensagem: str, pergunta_usuario: str = "", possivel_causa: str = ""):
    entrada_log = {
        "data_hora": data_formatada(),
        "tipo_erro": tipo_erro,
        "mensagem": mensagem,
        "pergunta_usuario": pergunta_usuario,
        "possivel_causa": possivel_causa,
    }

    _append_jsonl("erros.jsonl", entrada_log)
    logging.error("[ERRO] tipo=%s mensagem=%s", tipo_erro, mensagem)
