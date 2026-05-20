const cors = require("cors");
const express = require("express");
const { dbPath, initDatabase } = require("./database/db");

const usuarioRoutes = require("./routes/usuarioRoutes");
const arquivoRoutes = require("./routes/arquivoRoutes");
const conversaRoutes = require("./routes/conversaRoutes");
const mensagemRoutes = require("./routes/mensagemRoutes");
const tarefaRoutes = require("./routes/tarefaRoutes");
const lembreteRoutes = require("./routes/lembreteRoutes");
const jarvisRoutes = require("./routes/jarvisRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ app: "Jarvis API", status: "ok" });
});

// Rotas da API. As queries ficam nos repositories.
app.use(usuarioRoutes);
app.use(arquivoRoutes);
app.use(conversaRoutes);
app.use(mensagemRoutes);
app.use(tarefaRoutes);
app.use(lembreteRoutes);
app.use(jarvisRoutes);

app.use((req, res) => {
  res.status(404).json({ erro: "Rota nao encontrada." });
});

// Tratamento unico de erro para controllers/repositories.
app.use((error, req, res, next) => {
  console.error(error);

  if (error.code === "SQLITE_CONSTRAINT") {
    return res.status(409).json({ erro: "Violacao de restricao no banco de dados." });
  }

  return res.status(500).json({ erro: "Erro interno do servidor." });
});

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Jarvis API rodando em http://localhost:${PORT}`);
      console.log(`Banco SQLite: ${dbPath}`);
    });
  } catch (error) {
    console.error("Falha ao inicializar o banco SQLite:", error);
    process.exit(1);
  }
}

start();
