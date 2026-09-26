const Database = require('better-sqlite3');
const db = new Database('lyra.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    xp INTEGER DEFAULT 0,
    nivel INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS punicoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuarioId TEXT,
    moderadorId TEXT,
    tipo TEXT,
    motivo TEXT,
    data TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS avisos (
    usuarioId TEXT PRIMARY KEY,
    quantidade INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS configuracoes (
    chave TEXT PRIMARY KEY,
    valor TEXT
  );

  CREATE TABLE IF NOT EXISTS recompensas_nivel (
    nivel INTEGER,
    cargoId TEXT,
    mensagem TEXT,
    UNIQUE(nivel, cargoId)
  );

  CREATE TABLE IF NOT EXISTS canais_sem_xp (
    canalId TEXT PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS multiplicador_xp (
    cargoId TEXT PRIMARY KEY,
    multiplicador REAL DEFAULT 1.0
  );
`);

db.getConfig = (chave, padrao = null) => {
  const res = db.prepare('SELECT valor FROM configuracoes WHERE chave = ?').get(chave);
  return res ? res.valor : padrao;
};

db.setConfig = (chave, valor) => {
  db.prepare('REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)').run(chave, valor);
};

module.exports = db;
