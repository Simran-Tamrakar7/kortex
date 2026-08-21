/** Self-check: sprint filter never leaks other sprints. Run: npx tsx src/lib/sprintFilter.check.ts */

function filterBySprint<T extends { sprintId?: string | null }>(
  tasks: T[],
  sprintId: string | null | undefined
): T[] {
  if (sprintId === undefined) return tasks;
  if (sprintId === null) return tasks.filter((t) => !t.sprintId);
  return tasks.filter((t) => t.sprintId === sprintId);
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`sprintFilter.check: ${msg}`);
}

const sample = [
  { id: '1', sprintId: 'sp_1' },
  { id: '2', sprintId: 'sp_2' },
  { id: '3', sprintId: 'sp_3' },
  { id: '4', sprintId: null },
];

assert(filterBySprint(sample, 'sp_1').map((t) => t.id).join() === '1', 'sprint 1 only');
assert(filterBySprint(sample, 'sp_3').every((t) => t.sprintId === 'sp_3'), 'sprint 3 only');
assert(filterBySprint(sample, null).map((t) => t.id).join() === '4', 'backlog only');
assert(filterBySprint(sample, undefined).length === 4, 'all when undefined');

console.log('sprintFilter.check: ok');
