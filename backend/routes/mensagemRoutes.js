const express = require("express");
const mensagemController = require("../controllers/mensagemController");

const router = express.Router();

router.post("/mensagens", mensagemController.criar);
router.get("/mensagens/:conversa_id", mensagemController.listarPorConversa);

module.exports = router;
