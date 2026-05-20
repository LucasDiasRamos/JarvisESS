import json
import logging
from datetime import datetime
from pathlib import Path

LOG_DIR = Path(__file__).parent.parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Log em formato legível
logging.basicConfig(
    filename=LOG_DIR / "jarvis.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

def registrar_chamada_tool(
    tool: str,
    argumentos: dict,
    resultado: dict,
    user_id: int = None
):
    """Registra uma chamada de tool nos logs."""
    entrada = {
        "timestamp": datetime.now().isoformat(),
        "userid": user_id,
        "tool": tool,
        "argumentos": argumentos,
        "resultado": resultado,
        "erro": resultado.get("erro", False)
    }
    
    # Log estruturado em JSON
    with open(LOG_DIR / "tools.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(entrada, ensure_ascii=False) + "\n")
        
    # Log legível para debug
    status = "ERRO" if entrada["erro"] else "OK"
    logging.info(f"[{status}] tool={tool} user={user_id} args={argumentos}")