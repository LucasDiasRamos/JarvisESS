const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const arquivoRepository = require("../repositories/arquivoRepository");
const { registrarUploadDocumento } = require("./logService");

const projectRoot = path.join(__dirname, "..", "..");
const rawDir = path.join(projectRoot, "data", "raw");
const processedDir = path.join(projectRoot, "data", "processed");
const convertScript = path.join(projectRoot, "scripts", "convert_pdfs.py");
const venvPython = path.join(projectRoot, ".venv", "bin", "python");

function pythonCommand() {
  return fs.existsSync(venvPython) ? venvPython : "python3";
}

function toRelativePath(absolutePath) {
  return path.relative(projectRoot, absolutePath).split(path.sep).join("/");
}

function safePdfName(filename) {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  const safeBase = base || `arquivo-${Date.now()}`;
  return `${safeBase}${ext === ".pdf" ? ext : ".pdf"}`;
}

function uniquePdfPath(filename) {
  fs.mkdirSync(rawDir, { recursive: true });

  const safeName = safePdfName(filename);
  const ext = path.extname(safeName);
  const base = path.basename(safeName, ext);
  let candidate = path.join(rawDir, safeName);
  let count = 1;

  while (fs.existsSync(candidate)) {
    candidate = path.join(rawDir, `${base}-${count}${ext}`);
    count += 1;
  }

  return candidate;
}

function mdPathForPdf(pdfPath) {
  fs.mkdirSync(processedDir, { recursive: true });
  return path.join(processedDir, `${path.basename(pdfPath, path.extname(pdfPath))}.md`);
}

function countMarkdownChunks(mdPath) {
  if (!mdPath || !fs.existsSync(mdPath)) return 0;

  const text = fs.readFileSync(mdPath, "utf8").trim();
  if (!text) return 0;

  const chunkSize = 500;
  const chunkOverlap = 50;
  const step = chunkSize - chunkOverlap;
  return Math.max(1, Math.ceil(Math.max(text.length - chunkOverlap, 1) / step));
}

