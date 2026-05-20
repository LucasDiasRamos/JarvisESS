const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..", "..");
const logDir = process.env.JARVIS_LOG_DIR || path.join(projectRoot, "logs");

function dataFormatada() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "");
}

function appendJsonLine(fileName, payload) {
  fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(
    path.join(logDir, fileName),
    `${JSON.stringify(payload)}\n`,
    "utf8"
  );
}

function registrarErro({ tipo_erro, mensagem, pergunta_usuario = "", possivel_causa = "" }) {
  appendJsonLine("erros.jsonl", {
    data_hora: dataFormatada(),
    tipo_erro,
    mensagem,
    pergunta_usuario,
    possivel_causa,
  });
}

function registrarUploadDocumento({ arquivo, status, quantidade_chunks = 0, embedding_gerado = false }) {
  appendJsonLine("uploads.jsonl", {
    data_hora: dataFormatada(),
    arquivo,
    status,
    quantidade_chunks,
    embedding_gerado,
  });
}

module.exports = {
  registrarErro,
  registrarUploadDocumento,
};
