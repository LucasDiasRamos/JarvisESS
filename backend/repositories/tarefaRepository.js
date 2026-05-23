const db = require("../database/db");

async function criarTarefa({ usuario_id, titulo, descricao, data_limite, origem = "user" }) {
  const result = await db.run(
    `INSERT INTO tarefas (user_id, titulo, descricao, data_limite, origem)
     VALUES (?, ?, ?, ?, ?)`,
    [usuario_id || null, titulo, descricao || null, data_limite || null, origem || "user"],
  );

  return buscarTarefaPorId(result.id);
}

function listarTarefasPorUsuario(usuarioId) {
  return db.all(
    "SELECT *, user_id AS usuario_id FROM tarefas WHERE user_id = ? ORDER BY concluida ASC, data_limite ASC, criado_em DESC",
    [usuarioId],
  );
}

async function concluirTarefa(id) {
  await db.run("UPDATE tarefas SET concluida = 1 WHERE id = ?", [id]);
  return buscarTarefaPorId(id);
}

async function deletarTarefa(id) {
  return db.run("DELETE FROM tarefas WHERE id = ?", [id]);
}

function buscarTarefaPorId(id) {
  return db.get("SELECT *, user_id AS usuario_id FROM tarefas WHERE id = ?", [id]);
}

module.exports = {
  buscarTarefaPorId,
  concluirTarefa,
  criarTarefa,
  deletarTarefa,
  listarTarefasPorUsuario,
};
