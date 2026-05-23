const express = require("express");
const arquivoController = require("../controllers/arquivoController");

const router = express.Router();

router.post("/arquivos", arquivoController.criar);
router.get("/arquivos", arquivoController.listar);
router.post("/arquivos/upload", arquivoController.upload);
router.post("/arquivos/migrar-data", arquivoController.migrarData);
router.get("/arquivos/:usuario_id", arquivoController.listarPorUsuario);
router.delete("/arquivos/:id", arquivoController.remover);

module.exports = router;
