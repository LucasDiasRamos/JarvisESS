const db = require("../database/db");

async function criarUsuario({ nome, email, tipo = "aluno" }) {
  const result = await db.run(
    "INSERT INTO user (nome, email, tipo) VALUES (?, ?, ?)",
    [nome, email || null, tipo || "aluno"],
  );

  return buscarUsuarioPorId(result.id);
}

function listarUsuarios() {
  return db.all(
    `SELECT *
     FROM user
     ORDER BY CASE WHEN email = 'aluno@jarvis.local' THEN 0 ELSE 1 END, criado_em DESC`,
  );
}

function buscarUsuarioPorId(id) {
  return db.get("SELECT * FROM user WHERE id = ?", [id]);
}

module.exports = {
  buscarUsuarioPorId,
  criarUsuario,
  listarUsuarios,
};
