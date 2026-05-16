const db = require("../database/db");

async function criarConversa({ usuario_id, titulo }) {
  const result = await db.run(
    "INSERT INTO conversas (usuario_id, titulo) VALUES (?, ?)",
    [usuario_id || null, titulo || null],
  );

  return buscarConversaPorId(result.id);
}

function listarConversasPorUsuario(usuarioId) {
  return db.all(
    "SELECT * FROM conversas WHERE usuario_id = ? ORDER BY criado_em DESC",
    [usuarioId],
  );
}

function buscarConversaPorId(id) {
  return db.get("SELECT * FROM conversas WHERE id = ?", [id]);
}

module.exports = {
  buscarConversaPorId,
  criarConversa,
  listarConversasPorUsuario,
};
