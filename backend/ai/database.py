import sqlite3
from pathlib import Path

PATH_BANCO = Path(__file__).resolve().parent.parent / "jarvis.db"

def conectar():
    conexao = sqlite3.connect(PATH_BANCO)
    conexao.row_factory = sqlite3.Row
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