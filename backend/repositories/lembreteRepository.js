const db = require("../database/db");

async function criarLembrete({ usuario_id, titulo, descricao, data_hora }) {
  const result = await db.run(
    `INSERT INTO lembretes (usuario_id, titulo, descricao, data_hora)
     VALUES (?, ?, ?, ?)`,
    [usuario_id || null, titulo, descricao || null, data_hora],
  );

  return buscarLembretePorId(result.id);
}

function listarLembretesPorUsuario(usuarioId) {
  return db.all(
    "SELECT * FROM lembretes WHERE usuario_id = ? ORDER BY data_hora ASC",
    [usuarioId],
  );
}

async function deletarLembrete(id) {
  return db.run("DELETE FROM lembretes WHERE id = ?", [id]);
}

function buscarLembretePorId(id) {
  return db.get("SELECT * FROM lembretes WHERE id = ?", [id]);
}

module.exports = {
  buscarLembretePorId,
  criarLembrete,
  deletarLembrete,
  listarLembretesPorUsuario,
};
