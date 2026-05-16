const express = require("express");
const conversaController = require("../controllers/conversaController");

const router = express.Router();

router.post("/conversas", conversaController.criar);
router.get("/conversas/:usuario_id", conversaController.listarPorUsuario);

module.exports = router;
