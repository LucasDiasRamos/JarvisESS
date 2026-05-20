const db = require("../database/db");

async function criarLembrete({ usuario_id, titulo, descricao, data_hora, tipo = "event", origem = "user" }) {
  const result = await db.run(
    `INSERT INTO lembretes (user_id, titulo, descricao, tipo, data_hora, origem)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [usuario_id || null, titulo, descricao || null, tipo || "event", data_hora, origem || "user"],
  );

  return buscarLembretePorId(result.id);
}

function listarLembretesPorUsuario(usuarioId) {
  return db.all(
    "SELECT *, user_id AS usuario_id FROM lembretes WHERE user_id = ? ORDER BY data_hora ASC",
    [usuarioId],
  );
}

async function deletarLembrete(id) {
  return db.run("DELETE FROM lembretes WHERE id = ?", [id]);
}

function buscarLembretePorId(id) {
  return db.get("SELECT *, user_id AS usuario_id FROM lembretes WHERE id = ?", [id]);
}

module.exports = {
  buscarLembretePorId,
  criarLembrete,
  deletarLembrete,
  listarLembretesPorUsuario,
};
