const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { registrarErro } = require("../services/logService");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const LOCAL_PYTHON = path.join(PROJECT_ROOT, ".venv", "bin", "python");
const PYTHON_BIN = process.env.PYTHON_BIN || (fs.existsSync(LOCAL_PYTHON) ? LOCAL_PYTHON : "python3");
const RESPONSE_PREFIX = "__JARVIS_RESPONSE__";

function lerEnvRaiz(nome) {
  const envPath = path.join(PROJECT_ROOT, ".env");
  if (!fs.existsSync(envPath)) return "";

  const regex = new RegExp(`^\\s*${nome}\\s*=\\s*(.*)\\s*$`);
  const linha = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .map((item) => item.match(regex))
    .find(Boolean);

  if (!linha) return "";

  return linha[1].trim().replace(/^["']|["']$/g, "");
}

function obterTimeoutChatMs() {
  const timeoutExplicito = Number(process.env.JARVIS_CHAT_TIMEOUT_MS || lerEnvRaiz("JARVIS_CHAT_TIMEOUT_MS"));
  if (Number.isFinite(timeoutExplicito) && timeoutExplicito > 0) {
    return timeoutExplicito;
  }

  const timeoutLlmSegundos = Number(process.env.JARVIS_LLM_TIMEOUT || lerEnvRaiz("JARVIS_LLM_TIMEOUT") || 30);
  const timeoutLlmMs = Number.isFinite(timeoutLlmSegundos) && timeoutLlmSegundos > 0
    ? timeoutLlmSegundos * 1000
    : 30000;

  return Math.max(90000, timeoutLlmMs + 15000);
}

function conversarComJarvis(req, res) {
  const texto = String(req.body?.message || "").trim();
  const userId = Number(req.body?.user_id || req.body?.usuario_id || 1);
  const conversationId = Number(req.body?.conversation_id || req.body?.conversa_id || 0) || null;

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

  const timeoutChatMs = obterTimeoutChatMs();
  const timeout = setTimeout(() => {
    finished = true;
    child.kill("SIGTERM");
    registrarErro({
      tipo_erro: "timeout_chat",
      mensagem: "Tempo limite ao aguardar resposta do Jarvis.",
      pergunta_usuario: texto,
      possivel_causa: `LLM lenta, processo Python travado ou tool demorando demais. Timeout configurado: ${timeoutChatMs}ms`,
    });
    return res.status(504).json({
      erro: "Tempo limite ao aguardar resposta do Jarvis.",
      resposta: "Demorei demais para responder. Tente novamente em alguns instantes.",
    });
  }, timeoutChatMs);

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
    registrarErro({
      tipo_erro: "processo_python",
      mensagem: error.message,
      pergunta_usuario: texto,
      possivel_causa: "Python nao encontrado, dependencia ausente ou falha ao iniciar subprocesso",
    });
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
      registrarErro({
        tipo_erro: "resposta_python_invalida",
        mensagem: stderr || stdout || `Processo finalizou com codigo ${code}.`,
        pergunta_usuario: texto,
        possivel_causa: "excecao no Python antes de imprimir o prefixo de resposta",
      });
      return res.status(502).json({
        erro: "Resposta invalida do processo Python do Jarvis.",
        detalhe: stderr || stdout || `Processo finalizou com codigo ${code}.`,
      });
    }

    try {
      const payload = JSON.parse(line.slice(RESPONSE_PREFIX.length));
      return res.json(payload);
    } catch (error) {
      registrarErro({
        tipo_erro: "json_python_invalido",
        mensagem: error.message,
        pergunta_usuario: texto,
        possivel_causa: "payload do Python nao estava em JSON valido",
      });
      return res.status(502).json({
        erro: "Nao foi possivel interpretar a resposta do Jarvis.",
        detalhe: error.message,
      });
    }
  });

  child.stdin.end(JSON.stringify({ message: texto, user_id: userId, conversation_id: conversationId }));
}

module.exports = {
  conversarComJarvis,
};
