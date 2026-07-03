import { getDb } from './database';
import { datesBetween, parseKey, pad } from '../lib/dates';
import type { ActivityType } from '../theme/theme';

export type Entry = {
  id: number;
  date: string;
  type: ActivityType;
  dist: number;
  mins: number;
  steps: number;
  jumps: number;
  sets: number;
  reps: number;
  weighted: number; // 0 | 1
  weight: number;
  name: string;
  created_at: number;
};

export type NewEntry = Omit<Entry, 'id' | 'created_at'>;

export type Summary = {
  id: number;
  week_key: string;
  start_date: string;
  end_date: string;
  walk_dist: number;
  rope_jumps: number;
  lift_sets: number;
  lift_reps: number;
  total_mins: number;
  active_days: number;
  dist_unit: string;
  wt_unit: string;
  archived: number;
  created_at: number;
};

// ---------- entries ----------

export async function addEntry(e: NewEntry): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO entries (date,type,dist,mins,steps,jumps,sets,reps,weighted,weight,name,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      e.date, e.type, e.dist, e.mins, e.steps, e.jumps,
      e.sets, e.reps, e.weighted, e.weight, e.name, Date.now(),
    ]
  );
}

export async function getEntriesByDate(date: string): Promise<Entry[]> {
  const db = await getDb();
  return db.getAllAsync<Entry>(
    'SELECT * FROM entries WHERE date = ? ORDER BY created_at ASC',
    [date]
  );
}

export async function deleteEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
}

// ---------- calendar ----------

// Returns { 'YYYY-MM-DD': ['walk','rope'] } for one month — used to draw dots.
export async function getMonthIndex(
  year: number,
  month0: number
): Promise<Record<string, ActivityType[]>> {
  const db = await getDb();
  const prefix = `${year}-${pad(month0 + 1)}-%`;
  const rows = await db.getAllAsync<{ date: string; type: ActivityType }>(
    'SELECT DISTINCT date, type FROM entries WHERE date LIKE ?',
    [prefix]
  );
  const out: Record<string, ActivityType[]> = {};
  for (const r of rows) (out[r.date] ??= []).push(r.type);
  return out;
}

// Dates inside summarized weeks (so the calendar can mark archived days).
export async function getSummarizedDates(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ start_date: string; end_date: string }>(
    'SELECT start_date, end_date FROM summaries'
  );
  const s = new Set<string>();
  for (const r of rows) for (const d of datesBetween(r.start_date, r.end_date)) s.add(d);
  return s;
}

// ---------- totals ----------

export type Totals = {
  walkDist: number;
  ropeJumps: number;
  liftSets: number;
  liftReps: number;
  totalMins: number;
  activeDays: number;
};

export type WeekChartPoint = {
  weekKey: string;
  label: string;
  startDate: string;
  endDate: string;
  walkDist: number;
  ropeJumps: number;
  liftSets: number;
  activeDays: number;
  isCurrent: boolean;
};

export async function getTotals(startDate: string, endDate: string): Promise<Totals> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    `SELECT
        COALESCE(SUM(dist),0)                                    AS walkDist,
        COALESCE(SUM(jumps),0)                                   AS ropeJumps,
        COALESCE(SUM(CASE WHEN type='lift' THEN sets END),0)     AS liftSets,
        COALESCE(SUM(CASE WHEN type='lift' THEN sets*reps END),0) AS liftReps,
        COALESCE(SUM(mins),0)                                    AS totalMins,
        COUNT(DISTINCT date)                                     AS activeDays
     FROM entries WHERE date BETWEEN ? AND ?`,
    [startDate, endDate]
  );
  return {
    walkDist: row?.walkDist ?? 0,
    ropeJumps: row?.ropeJumps ?? 0,
    liftSets: row?.liftSets ?? 0,
    liftReps: row?.liftReps ?? 0,
    totalMins: row?.totalMins ?? 0,
    activeDays: row?.activeDays ?? 0,
  };
}

export async function rangeHasData(startDate: string, endDate: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM entries WHERE date BETWEEN ? AND ?',
    [startDate, endDate]
  );
  return (row?.n ?? 0) > 0;
}

