import type { WeekChartPoint } from '../db/repository';

export type WeekSegments = {
  weekKey: string;
  label: string;
  isCurrent: boolean;
  heightPct: number;
  walkPct: number;
  ropePct: number;
  liftPct: number;
};

export function computeWeekSegments(data: WeekChartPoint[]): WeekSegments[] {
  if (data.length === 0) return [];

  const maxWalk = Math.max(1, Math.max(...data.map((d) => d.walkDist)));
  const maxRope = Math.max(1, Math.max(...data.map((d) => d.ropeJumps)));
  const maxLift = Math.max(1, Math.max(...data.map((d) => d.liftSets)));

  return data.map((d) => {
    const walkShare = d.walkDist / maxWalk;
    const ropeShare = d.ropeJumps / maxRope;
    const liftShare = d.liftSets / maxLift;
    const total = walkShare + ropeShare + liftShare;

    if (total === 0) {
      return {
        weekKey: d.weekKey,
        label: d.label,
        isCurrent: d.isCurrent,
        heightPct: 0,
        walkPct: 0,
        ropePct: 0,
        liftPct: 0,
      };
    }

    return {
      weekKey: d.weekKey,
      label: d.label,
      isCurrent: d.isCurrent,
      heightPct: Math.min(d.activeDays / 7, 1),
      walkPct: walkShare / total,
      ropePct: ropeShare / total,
      liftPct: liftShare / total,
    };
  });
}
