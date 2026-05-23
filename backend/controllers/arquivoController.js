const arquivoRepository = require("../repositories/arquivoRepository");
const documentService = require("../services/documentService");

function mapArquivos(rows) {
  return rows.map(documentService.formatArquivo);
}

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

    return res.status(201).json(documentService.formatArquivo(arquivo));
  } catch (error) {
    return next(error);
  }
}

async function listar(req, res, next) {
  try {
    const arquivos = await arquivoRepository.listarArquivos();
    return res.json(mapArquivos(arquivos));
  } catch (error) {
    return next(error);
  }
}

async function listarPorUsuario(req, res, next) {
  try {
    const arquivos = await arquivoRepository.listarArquivosPorUsuario(req.params.usuario_id);
    return res.json(mapArquivos(arquivos));
  } catch (error) {
    return next(error);
  }
}

async function remover(req, res, next) {
  try {
    const result = await arquivoRepository.deletarArquivo(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ erro: "Documento nao encontrado." });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function migrarData(req, res, next) {
  try {
    const arquivos = await documentService.migrateRawPdfs();
    return res.json(mapArquivos(arquivos));
  } catch (error) {
    return next(error);
  }
}

async function upload(req, res, next) {
  try {
    const userId = req.body?.usuario_id || req.query.usuario_id || null;
    const file = await documentService.parseMultipartPdf(req);
    const arquivo = await documentService.saveUploadedPdf({ file, userId });

    return res.status(201).json(documentService.formatArquivo(arquivo));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  criar,
  listar,
  listarPorUsuario,
  migrarData,
  remover,
  upload,
};
