const lembreteRepository = require("../repositories/lembreteRepository");

async function criar(req, res, next) {
  try {
    const { titulo, descricao, data_hora } = req.body;
    const tipo = req.body?.tipo || req.body?.kind || "event";
    const origem = req.body?.origem || req.body?.source || "user";
    const usuario_id = req.body?.usuario_id || req.body?.user_id;

    if (!titulo || !data_hora) {
      return res.status(400).json({ erro: "titulo e data_hora sao obrigatorios." });
    }

    const lembrete = await lembreteRepository.criarLembrete({ usuario_id, titulo, descricao, data_hora, tipo, origem });
    return res.status(201).json(lembrete);
  } catch (error) {
    return next(error);
  }
}

async function listarPorUsuario(req, res, next) {
  try {
    const userId = req.params.usuario_id || req.params.user_id;
    const lembretes = await lembreteRepository.listarLembretesPorUsuario(userId);
    return res.json(lembretes);
  } catch (error) {
    return next(error);
  }
}

async function remover(req, res, next) {
  try {
    const result = await lembreteRepository.deletarLembrete(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ erro: "Lembrete nao encontrado." });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  criar,
  listarPorUsuario,
  remover,
};
