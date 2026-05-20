const fs = require("fs/promises");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const LOG_DIR = process.env.JARVIS_LOG_DIR || path.join(PROJECT_ROOT, "logs");
const LOG_FILES = {
  tools: "tools.jsonl",
  rag: "rag.jsonl",
  agenda: "agenda.jsonl",
  tarefas: "tarefas.jsonl",
  erros: "erros.jsonl",
  uploads: "uploads.jsonl",
};

function parseLimit(value) {
  const limit = Number(value || 100);
  if (!Number.isFinite(limit)) return 100;
  return Math.min(Math.max(Math.trunc(limit), 1), 500);
}

async function readJsonLines(fileName, limit) {
  const filePath = path.join(LOG_DIR, fileName);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-limit)
      .map((line, index) => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return {
            data_hora: null,
            erro_parse: true,
            linha: line,
            indice: index,
          };
        }
      })
      .reverse();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function listar(req, res, next) {
  try {
    const tipo = req.params.tipo;
    const fileName = LOG_FILES[tipo];

    if (!fileName) {
      return res.status(400).json({ erro: "Tipo de log invalido. Use tools, rag, agenda, tarefas, erros ou uploads." });
    }

    const registros = await readJsonLines(fileName, parseLimit(req.query.limit));
    return res.json({
      tipo,
      total: registros.length,
      logs: registros,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listar,
};
