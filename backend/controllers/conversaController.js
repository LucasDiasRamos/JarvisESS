const conversaRepository = require("../repositories/conversaRepository");

async function criar(req, res, next) {
  try {
    const { titulo } = req.body;
    const usuario_id = req.body?.usuario_id || req.body?.user_id;

    const conversa = await conversaRepository.criarConversa({ usuario_id, titulo });
    return res.status(201).json(conversa);
  } catch (error) {
    return next(error);
  }
}

async function listarPorUsuario(req, res, next) {
  try {
    const userId = req.params.usuario_id || req.params.user_id;
    const conversas = await conversaRepository.listarConversasPorUsuario(userId);
    return res.json(conversas);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  criar,
  listarPorUsuario,
};
