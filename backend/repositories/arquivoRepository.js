const db = require("../database/db");

async function criarArquivo({ usuario_id, nome_arquivo, caminho_arquivo, status_processamento = "pendente" }) {
  const result = await db.run(
    `INSERT INTO arquivos_pdf (usuario_id, nome_arquivo, caminho_arquivo, status_processamento)
     VALUES (?, ?, ?, ?)`,
    [usuario_id || null, nome_arquivo, caminho_arquivo, status_processamento || "pendente"],
  );

  return buscarArquivoPorId(result.id);
}

function listarArquivosPorUsuario(usuarioId) {
  return db.all(
    "SELECT * FROM arquivos_pdf WHERE usuario_id = ? ORDER BY criado_em DESC",
    [usuarioId],
  );
}

function buscarArquivoPorId(id) {
  return db.get("SELECT * FROM arquivos_pdf WHERE id = ?", [id]);
}

module.exports = {
  buscarArquivoPorId,
  criarArquivo,
  listarArquivosPorUsuario,
};
