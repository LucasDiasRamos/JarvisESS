const db = require("../database/db");

async function criarMensagem({ conversa_id, remetente, conteudo }) {
  const result = await db.run(
    "INSERT INTO mensagens (conversa_id, remetente, conteudo) VALUES (?, ?, ?)",
    [conversa_id || null, remetente, conteudo],
  );

  return buscarMensagemPorId(result.id);
}

function listarMensagensPorConversa(conversaId) {
  return db.all(
    "SELECT * FROM mensagens WHERE conversa_id = ? ORDER BY criado_em ASC, id ASC",
    [conversaId],
  );
}

function buscarMensagemPorId(id) {
  return db.get("SELECT * FROM mensagens WHERE id = ?", [id]);
}

module.exports = {
  buscarMensagemPorId,
  criarMensagem,
  listarMensagensPorConversa,
};
