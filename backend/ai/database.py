import sqlite3
import os
from pathlib import Path

PATH_BANCO = Path(os.getenv("DB_PATH", Path(__file__).resolve().parent.parent.parent / "data" / "jarvis.db"))

SCHEMA_COMPLEMENTAR = """
CREATE TABLE IF NOT EXISTS tool_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    tool_name TEXT NOT NULL,
    input TEXT,
    output TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessoes_estudo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    tema TEXT,
    objetivo TEXT,
    data_inicio DATE,
    data_fim DATE,
    plano TEXT,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS respostas_estudo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessao_id INTEGER,
    pergunta TEXT,
    resposta_usuario TEXT,
    avaliacao TEXT,
    feedback TEXT,
    data_resposta DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sessao_id) REFERENCES sessoes_estudo(id)
);
"""

def conectar():
    PATH_BANCO.parent.mkdir(parents=True, exist_ok=True)
    conexao = sqlite3.connect(PATH_BANCO)
    conexao.row_factory = sqlite3.Row
    conexao.executescript(SCHEMA_COMPLEMENTAR)
    conexao.commit()
    return conexao

def executar_select(query: str, params: tuple = ()):
    conexao = conectar()
    cursor = conexao.cursor()
    cursor.execute(query, params)
    resultados = [dict(linha) for linha in cursor.fetchall()]
    conexao.close()
    return resultados

def executar_insert(query: str, params: tuple = ()):
    conexao = conectar()
    cursor = conexao.cursor()
    cursor.execute(query, params)
    conexao.commit()
    ultimo_id = cursor.lastrowid
    conexao.close()
    return ultimo_id

def executar_update_delete(query: str, params: tuple = ()):
    conexao = conectar()
    cursor = conexao.cursor()
    cursor.execute(query, params)
    conexao.commit()
    linhas_afetadas = cursor.rowcount
    conexao.close()
    return linhas_afetadas
