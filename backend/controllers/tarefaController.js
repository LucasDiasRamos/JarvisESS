const tarefaRepository = require("../repositories/tarefaRepository");

async function criar(req, res, next) {
  try {
    const { usuario_id, titulo, descricao, data_limite } = req.body;

    if (!titulo) {
      return res.status(400).json({ erro: "O campo titulo e obrigatorio." });
    }

    const tarefa = await tarefaRepository.criarTarefa({ usuario_id, titulo, descricao, data_limite });
    return res.status(201).json(tarefa);
  } catch (error) {
    return next(error);
  }
}

async function listarPorUsuario(req, res, next) {
  try {
    const tarefas = await tarefaRepository.listarTarefasPorUsuario(req.params.usuario_id);
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
