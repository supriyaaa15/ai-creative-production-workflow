import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'data', 'app.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS pipelines (
  id TEXT PRIMARY KEY,
  graph_json TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  pipeline_id TEXT NOT NULL REFERENCES pipelines(id),
  status TEXT NOT NULL DEFAULT 'pending',
  total_items INTEGER NOT NULL,
  completed_items INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS creative_briefs (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  goal TEXT,
  audience TEXT,
  style TEXT,
  platform TEXT,
  variant_count INTEGER NOT NULL DEFAULT 2,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_items (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  input_filename TEXT NOT NULL,
  input_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_item_variants (
  id TEXT PRIMARY KEY,
  job_item_id TEXT NOT NULL REFERENCES job_items(id),
  variant_index INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  node_progress TEXT NOT NULL DEFAULT '{}',
  image_url TEXT,
  caption TEXT,
  creative_direction TEXT,
  score REAL,
  recommendation TEXT,
  keep INTEGER NOT NULL DEFAULT 1,
  error TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Dynamic column migrations for SQLite
const existingCols = db.prepare("PRAGMA table_info(job_item_variants)").all().map(c => c.name);
if (!existingCols.includes('creative_direction')) {
  db.exec("ALTER TABLE job_item_variants ADD COLUMN creative_direction TEXT");
}
if (!existingCols.includes('score')) {
  db.exec("ALTER TABLE job_item_variants ADD COLUMN score REAL");
}
if (!existingCols.includes('recommendation')) {
  db.exec("ALTER TABLE job_item_variants ADD COLUMN recommendation TEXT");
}

const briefCols = db.prepare("PRAGMA table_info(creative_briefs)").all().map(c => c.name);
if (!briefCols.includes('selected_direction')) {
  db.exec("ALTER TABLE creative_briefs ADD COLUMN selected_direction TEXT");
}

export default db;
