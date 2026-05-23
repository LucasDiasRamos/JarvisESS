const mensagemRepository = require("../repositories/mensagemRepository");

async function criar(req, res, next) {
  try {
    const { remetente, conteudo } = req.body;
    const conversa_id = req.body?.conversa_id || req.body?.conversation_id;
    const fontes = Array.isArray(req.body?.fontes)
      ? req.body.fontes
      : Array.isArray(req.body?.sources)
        ? req.body.sources
        : [];

    if (!remetente || !conteudo) {
      return res.status(400).json({ erro: "remetente e conteudo sao obrigatorios." });
    }

    const mensagem = await mensagemRepository.criarMensagem({ conversa_id, remetente, conteudo, fontes });
    return res.status(201).json(mensagem);
  } catch (error) {
    return next(error);
  }
}

async function listarPorConversa(req, res, next) {
  try {
    const mensagens = await mensagemRepository.listarMensagensPorConversa(req.params.conversa_id);
    return res.json(mensagens);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  criar,
  listarPorConversa,
};
