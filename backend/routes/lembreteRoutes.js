const express = require("express");
const lembreteController = require("../controllers/lembreteController");

const router = express.Router();

router.post("/lembretes", lembreteController.criar);
router.get("/lembretes/:usuario_id", lembreteController.listarPorUsuario);
router.delete("/lembretes/:id", lembreteController.remover);

module.exports = router;
