import inspect
import json
import re

from backend.ai.logger import registrar_chamada_tool
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

from backend.ai.tools.rag_tools import (
    buscar_material_rag
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
    "deletar_arquivo": deletar_arquivo,
    
    "buscar_material_rag": buscar_material_rag,
}

ARGUMENT_ALIASES = {
    "concluir_tarefa": {"id": "tarefa_id"},
    "excluir_tarefa": {"id": "tarefa_id"},
    "excluir_lembrete": {"id": "lembrete_id"},
    "deletar_arquivo": {"id": "arquivo_id"},
    "registrar_arquivo": {
        "nome_arquivo": "nome",
        "caminho_arquivo": "caminho",
    },
}


def _normalizar_argumentos(nome_tool: str, funcao, argumentos: dict) -> dict:
    aliases = ARGUMENT_ALIASES.get(nome_tool, {})
    normalizados = {}

    for chave, valor in argumentos.items():
        normalizados[aliases.get(chave, chave)] = valor

    assinatura = inspect.signature(funcao)
    parametros = assinatura.parameters

    if any(param.kind == inspect.Parameter.VAR_KEYWORD for param in parametros.values()):
        return normalizados

    return {
        chave: valor
        for chave, valor in normalizados.items()
        if chave in parametros
    }

def interpretar_resposta_llm(resposta_texto: str) -> dict:
    texto = resposta_texto.strip()

    bloco_json = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", texto, re.DOTALL)
    if bloco_json:
        texto = bloco_json.group(1)

    try:
        return json.loads(texto)
    except json.JSONDecodeError:
        return {
            "usar_tool": False,
            "resposta": resposta_texto
        }


def executar_tool(nome_tool: str, argumentos: dict | None = None) -> dict:
    if argumentos is None:
        argumentos = {}

    user_id = argumentos.get("user_id")

    if nome_tool not in TOOLS:
        resultado = {
            "erro": True,
            "mensagem": f"Tool '{nome_tool}' não encontrada."
        }
        registrar_chamada_tool(nome_tool, argumentos, resultado, user_id=user_id)
        return resultado

    try:
        funcao = TOOLS[nome_tool]
        argumentos_normalizados = _normalizar_argumentos(nome_tool, funcao, argumentos)
        resultado = funcao(**argumentos_normalizados)

        resposta = {
            "erro": False,
            "tool": nome_tool,
            "resultado": resultado
        }
        registrar_chamada_tool(nome_tool, argumentos_normalizados, resposta, user_id=user_id)
        return resposta

    except TypeError as erro:
        resultado = {
            "erro": True,
            "mensagem": f"Argumentos inválidos para a tool '{nome_tool}': {erro}"
        }
        registrar_chamada_tool(nome_tool, argumentos, resultado, user_id=user_id)
        return resultado

    except Exception as erro:
        resultado = {
            "erro": True,
            "mensagem": f"Erro ao executar a tool '{nome_tool}': {erro}"
        }
        registrar_chamada_tool(nome_tool, argumentos, resultado, user_id=user_id)
        return resultado
