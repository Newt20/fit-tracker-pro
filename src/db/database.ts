import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Open once and run migrations. Everything else awaits this.
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('moveledger.db');
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS entries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT    NOT NULL,           -- 'YYYY-MM-DD'
      type       TEXT    NOT NULL,           -- 'walk' | 'rope' | 'lift'
      dist       REAL    DEFAULT 0,
      mins       INTEGER DEFAULT 0,
      steps      INTEGER DEFAULT 0,
      jumps      INTEGER DEFAULT 0,
      sets       INTEGER DEFAULT 0,
      reps       INTEGER DEFAULT 0,
      weighted   INTEGER DEFAULT 0,
      weight     REAL    DEFAULT 0,
      name       TEXT    DEFAULT '',
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);

    CREATE TABLE IF NOT EXISTS summaries (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      week_key    TEXT    NOT NULL UNIQUE,    -- 'YYYY-Www'
      start_date  TEXT    NOT NULL,
      end_date    TEXT    NOT NULL,
      walk_dist   REAL    DEFAULT 0,
      rope_jumps  INTEGER DEFAULT 0,
      lift_sets   INTEGER DEFAULT 0,
      lift_reps   INTEGER DEFAULT 0,
      total_mins  INTEGER DEFAULT 0,
      active_days INTEGER DEFAULT 0,
      dist_unit   TEXT    DEFAULT 'km',
      wt_unit     TEXT    DEFAULT 'kg',
      archived    INTEGER DEFAULT 0,          -- 1 once raw rows are cleared
      created_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}
