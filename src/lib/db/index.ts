import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'seo-studio.json');

interface Database {
  contents: any[];
  templates: any[];
}

let dbCache: Database | null = null;

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadDb(): Database {
  ensureDataDir();

  if (!fs.existsSync(dbPath)) {
    const initialDb: Database = {
      contents: [],
      templates: [],
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }

  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data);
}

function saveDb(db: Database) {
  ensureDataDir();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  dbCache = db;
}

export function getDb(): Database {
  if (!dbCache) {
    dbCache = loadDb();
  }
  return dbCache;
}

export function updateDb(updater: (db: Database) => void) {
  const db = getDb();
  updater(db);
  saveDb(db);
}

export function closeDb(): void {
  dbCache = null;
}
