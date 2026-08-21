/** Self-check for URL filter encode/decode. Run: npx tsx src/lib/urlFilters.check.ts */
import { parseUrlFilters, buildUrlFilters, sortTasksByParam, URL_FILTER_VIEWS } from './urlFilters';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`urlFilters.check: ${msg}`);
}

assert(URL_FILTER_VIEWS.includes('BOARD'), 'BOARD is url view');
const qs = buildUrlFilters({
  view: 'BOARD',
  search: 'auth',
  priorities: ['HIGH'],
  issueTypes: [],
  sprintId: undefined,
  onlyMyTasks: false,
  sort: 'priority',
});
assert(qs.includes('search=auth'), 'encodes search');
assert(qs.includes('priority=HIGH'), 'encodes priority');
const parsed = parseUrlFilters(qs);
assert(parsed.search === 'auth', 'parses search');
assert(parsed.priority === 'HIGH', 'parses priority');
assert(parsed.sort === 'priority', 'parses sort');

const sorted = sortTasksByParam(
  [
    { key: 'A-2', priority: 'LOW' },
    { key: 'A-1', priority: 'URGENT' },
  ],
  'priority'
);
assert(sorted[0].key === 'A-1', 'sorts urgent first');

console.log('urlFilters.check: ok');
