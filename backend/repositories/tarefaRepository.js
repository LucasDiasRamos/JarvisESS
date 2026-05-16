const db = require("../database/db");

async function criarTarefa({ usuario_id, titulo, descricao, data_limite }) {
  const result = await db.run(
    `INSERT INTO tarefas (usuario_id, titulo, descricao, data_limite)
     VALUES (?, ?, ?, ?)`,
    [usuario_id || null, titulo, descricao || null, data_limite || null],
  );

  return buscarTarefaPorId(result.id);
}

function listarTarefasPorUsuario(usuarioId) {
  return db.all(
    "SELECT * FROM tarefas WHERE usuario_id = ? ORDER BY concluida ASC, data_limite ASC, criado_em DESC",
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
  return db.get("SELECT * FROM tarefas WHERE id = ?", [id]);
}

module.exports = {
  buscarTarefaPorId,
  concluirTarefa,
  criarTarefa,
  deletarTarefa,
  listarTarefasPorUsuario,
};
