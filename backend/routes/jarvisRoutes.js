const express = require("express");
const jarvisController = require("../controllers/jarvisController");

const router = express.Router();

router.post("/jarvis/chat", jarvisController.conversarComJarvis);

module.exports = router;
