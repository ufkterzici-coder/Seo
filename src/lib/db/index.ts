import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import {
  CREATE_CONTENTS_TABLE,
  CREATE_TEMPLATES_TABLE,
  CREATE_ANALYTICS_TABLE,
  CREATE_INDEXES,
} from './schema';

const DB_PATH = path.join(process.cwd(), 'data', 'seo-studio.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Initialize tables
  db.exec(CREATE_CONTENTS_TABLE);
  db.exec(CREATE_TEMPLATES_TABLE);
  db.exec(CREATE_ANALYTICS_TABLE);

  // Create indexes
  CREATE_INDEXES.forEach((indexQuery) => {
    db!.exec(indexQuery);
  });

  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
