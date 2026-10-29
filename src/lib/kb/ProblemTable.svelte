<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByCause, uniqueById, type Cause, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  // issues: the ticket filed for each cause, e.g. { parser: 'https://github.com/…/issues/1' }.
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Cause, string>> } = $props();

  const WHAT: Record<Cause, string> = {
    parser: 'Shared parser reads day-first dates month first',
    hint: 'booking-v3 form hint says MM/DD/YYYY to day-first tenants',
    shift: 'Dates move by one day (time zone)',
  };
  // Intake only ever tags these; for any other cause its tag can't match.
  const INTAKE_TAGS: readonly string[] = ['parser', 'hint'];

  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByCause(merged, tenantOf, notes.oneDayMove));
  const mistagged = (g: { cause: string; reports: Report[] }) =>
    INTAKE_TAGS.includes(g.cause) ? g.reports.filter((r) => r.meta.intakeTag !== g.cause).length : '—';
  const issueNo = (url: string) => `#${url.split('/').pop()}`;
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports in #{ticket} ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>intake tagged otherwise</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.cause)}
      <tr class:unplaced={g.cause === 'unplaced'}>
        <td>
          <code>{g.cause}</code>
          {#if g.cause !== 'unplaced'}<br /><span class="what">{WHAT[g.cause]}</span>{/if}
        </td>
        <td>{g.reports.length}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{mistagged(g)}</td>
        <td>
          {#if g.cause !== 'unplaced' && issues[g.cause]}
            <a href={issues[g.cause]}>{issueNo(issues[g.cause]!)}</a>
          {:else}
            <span class="none">none yet</span>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .what { color: var(--muted); font-size: 0.85em; }
  .none, .unplaced td { color: var(--warn); }
</style>
