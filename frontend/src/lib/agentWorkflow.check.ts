/**
 * Agent workflow self-check (no framework).
 * Run: npx tsx frontend/src/lib/agentWorkflow.check.ts
 */
import {
  findOverlappingAgentTask,
  formatEndOfPromptSummary,
  commitMessageForTask,
  deployTagForTask,
  changelogDeployLine,
} from './agentWorkflow';

const sample = [
  {
    key: 'DEV-29',
    title: 'ClickUp-style nested Sprints folder in Space sidebar',
    status: { category: 'DONE' },
  },
  {
    key: 'DEV-30',
    title: 'Add Deploying and Blocked board statuses for live agent tracking',
    status: { category: 'DONE' },
  },
  {
    key: 'DEV-31',
    title: 'Document agent workflow in Kortex Platform Walkthrough',
    status: { category: 'IN_PROGRESS' },
  },
];

const dup = findOverlappingAgentTask('Add Deploying and Blocked board statuses', sample);
console.assert(dup?.key === 'DEV-30', 'should link DEV-30 instead of creating a duplicate');

const open = findOverlappingAgentTask('Document agent workflow Walkthrough', sample);
console.assert(open?.key === 'DEV-31', 'should prefer open overlapping task');

const summary = formatEndOfPromptSummary({
  tasks: 'DEV-32 (Done)',
  changed: 'agentWorkflow helpers + deploy tagging',
  docs: 'Walkthrough §Agent workflow · Changelog Aug 21',
  deploy: 'https://example.vercel.app · commit abcdef1',
});
console.assert(summary.includes('Tasks: DEV-32'), 'summary must include tasks line');
console.assert(commitMessageForTask('DEV-32', 'Per-task deploy rules').startsWith('DEV-32:'));
console.assert(deployTagForTask('DEV-32', 'abcdef123') === 'DEV-32@abcdef1');
console.assert(
  changelogDeployLine({
    taskKey: 'DEV-32',
    title: 'Per-task deploy rules',
    assignee: 'Cursor',
    commitSha: 'abcdef123456',
    deployUrl: 'https://example.vercel.app',
  }).includes('abcdef1')
);

console.log('agentWorkflow.check: ok');
