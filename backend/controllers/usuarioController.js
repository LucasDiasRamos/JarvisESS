const usuarioRepository = require("../repositories/usuarioRepository");

async function criar(req, res, next) {
  try {
    const { nome, email, tipo } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: "O campo nome e obrigatorio." });
    }

    const usuario = await usuarioRepository.criarUsuario({ nome, email, tipo });
    return res.status(201).json(usuario);
  } catch (error) {
    return next(error);
  }
}

async function listar(req, res, next) {
  try {
    const usuarios = await usuarioRepository.listarUsuarios();
    return res.json(usuarios);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  criar,
  listar,
};
