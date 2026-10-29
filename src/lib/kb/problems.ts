// What #4471 holds once each report goes to the bug that produced it. causes.ts is the desk's rule;
// this adds the one problem that rule can't see: reports where the date moved by one day, not a
// day/month swap. The desk listed them in desk-notes.json and still filed them under `parser`.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'shift';

export const PROBLEMS: Record<Problem, string> = {
  parser: 'Shared parser reads day-first dates month first',
  hint: 'booking-v3 form hint says MM/DD/YYYY to day-first tenants',
  shift: 'Dates move by one day (time zone)',
};

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem | null {
  if (oneDayMove.includes(r.id)) return 'shift';
  return causeOf(r, t);
}

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  tenants: string[];
  firstSeen: string;
  lastSeen: string;
  // Reports intake tagged as something else than this problem.
  mistagged: number;
};

export function groupByProblem(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const byProblem = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of uniqueById(all).filter((r) => r.mergedInto === ticket)) {
    const p = problemOf(r, tenantOf(r), oneDayMove) ?? 'unplaced';
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
        mistagged: rs.filter((r) => r.meta.intakeTag !== problem).length,
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
