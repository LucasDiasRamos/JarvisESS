const conversaRepository = require("../repositories/conversaRepository");

async function criar(req, res, next) {
  try {
    const { usuario_id, titulo } = req.body;

    const conversa = await conversaRepository.criarConversa({ usuario_id, titulo });
    return res.status(201).json(conversa);
  } catch (error) {
    return next(error);
  }
}

async function listarPorUsuario(req, res, next) {
  try {
    const conversas = await conversaRepository.listarConversasPorUsuario(req.params.usuario_id);
    return res.json(conversas);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  criar,
  listarPorUsuario,
};
