const db = require("../database/db");

async function criarArquivo({
  usuario_id,
  nome_arquivo,
  caminho_arquivo,
  caminho_md = null,
  source = "upload",
  status_processamento = "pendente",
  tamanho_bytes = 0,
  paginas = null,
}) {
  const result = await db.run(
    `INSERT INTO arquivos_pdf (
      user_id,
      nome_arquivo,
      caminho_arquivo,
      caminho_md,
      source,
      status_processamento,
      tamanho_bytes,
      paginas
    )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      usuario_id || null,
      nome_arquivo,
      caminho_arquivo,
      caminho_md,
      source,
      status_processamento,
      tamanho_bytes,
      paginas,
    ],
  );

  return buscarArquivoPorId(result.id);
}

function listarArquivos() {
  return db.all("SELECT *, user_id AS usuario_id FROM arquivos_pdf ORDER BY criado_em DESC, id DESC");
}

function listarArquivosPorUsuario(usuarioId) {
  return db.all(
    "SELECT *, user_id AS usuario_id FROM arquivos_pdf WHERE user_id = ? ORDER BY criado_em DESC, id DESC",
    [usuarioId],
  );
}

function buscarArquivoPorCaminho(caminhoArquivo) {
  return db.get("SELECT *, user_id AS usuario_id FROM arquivos_pdf WHERE caminho_arquivo = ?", [caminhoArquivo]);
}

function buscarArquivoPorId(id) {
  return db.get("SELECT *, user_id AS usuario_id FROM arquivos_pdf WHERE id = ?", [id]);
}

async function deletarArquivo(id) {
  return db.run("DELETE FROM arquivos_pdf WHERE id = ?", [id]);
}

async function atualizarArquivo(id, fields) {
  const allowed = [
    "caminho_md",
    "source",
    "status_processamento",
    "tamanho_bytes",
    "paginas",
  ];
  const entries = Object.entries(fields).filter(([key]) => allowed.includes(key));

  if (entries.length === 0) return buscarArquivoPorId(id);

  const setSql = entries.map(([key]) => `${key} = ?`).join(", ");
  const params = entries.map(([, value]) => value);
  await db.run(`UPDATE arquivos_pdf SET ${setSql} WHERE id = ?`, [...params, id]);

  return buscarArquivoPorId(id);
}

module.exports = {
  atualizarArquivo,
  buscarArquivoPorCaminho,
  buscarArquivoPorId,
  criarArquivo,
  deletarArquivo,
  listarArquivos,
  listarArquivosPorUsuario,
};
