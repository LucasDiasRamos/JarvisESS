const db = require("../database/db");

async function criarConversa({ usuario_id, titulo }) {
  const result = await db.run(
    "INSERT INTO conversas (user_id, titulo) VALUES (?, ?)",
    [usuario_id || null, titulo || null],
  );

  return buscarConversaPorId(result.id);
}

function listarConversasPorUsuario(usuarioId) {
  return db.all(
    "SELECT *, user_id AS usuario_id FROM conversas WHERE user_id = ? ORDER BY criado_em DESC",
    [usuarioId],
  );
}

function buscarConversaPorId(id) {
  return db.get("SELECT *, user_id AS usuario_id FROM conversas WHERE id = ?", [id]);
}

async function deletarConversa(id) {
  await db.run("DELETE FROM mensagens WHERE conversa_id = ?", [id]);
  return db.run("DELETE FROM conversas WHERE id = ?", [id]);
}

module.exports = {
  buscarConversaPorId,
  criarConversa,
  deletarConversa,
  listarConversasPorUsuario,
};
