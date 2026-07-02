// All dates are stored as 'YYYY-MM-DD' strings (local time).

export const pad = (n: number) => String(n).padStart(2, '0');

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function fmtNice(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function fmtShort(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ISO week (Monday start). Returns the week key plus the Monday/Sunday bounds.
export function isoWeek(input: Date): { key: string; monday: Date; sunday: Date } {
  const t = new Date(input);
  t.setHours(0, 0, 0, 0);
  const dow = (t.getDay() + 6) % 7; // Mon = 0
  const monday = addDays(t, -dow);
  const sunday = addDays(monday, 6);
  const thursday = addDays(monday, 3);
  const jan1 = new Date(thursday.getFullYear(), 0, 1);
  const week = Math.ceil(((+thursday - +jan1) / 86400000 + 1) / 7);
  return { key: `${thursday.getFullYear()}-W${pad(week)}`, monday, sunday };
}

// Every 'YYYY-MM-DD' between two dates, inclusive.
export function datesBetween(startKey: string, endKey: string): string[] {
  const out: string[] = [];
  let d = parseKey(startKey);
  const end = parseKey(endKey);
  while (d <= end) {
    out.push(dateKey(d));
    d = addDays(d, 1);
  }
  return out;
}
