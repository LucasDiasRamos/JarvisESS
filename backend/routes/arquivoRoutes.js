const express = require("express");
const arquivoController = require("../controllers/arquivoController");

const router = express.Router();

router.post("/arquivos", arquivoController.criar);
router.get("/arquivos/:usuario_id", arquivoController.listarPorUsuario);

module.exports = router;