function convertPdfToMarkdown(pdfPath) {
  const mdPath = mdPathForPdf(pdfPath);

  if (fs.existsSync(mdPath)) {
    return Promise.resolve({ pages: null, mdPath });
  }

  return new Promise((resolve, reject) => {
    const child = spawn(pythonCommand(), [convertScript, pdfPath, mdPath], {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Falha ao converter PDF. Codigo ${code}`));
        return;
      }

      try {
        const lines = stdout.trim().split(/\r?\n/);
        const result = JSON.parse(lines[lines.length - 1]);
        resolve({ pages: result.pages, mdPath });
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function registerPdf({ userId = null, pdfPath, source }) {
  const relativePdfPath = toRelativePath(pdfPath);
  const existing = await arquivoRepository.buscarArquivoPorCaminho(relativePdfPath);
  const stats = fs.statSync(pdfPath);
  const arquivo = existing || await arquivoRepository.criarArquivo({
    usuario_id: userId,
    nome_arquivo: path.basename(pdfPath),
    caminho_arquivo: relativePdfPath,
    source,
    status_processamento: "pendente",
    tamanho_bytes: stats.size,
  });

  if (existing?.status_processamento === "convertido" && existing.caminho_md) {
    registrarUploadDocumento({
      arquivo: existing.nome_arquivo,
      status: existing.status_processamento,
      quantidade_chunks: countMarkdownChunks(path.join(projectRoot, existing.caminho_md)),
      embedding_gerado: false,
    });
    return existing;
  }

  try {
    const converted = await convertPdfToMarkdown(pdfPath);
    const updated = await arquivoRepository.atualizarArquivo(arquivo.id, {
      caminho_md: toRelativePath(converted.mdPath),
      status_processamento: "convertido",
      paginas: converted.pages || arquivo.paginas || null,
      tamanho_bytes: stats.size,
    });
    registrarUploadDocumento({
      arquivo: updated.nome_arquivo,
      status: updated.status_processamento,
      quantidade_chunks: countMarkdownChunks(converted.mdPath),
      embedding_gerado: false,
    });
    return updated;
  } catch (error) {
    const updated = await arquivoRepository.atualizarArquivo(arquivo.id, {
      status_processamento: "erro",
      tamanho_bytes: stats.size,
    });
    registrarUploadDocumento({
      arquivo: updated.nome_arquivo,
      status: updated.status_processamento,
      quantidade_chunks: 0,
      embedding_gerado: false,
    });
    return updated;
  }
}

async function migrateRawPdfs() {
  fs.mkdirSync(rawDir, { recursive: true });
  const pdfs = fs.readdirSync(rawDir)
    .filter((filename) => filename.toLowerCase().endsWith(".pdf"))
    .sort();
  const migrated = [];

  for (const filename of pdfs) {
    const pdfPath = path.join(rawDir, filename);
    migrated.push(await registerPdf({ pdfPath, source: "raw" }));
  }

  return migrated;
}

function parseMultipartPdf(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers["content-type"] || "";
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);

    if (!boundaryMatch) {
      reject(new Error("Content-Type multipart/form-data sem boundary."));
      return;
    }

    const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
    const chunks = [];
    let total = 0;
    const maxBytes = 200 * 1024 * 1024;

    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        req.destroy(new Error("Arquivo maior que 200 MB."));
        return;
      }
      chunks.push(chunk);
    });

    req.on("error", reject);
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      const boundaryStart = body.indexOf(boundary);
      const boundaryEnd = body.indexOf(boundary, boundaryStart + boundary.length);

      if (boundaryStart === -1 || boundaryEnd === -1) {
        reject(new Error("Multipart invalido."));
        return;
      }

      const part = body.subarray(boundaryStart + boundary.length + 2, boundaryEnd - 2);
      const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));

      if (headerEnd === -1) {
        reject(new Error("Cabecalho multipart invalido."));
        return;
      }

      const headers = part.subarray(0, headerEnd).toString("utf8");
      const filenameMatch = headers.match(/filename="([^"]+)"/i);
      const contentTypeMatch = headers.match(/content-type:\s*([^\r\n]+)/i);

      if (!filenameMatch) {
        reject(new Error("Campo de arquivo nao encontrado."));
        return;
      }

      const filename = path.basename(filenameMatch[1]);
      const mimetype = contentTypeMatch ? contentTypeMatch[1].trim() : "";
      const buffer = part.subarray(headerEnd + 4);

      if (!filename.toLowerCase().endsWith(".pdf") && mimetype !== "application/pdf") {
        reject(new Error("Envie apenas arquivos PDF."));
        return;
      }

      resolve({ filename, buffer, mimetype });
    });
  });
}

async function saveUploadedPdf({ file, userId }) {
  const pdfPath = uniquePdfPath(file.filename);
  const tempPath = `${pdfPath}.${crypto.randomUUID()}.tmp`;

  fs.writeFileSync(tempPath, file.buffer);
  fs.renameSync(tempPath, pdfPath);

  return registerPdf({ userId, pdfPath, source: "upload" });
}

function publicDocumentUrl(caminhoArquivo) {
  if (!caminhoArquivo) return null;
  return `/${caminhoArquivo.replace(/^data\//, "")}`;
}

function formatArquivo(row) {
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    name: row.nome_arquivo,
    nome_arquivo: row.nome_arquivo,
    caminho_arquivo: row.caminho_arquivo,
    caminho_md: row.caminho_md,
    source: row.source || "upload",
    status_processamento: row.status_processamento || "pendente",
    sizeBytes: row.tamanho_bytes || 0,
    tamanho_bytes: row.tamanho_bytes || 0,
    pages: row.paginas || null,
    paginas: row.paginas || null,
    added: row.criado_em ? row.criado_em.slice(0, 10) : null,
    criado_em: row.criado_em,
    url: publicDocumentUrl(row.caminho_arquivo),
  };
}

module.exports = {
  formatArquivo,
  migrateRawPdfs,
  parseMultipartPdf,
  saveUploadedPdf,
};