// ---------- summaries ----------

export async function getSummaries(): Promise<Summary[]> {
  const db = await getDb();
  return db.getAllAsync<Summary>('SELECT * FROM summaries ORDER BY start_date DESC');
}

export async function isWeekSummarized(weekKey: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM summaries WHERE week_key = ?',
    [weekKey]
  );
  return (row?.n ?? 0) > 0;
}

export async function summarizeWeek(
  weekKey: string,
  startDate: string,
  endDate: string,
  distUnit: string,
  wtUnit: string
): Promise<void> {
  const db = await getDb();
  const t = await getTotals(startDate, endDate);
  await db.runAsync(
    `INSERT OR IGNORE INTO summaries
       (week_key,start_date,end_date,walk_dist,rope_jumps,lift_sets,lift_reps,
        total_mins,active_days,dist_unit,wt_unit,archived,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?)`,
    [
      weekKey, startDate, endDate, t.walkDist, t.ropeJumps, t.liftSets,
      t.liftReps, t.totalMins, t.activeDays, distUnit, wtUnit, Date.now(),
    ]
  );
}

// Free up space: delete the day-by-day rows for every non-archived summary,
// then mark those summaries archived. Totals already live in `summaries`.
export async function cleanupSummarized(): Promise<number> {
  const db = await getDb();
  const open = await db.getAllAsync<Summary>(
    'SELECT * FROM summaries WHERE archived = 0'
  );
  let cleared = 0;
  for (const s of open) {
    const res = await db.runAsync(
      'DELETE FROM entries WHERE date BETWEEN ? AND ?',
      [s.start_date, s.end_date]
    );
    cleared += res.changes ?? 0;
    await db.runAsync('UPDATE summaries SET archived = 1 WHERE id = ?', [s.id]);
  }
  return cleared;
}

export async function summaryHasRawRows(s: Summary): Promise<boolean> {
  return rangeHasData(s.start_date, s.end_date);
}

// ---------- settings (key/value) ----------

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

// ---------- danger zone ----------

export async function wipeAll(): Promise<void> {
  const db = await getDb();
  await db.execAsync('DELETE FROM entries; DELETE FROM summaries; DELETE FROM settings;');
}

// Convenience for export
export async function dumpAll() {
  const db = await getDb();
  const entries = await db.getAllAsync<Entry>('SELECT * FROM entries');
  const summaries = await db.getAllAsync<Summary>('SELECT * FROM summaries');
  const settings = await db.getAllAsync<{ key: string; value: string }>('SELECT * FROM settings');
  return { entries, summaries, settings };
}

export async function getWeeklyChartData(weeks: number = 8): Promise<WeekChartPoint[]> {
  const { isoWeek, dateKey, fmtShort, parseKey, addDays } = require('../lib/dates');
  const sums = await getSummaries();
  const result: WeekChartPoint[] = [];

  const now = new Date();
  const thisW = isoWeek(now);
  const thisKey = thisW.key;
  const hasThisWeekSummary = sums.some((s) => s.week_key === thisKey);

  if (!hasThisWeekSummary) {
    const start = dateKey(thisW.monday);
    const end = dateKey(thisW.sunday);
    const hasData = await rangeHasData(start, end);
    if (hasData) {
      const t = await getTotals(start, end);
      result.push({
        weekKey: thisKey,
        label: fmtShort(thisW.monday),
        startDate: start,
        endDate: end,
        walkDist: t.walkDist,
        ropeJumps: t.ropeJumps,
        liftSets: t.liftSets,
        activeDays: t.activeDays,
        isCurrent: true,
      });
    }
  }

  for (const s of sums) {
    if (result.length >= weeks) break;
    result.push({
      weekKey: s.week_key,
      label: fmtShort(parseKey(s.start_date)),
      startDate: s.start_date,
      endDate: s.end_date,
      walkDist: s.walk_dist,
      ropeJumps: s.rope_jumps,
      liftSets: s.lift_sets,
      activeDays: s.active_days,
      isCurrent: false,
    });
  }

  return result.reverse();
}

export { parseKey };
