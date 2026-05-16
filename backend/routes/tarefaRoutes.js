const express = require("express");
const tarefaController = require("../controllers/tarefaController");

const router = express.Router();

router.post("/tarefas", tarefaController.criar);
router.get("/tarefas/:usuario_id", tarefaController.listarPorUsuario);
router.put("/tarefas/:id/concluir", tarefaController.concluir);
router.delete("/tarefas/:id", tarefaController.remover);

module.exports = router;
