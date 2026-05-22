const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "..", "data", "jarvis.db");
const schemaPath = path.join(__dirname, "schema.sql");
const projectRoot = path.join(__dirname, "..", "..");
const rawDir = path.join(projectRoot, "data", "raw");
const processedDir = path.join(projectRoot, "data", "processed");

let database;

function getDatabase() {
  if (!database) {
    database = new sqlite3.Database(dbPath);
    database.run("PRAGMA foreign_keys = ON");
  }

  return database;
}

// Executa o schema na inicializacao para garantir que o banco exista.
function initDatabase() {
  const db = getDatabase();
  const schema = fs.readFileSync(schemaPath, "utf8");

  return new Promise((resolve, reject) => {
    db.exec(schema, (error) => {
      if (error) {
        reject(error);
        return;
      }

      ensureArquivoColumns(db)
        .then(() => ensureTarefaColumns(db))
        .then(() => ensureLembreteColumns(db))
        .then(() => seedDemoData())
        .then(() => resolve(db))
        .catch(reject);
    });
  });
}

function tableInfo(db, tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

async function ensureArquivoColumns(db) {
  const columns = await tableInfo(db, "arquivos_pdf");
  const names = new Set(columns.map((column) => column.name));
  const additions = [
    ["caminho_md", "TEXT"],
    ["source", "TEXT DEFAULT 'upload'"],
    ["status_processamento", "TEXT DEFAULT 'pendente'"],
    ["tamanho_bytes", "INTEGER DEFAULT 0"],
    ["paginas", "INTEGER"],
  ];

  for (const [name, definition] of additions) {
    if (!names.has(name)) {
      await run(`ALTER TABLE arquivos_pdf ADD COLUMN ${name} ${definition}`);
    }
  }
}

async function ensureTarefaColumns(db) {
  const columns = await tableInfo(db, "tarefas");
  const names = new Set(columns.map((column) => column.name));

  if (!names.has("origem")) {
    await run("ALTER TABLE tarefas ADD COLUMN origem TEXT DEFAULT 'user'");
  }
}

async function ensureLembreteColumns(db) {
  const columns = await tableInfo(db, "lembretes");
  const names = new Set(columns.map((column) => column.name));

  if (!names.has("tipo")) {
    await run("ALTER TABLE lembretes ADD COLUMN tipo TEXT DEFAULT 'event'");
  }

  if (!names.has("origem")) {
    await run("ALTER TABLE lembretes ADD COLUMN origem TEXT DEFAULT 'user'");
  }
}

function toRelativePath(absolutePath) {
  return path.relative(projectRoot, absolutePath).split(path.sep).join("/");
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(date, hour, minute = 0) {
  const yyyyMmDd = formatDate(date);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${yyyyMmDd} ${hh}:${mm}:00`;
}

async function ensureDemoUser() {
  const row = await get("SELECT id FROM user WHERE email = ?", ["aluno@jarvis.local"]);
  if (row) return row;

  const result = await run(
    "INSERT INTO user (nome, email, tipo) VALUES (?, ?, ?)",
    ["Aluno", "aluno@jarvis.local", "aluno"],
  );

  return get("SELECT id FROM user WHERE id = ?", [result.id]);
}

async function seedDemoDocuments(userId) {
  if (!fs.existsSync(rawDir)) return;

  const pdfs = fs.readdirSync(rawDir)
    .filter((filename) => filename.toLowerCase().endsWith(".pdf"))
    .sort();

  for (const filename of pdfs) {
    const pdfPath = path.join(rawDir, filename);
    const mdPath = path.join(processedDir, `${path.basename(filename, ".pdf")}.md`);
    const relativePdfPath = toRelativePath(pdfPath);
    const existing = await get(
      "SELECT id FROM arquivos_pdf WHERE caminho_arquivo = ?",
      [relativePdfPath],
    );

    if (existing) continue;

    const stats = fs.statSync(pdfPath);
    await run(
      `INSERT INTO arquivos_pdf (
        user_id,
        nome_arquivo,
        caminho_arquivo,
        caminho_md,
        source,
        status_processamento,
        tamanho_bytes,
        paginas
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        filename,
        relativePdfPath,
        fs.existsSync(mdPath) ? toRelativePath(mdPath) : null,
        "raw",
        fs.existsSync(mdPath) ? "convertido" : "pendente",
        stats.size,
        null,
      ],
    );
  }
}

async function seedDemoStudentArea(userId) {
  await run("DELETE FROM tarefas WHERE user_id = ? AND origem = 'demo'", [userId]);
  await run("DELETE FROM lembretes WHERE user_id = ? AND origem = 'demo'", [userId]);

  const today = new Date();
  const tasks = [
    {
      titulo: "Revisar materiais de RAG",
      descricao: "Ler os trechos recuperados sobre embeddings e chunking.",
      data_limite: formatDate(addDays(today, 1)),
    },
    {
      titulo: "Resolver exercicios de compiladores",
      descricao: "Gerar perguntas pelo Jarvis e responder usando active recall.",
      data_limite: formatDate(addDays(today, 3)),
    },
    {
      titulo: "Preparar roteiro do video",
      descricao: "Mostrar arquitetura, RAG, tool calling, logs e planejamento.",
      data_limite: formatDate(addDays(today, 5)),
    },
    {
      titulo: "Completar avaliacao com 10 perguntas",
      descricao: "Registrar pergunta, documentos recuperados, resposta e classificacao.",
      data_limite: formatDate(addDays(today, 7)),
    },
  ];

  for (const task of tasks) {
    await run(
      `INSERT INTO tarefas (user_id, titulo, descricao, concluida, data_limite, origem)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, task.titulo, task.descricao, 0, task.data_limite, "demo"],
    );
  }

  const reminders = [
    {
      titulo: "Aula de Inteligencia Artificial",
      descricao: "Revisao de RAG e tool calling.",
      tipo: "class",
      data_hora: formatDateTime(addDays(today, 1), 8, 0),
    },
    {
      titulo: "Entrega parcial do Jarvis",
      descricao: "Validar funcionalidades 3.1, 3.2 e 3.3.",
      tipo: "deadline",
      data_hora: formatDateTime(addDays(today, 2), 23, 59),
    },
    {
      titulo: "Prova de IA",
      descricao: "Usar planejamento de estudos com tarefas, agenda e materiais.",
      tipo: "exam",
      data_hora: formatDateTime(addDays(today, 6), 14, 0),
    },
    {
      titulo: "Sessao de estudo em dupla",
      descricao: "Testar perguntas do RAG e registrar erros encontrados.",
      tipo: "event",
      data_hora: formatDateTime(addDays(today, 4), 19, 30),
    },
  ];

  for (const reminder of reminders) {
    await run(
      `INSERT INTO lembretes (user_id, titulo, descricao, tipo, data_hora, origem)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        reminder.titulo,
        reminder.descricao,
        reminder.tipo,
        reminder.data_hora,
        "demo",
      ],
    );
  }
}

async function seedDemoData() {
  const demoUser = await ensureDemoUser();
  await seedDemoDocuments(demoUser.id);
  await seedDemoStudentArea(demoUser.id);
}

function run(sql, params = []) {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function all(sql, params = []) {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

module.exports = {
  all,
  dbPath,
  get,
  getDatabase,
  initDatabase,
  run,
};
