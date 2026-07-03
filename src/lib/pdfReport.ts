import type { WeekChartPoint } from '../db/repository';
import type { Units } from './format';
import { computeWeekSegments } from './chartMath';

export function buildReportHtml(opts: {
  weeks: WeekChartPoint[];
  units: Units;
  generatedAt: Date;
}): string {
  const { weeks, units, generatedAt } = opts;
  const segments = computeWeekSegments(weeks);
  const dateStr = generatedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const walkSum = weeks.reduce((acc, w) => acc + w.walkDist, 0);
  const ropeSum = weeks.reduce((acc, w) => acc + w.ropeJumps, 0);
  const liftSum = weeks.reduce((acc, w) => acc + w.liftSets, 0);
  const activeDaysSum = weeks.reduce((acc, w) => acc + w.activeDays, 0);

  const maxBarHeight = 120;
  const chartBars = segments
    .map((seg) => {
      const barHeight = Math.max(4, seg.heightPct * maxBarHeight);
      return `
    <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
      <div style="width: 100%; height: ${maxBarHeight}px; background: #F7F9F8; border-radius: 4px; display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden;">
        <div style="width: 100%; height: ${barHeight}px; display: flex; flex-direction: column; justify-content: flex-end;">
          ${seg.walkPct > 0 ? `<div style="width: 100%; height: ${seg.walkPct * 100}%; background: #1F8A70; margin-bottom: 2px;"></div>` : ''}
          ${seg.ropePct > 0 ? `<div style="width: 100%; height: ${seg.ropePct * 100}%; background: #F0682B; margin-bottom: 2px;"></div>` : ''}
          ${seg.liftPct > 0 ? `<div style="width: 100%; height: ${seg.liftPct * 100}%; background: #6655D6;"></div>` : ''}
        </div>
      </div>
      <div style="font-family: 'Courier New', monospace; font-size: 10px; color: #79858E; margin-top: 8px; ${seg.isCurrent ? 'font-weight: bold; color: #161A1D;' : 'font-weight: 500;'}">
        ${seg.label}${seg.isCurrent ? '*' : ''}
      </div>
    </div>
      `;
    })
    .join('');

  const tableRows = [...weeks].reverse()
    .map((w) => {
      return `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #E4E8E9; font-family: monospace; font-size: 12px;">${w.label}</td>
      <td style="padding: 8px; border-bottom: 1px solid #E4E8E9; font-family: monospace; text-align: right;">${w.walkDist.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #E4E8E9; font-family: monospace; text-align: right;">${w.ropeJumps}</td>
      <td style="padding: 8px; border-bottom: 1px solid #E4E8E9; font-family: monospace; text-align: right;">${w.liftSets}</td>
      <td style="padding: 8px; border-bottom: 1px solid #E4E8E9; font-family: monospace; text-align: right;">${w.liftSets > 0 ? '—' : '0'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #E4E8E9; font-family: monospace; text-align: right;">${w.activeDays}</td>
      <td style="padding: 8px; border-bottom: 1px solid #E4E8E9; font-family: monospace; text-align: right;">—</td>
    </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Fit Track Summary Report</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #EFF2F1;
    color: #161A1D;
    padding: 20px;
    margin: 0;
  }
  .container {
    max-width: 900px;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(22, 26, 29, 0.08);
  }
  .header {
    text-align: center;
    margin-bottom: 24px;
    border-bottom: 2px solid #E4E8E9;
    padding-bottom: 16px;
  }
  .brand {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }
  .brand-dot {
    color: #1F8A70;
  }
  h1 {
    font-size: 28px;
    font-weight: 700;
    margin: 8px 0;
    letter-spacing: -0.5px;
  }
  .meta {
    font-size: 12px;
    color: #79858E;
    margin-top: 8px;
  }
  h2 {
    font-size: 18px;
    font-weight: 700;
    margin: 20px 0 12px 0;
    color: #161A1D;
  }
  .totals-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  .stat-box {
    background: #F7F9F8;
    border-radius: 8px;
    padding: 12px;
    text-align: center;
  }
  .stat-label {
    font-size: 11px;
    font-weight: 700;
    color: #79858E;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .stat-value {
    font-family: 'Courier New', monospace;
    font-size: 20px;
    font-weight: 700;
    color: #161A1D;
  }
  .chart-section {
    margin: 20px 0;
  }
  .chart-caption {
    font-size: 12px;
    color: #79858E;
    margin-bottom: 12px;
    line-height: 16px;
  }
  .bars-container {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    margin-bottom: 16px;
    overflow-x: auto;
  }
  .legend {
    display: flex;
    justify-content: space-around;
    gap: 16px;
    padding-top: 12px;
    border-top: 1px solid #E4E8E9;
    margin-bottom: 16px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: #79858E;
  }
  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  th {
    text-align: left;
    font-weight: 700;
    padding: 12px 8px;
    border-bottom: 2px solid #E4E8E9;
    background: #F7F9F8;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #79858E;
  }
  td {
    padding: 8px;
    border-bottom: 1px solid #E4E8E9;
  }
  .footer {
    text-align: center;
    font-size: 11px;
    color: #79858E;
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px solid #E4E8E9;
  }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="brand">Fit<span class="brand-dot">·</span>Track</div>
    <h1>Weekly Summary Report</h1>
    <div class="meta">Generated ${dateStr} · Units: ${units.dist}, ${units.wt}</div>
  </div>

  <h2>Totals — last ${weeks.length} weeks</h2>
  <div class="totals-grid">
    <div class="stat-box">
      <div class="stat-label">Walk</div>
      <div class="stat-value">${walkSum.toFixed(1)}</div>
      <div class="stat-label">${units.dist}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Rope</div>
      <div class="stat-value">${ropeSum}</div>
      <div class="stat-label">jumps</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Strength</div>
      <div class="stat-value">${liftSum}</div>
      <div class="stat-label">sets</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Active Days</div>
      <div class="stat-value">${activeDaysSum}</div>
      <div class="stat-label">/ ${weeks.length * 7}</div>
    </div>
  </div>

  <div class="chart-section">
    <h2>Weekly consistency</h2>
    <div class="chart-caption">Bar height = active days · segments = activity mix</div>
    <div class="bars-container">
      ${chartBars}
    </div>
    <div class="legend">
      <div class="legend-item">
        <div class="legend-dot" style="background: #1F8A70;"></div>
        <span>Walk</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background: #F0682B;"></div>
        <span>Rope jump</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background: #6655D6;"></div>
        <span>Strength</span>
      </div>
    </div>
  </div>

  <h2>Week by week</h2>
  <table>
    <thead>
      <tr>
        <th>Week</th>
        <th style="text-align: right;">Walk</th>
        <th style="text-align: right;">Rope</th>
        <th style="text-align: right;">Lift sets</th>
        <th style="text-align: right;">Lift reps</th>
        <th style="text-align: right;">Active days</th>
        <th style="text-align: right;">Minutes</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    Fit Track · exported ${dateStr}
  </div>
</div>
</body>
</html>`;
}
