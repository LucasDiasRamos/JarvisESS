const tarefaRepository = require("../repositories/tarefaRepository");

async function criar(req, res, next) {
  try {
    const { titulo, descricao, data_limite } = req.body;
    const origem = req.body?.origem || req.body?.source || "user";
    const usuario_id = req.body?.usuario_id || req.body?.user_id;

    if (!titulo) {
      return res.status(400).json({ erro: "O campo titulo e obrigatorio." });
    }

    const tarefa = await tarefaRepository.criarTarefa({ usuario_id, titulo, descricao, data_limite, origem });
    return res.status(201).json(tarefa);
  } catch (error) {
    return next(error);
  }
}

async function listarPorUsuario(req, res, next) {
  try {
    const userId = req.params.usuario_id || req.params.user_id;
    const tarefas = await tarefaRepository.listarTarefasPorUsuario(userId);
    return res.json(tarefas);
  } catch (error) {
    return next(error);
  }
}

async function concluir(req, res, next) {
  try {
    const tarefa = await tarefaRepository.concluirTarefa(req.params.id);

    if (!tarefa) {
      return res.status(404).json({ erro: "Tarefa nao encontrada." });
    }

    return res.json(tarefa);
  } catch (error) {
    return next(error);
  }
}

async function remover(req, res, next) {
  try {
    const result = await tarefaRepository.deletarTarefa(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ erro: "Tarefa nao encontrada." });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  concluir,
  criar,
  listarPorUsuario,
  remover,
};
