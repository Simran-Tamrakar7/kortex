import type { ViewType, Priority, IssueType } from '@kortex/shared';

/** Views that keep filters/search/sort in the URL (DEV-39). */
export const URL_FILTER_VIEWS: ViewType[] = ['LIST', 'BOARD', 'TABLE'];

export type UrlFilterSnapshot = {
  view?: ViewType;
  search?: string;
  priority?: Priority;
  type?: IssueType;
  sprint?: string; // 'backlog' | sprintId
  my?: boolean;
  sort?: string; // e.g. priority | -priority | key | title
};

export function parseUrlFilters(search: string): UrlFilterSnapshot {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const out: UrlFilterSnapshot = {};
  const view = q.get('view') as ViewType | null;
  if (view && URL_FILTER_VIEWS.includes(view)) out.view = view;
  const s = q.get('search');
  if (s) out.search = s;
  const priority = q.get('priority') as Priority | null;
  if (priority && ['URGENT', 'HIGH', 'MEDIUM', 'LOW'].includes(priority)) out.priority = priority;
  const type = q.get('type') as IssueType | null;
  if (type && ['EPIC', 'STORY', 'TASK', 'BUG', 'SUBTASK'].includes(type)) out.type = type;
  const sprint = q.get('sprint');
  if (sprint) out.sprint = sprint;
  if (q.get('my') === '1') out.my = true;
  const sort = q.get('sort');
  if (sort) out.sort = sort;
  return out;
}

export function buildUrlFilters(opts: {
  view: ViewType;
  search: string;
  priorities: Priority[];
  issueTypes: IssueType[];
  sprintId?: string | null;
  onlyMyTasks: boolean;
  sort?: string;
}): string {
  if (!URL_FILTER_VIEWS.includes(opts.view)) return '';
  const q = new URLSearchParams();
  q.set('view', opts.view);
  if (opts.search.trim()) q.set('search', opts.search.trim());
  if (opts.priorities[0]) q.set('priority', opts.priorities[0]);
  if (opts.issueTypes[0]) q.set('type', opts.issueTypes[0]);
  if (opts.sprintId === null) q.set('sprint', 'backlog');
  else if (typeof opts.sprintId === 'string' && opts.sprintId) q.set('sprint', opts.sprintId);
  if (opts.onlyMyTasks) q.set('my', '1');
  if (opts.sort) q.set('sort', opts.sort);
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** Apply client-side sort key from URL (`-field` = desc). */
export function sortTasksByParam<T extends { key?: string; title?: string; priority?: string; order?: number }>(
  tasks: T[],
  sort?: string
): T[] {
  if (!sort) return tasks;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  const priRank: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0;
    if (field === 'priority') cmp = (priRank[a.priority || ''] ?? 9) - (priRank[b.priority || ''] ?? 9);
    else if (field === 'key') cmp = String(a.key || '').localeCompare(String(b.key || ''));
    else if (field === 'title') cmp = String(a.title || '').localeCompare(String(b.title || ''));
    else if (field === 'order') cmp = (a.order ?? 0) - (b.order ?? 0);
    return desc ? -cmp : cmp;
  });
  return sorted;
}
