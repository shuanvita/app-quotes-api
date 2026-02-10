import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../data/quotes.db'));

// Создаём таблицы
db.exec(`
  CREATE TABLE IF NOT EXISTS authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    bio TEXT,
    quote_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    author_id INTEGER,
    length INTEGER,
    FOREIGN KEY (author_id) REFERENCES authors(id)
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quote_tags (
    quote_id INTEGER,
    tag_id INTEGER,
    FOREIGN KEY (quote_id) REFERENCES quotes(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id),
    PRIMARY KEY (quote_id, tag_id)
  );
`);

export default db;