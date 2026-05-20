PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  tipo TEXT DEFAULT 'aluno',
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS arquivos_pdf (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  nome_arquivo TEXT NOT NULL,
  caminho_arquivo TEXT NOT NULL,
  caminho_md TEXT,
  source TEXT DEFAULT 'upload',
  status_processamento TEXT DEFAULT 'pendente',
  tamanho_bytes INTEGER DEFAULT 0,
  paginas INTEGER,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS conversas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  titulo TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS mensagens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversa_id INTEGER,
  remetente TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(conversa_id) REFERENCES conversas(id)
);

CREATE TABLE IF NOT EXISTS tarefas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  titulo TEXT NOT NULL,
  descricao TEXT,
  concluida INTEGER DEFAULT 0,
  data_limite DATE,
  origem TEXT DEFAULT 'user',
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS lembretes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'event',
  data_hora DATETIME NOT NULL,
  origem TEXT DEFAULT 'user',
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES user(id)
);
