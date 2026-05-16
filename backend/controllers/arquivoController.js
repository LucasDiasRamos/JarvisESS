const arquivoRepository = require("../repositories/arquivoRepository");

async function criar(req, res, next) {
  try {
    const { usuario_id, nome_arquivo, caminho_arquivo, status_processamento } = req.body;

    if (!nome_arquivo || !caminho_arquivo) {
      return res.status(400).json({ erro: "nome_arquivo e caminho_arquivo sao obrigatorios." });
    }

    const arquivo = await arquivoRepository.criarArquivo({
      usuario_id,
      nome_arquivo,
      caminho_arquivo,
      status_processamento,
    });

    return res.status(201).json(arquivo);
  } catch (error) {
    return next(error);
  }
}

async function listarPorUsuario(req, res, next) {
  try {
    const arquivos = await arquivoRepository.listarArquivosPorUsuario(req.params.usuario_id);
    return res.json(arquivos);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  criar,
  listarPorUsuario,
};
