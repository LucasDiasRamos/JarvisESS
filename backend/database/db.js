const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "..", "jarvis.db");
const schemaPath = path.join(__dirname, "schema.sql");

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

      resolve(db);
    });
  });
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
