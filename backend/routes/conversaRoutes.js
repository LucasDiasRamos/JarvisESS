const express = require("express");
const conversaController = require("../controllers/conversaController");

const router = express.Router();

router.post("/conversas", conversaController.criar);
router.get("/conversas/user/:user_id", conversaController.listarPorUsuario);
router.get("/conversas/:usuario_id", conversaController.listarPorUsuario);
router.delete("/conversas/:id", conversaController.remover);

module.exports = router;
