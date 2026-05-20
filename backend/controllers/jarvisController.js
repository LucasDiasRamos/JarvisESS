const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const LOCAL_PYTHON = path.join(PROJECT_ROOT, ".venv", "bin", "python");
const PYTHON_BIN = process.env.PYTHON_BIN || (fs.existsSync(LOCAL_PYTHON) ? LOCAL_PYTHON : "python3");
const RESPONSE_PREFIX = "__JARVIS_RESPONSE__";

function conversarComJarvis(req, res) {
  const texto = String(req.body?.message || "").trim();
  const userId = Number(req.body?.user_id || req.body?.usuario_id || 1);

  if (!texto) {
    return res.status(400).json({ erro: "message e obrigatorio." });
  }

  const child = spawn(PYTHON_BIN, ["-m", "backend.ai.chat_cli"], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      DB_PATH: process.env.DB_PATH || path.join(PROJECT_ROOT, "data", "jarvis.db"),
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  let finished = false;

  const timeout = setTimeout(() => {
    finished = true;
    child.kill("SIGTERM");
    return res.status(504).json({
      erro: "Tempo limite ao aguardar resposta do Jarvis.",
      resposta: "Demorei demais para responder. Tente novamente em alguns instantes.",
    });
  }, Number(process.env.JARVIS_CHAT_TIMEOUT_MS || 90000));

  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  child.on("error", (error) => {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    return res.status(500).json({
      erro: "Nao foi possivel iniciar o processo Python do Jarvis.",
      detalhe: error.message,
    });
  });

  child.on("close", (code) => {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);

    const line = stdout
      .split(/\r?\n/)
      .find((item) => item.startsWith(RESPONSE_PREFIX));

    if (!line) {
      return res.status(502).json({
        erro: "Resposta invalida do processo Python do Jarvis.",
        detalhe: stderr || stdout || `Processo finalizou com codigo ${code}.`,
      });
    }

    try {
      const payload = JSON.parse(line.slice(RESPONSE_PREFIX.length));
      return res.json(payload);
    } catch (error) {
      return res.status(502).json({
        erro: "Nao foi possivel interpretar a resposta do Jarvis.",
        detalhe: error.message,
      });
    }
  });

  child.stdin.end(JSON.stringify({ message: texto, user_id: userId }));
}

module.exports = {
  conversarComJarvis,
};
