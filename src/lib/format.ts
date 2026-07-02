import { Entry } from '../db/repository';
import { ACTIVITY } from '../theme/theme';

export type Units = { dist: 'km' | 'mi'; wt: 'kg' | 'lb' };

export function entryTitle(e: Entry): string {
  if (e.type === 'lift') return e.name || 'Strength';
  return ACTIVITY[e.type].name;
}

export function entrySub(e: Entry): string {
  if (e.type === 'walk') {
    const p: string[] = [];
    if (e.mins) p.push(`${e.mins} min`);
    if (e.steps) p.push(`${e.steps} steps`);
    return p.join(' · ') || 'Walk';
  }
  if (e.type === 'rope') {
    const p: string[] = [];
    if (e.mins) p.push(`${e.mins} min`);
    if (e.sets) p.push(`${e.sets} sets`);
    return p.join(' · ') || 'Rope jump';
  }
  return e.weighted ? `Weighted · ${e.sets} sets` : `Bodyweight · ${e.sets} sets`;
}

export function entryValue(e: Entry, u: Units): { v: string; u: string } {
  if (e.type === 'walk') return { v: String(trim(e.dist || 0)), u: u.dist };
  if (e.type === 'rope') return { v: String(e.jumps || 0), u: 'jumps' };
  if (e.weighted) return { v: `${e.sets}×${e.reps}`, u: `@${e.weight}${u.wt}` };
  return { v: `${e.sets}×${e.reps}`, u: 'reps' };
}

export function trim(n: number): number {
  return Number.isInteger(n) ? n : Math.round(n * 100) / 100;
}
