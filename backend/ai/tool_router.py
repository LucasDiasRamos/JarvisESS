import json

from backend.ai.tools.tarefa_tools import (
    criar_tarefa,
    listar_tarefas,
    concluir_tarefa,
    excluir_tarefa
)

from backend.ai.tools.lembrete_tools import (
    criar_lembrete,
    listar_lembretes,
    excluir_lembrete
)

from backend.ai.tools.conversa_tools import (
    criar_conversa,
    listar_conversas,
    salvar_mensagem,
    listar_mensagens
)

from backend.ai.tools.arquivo_tools import (
    registrar_arquivo,
    listar_arquivos,
    deletar_arquivo
)



TOOLS = {
    "criar_tarefa": criar_tarefa,
    "listar_tarefas": listar_tarefas,
    "concluir_tarefa": concluir_tarefa,
    "excluir_tarefa": excluir_tarefa,

    "criar_lembrete": criar_lembrete,
    "listar_lembretes": listar_lembretes,
    "excluir_lembrete": excluir_lembrete,

    "criar_conversa": criar_conversa,
    "listar_conversas": listar_conversas,
    "salvar_mensagem": salvar_mensagem,
    "listar_mensagens": listar_mensagens,

    "registrar_arquivo": registrar_arquivo,
    "listar_arquivos": listar_arquivos,
    "deletar_arquivo": deletar_arquivo
}

def interpretar_resposta_llm(resposta_texto: str) -> dict:
    try:
        return json.loads(resposta_texto)
    except json.JSONDecodeError:
        return {
            "usar_tool": False,
            "resposta": resposta_texto
        }


def executar_tool(nome_tool: str, argumentos: dict | None = None) -> dict:
    if argumentos is None:
        argumentos = {}

    if nome_tool not in TOOLS:
        return {
            "erro": True,
            "mensagem": f"Tool '{nome_tool}' não encontrada."
        }

    try:
        funcao = TOOLS[nome_tool]
        resultado = funcao(**argumentos)

        return {
            "erro": False,
            "tool": nome_tool,
            "resultado": resultado
        }

    except TypeError as erro:
        return {
            "erro": True,
            "mensagem": f"Argumentos inválidos para a tool '{nome_tool}': {erro}"
        }

    except Exception as erro:
        return {
            "erro": True,
            "mensagem": f"Erro ao executar a tool '{nome_tool}': {erro}"
        }