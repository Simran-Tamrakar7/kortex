/**
 * Agent workflow helpers — Cursor / Antigravity contract.
 * Status pipeline mirrors DEV/KOR board columns.
 */

export const AGENT_STATUS = {
  todo: { id: 'st_todo', name: 'To Do', category: 'TODO' as const },
  inProgress: { id: 'st_inprogress', name: 'In Progress', category: 'IN_PROGRESS' as const },
  inReview: { id: 'st_review', name: 'In Review', category: 'IN_REVIEW' as const },
  deploying: { id: 'st_deploying', name: 'Deploying', category: 'DEPLOYING' as const },
  blocked: { id: 'st_blocked', name: 'Blocked', category: 'BLOCKED' as const },
  done: { id: 'st_done', name: 'Done', category: 'DONE' as const },
} as const;

export const AGENT_STATUS_PIPELINE = [
  AGENT_STATUS.todo,
  AGENT_STATUS.inProgress,
  AGENT_STATUS.inReview,
  AGENT_STATUS.deploying,
  AGENT_STATUS.done,
] as const;

/** Normalize for overlap checks */
export function normalizeTaskTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find an open or recently-done task that overlaps the ask.
 * Returns the best match so agents can link instead of duplicating.
 */
export function findOverlappingAgentTask<
  T extends { key: string; title: string; statusId?: string; status?: { category?: string } },
>(askTitle: string, tasks: T[], lookbackDone = 12): T | null {
  const needle = normalizeTaskTitle(askTitle);
  if (!needle) return null;

  const tokens = new Set(needle.split(' ').filter((t) => t.length > 2));
  let best: { task: T; score: number } | null = null;

  for (const task of tasks) {
    const hay = normalizeTaskTitle(task.title);
    if (!hay) continue;
    const cat = task.status?.category || '';
    const isOpen = cat !== 'DONE';
    // allow recent dones via caller slice; we still score all given
    let score = 0;
    if (hay === needle) score = 100;
    else if (hay.includes(needle) || needle.includes(hay)) score = 80;
    else {
      const hayTokens = hay.split(' ');
      let hit = 0;
      for (const t of tokens) if (hayTokens.includes(t)) hit += 1;
      score = tokens.size ? (hit / tokens.size) * 60 : 0;
    }
    if (!isOpen) score *= 0.85; // prefer open, but still surface recent Done
    if (score >= 45 && (!best || score > best.score)) best = { task, score };
  }

  return best?.task ?? null;
}

export function commitMessageForTask(taskKey: string, summary: string): string {
  const clean = summary.replace(/\s+/g, ' ').trim();
  return `${taskKey}: ${clean}`;
}

/** Deploy meta tag / git note — trace which task introduced a build */
export function deployTagForTask(taskKey: string, shortSha?: string): string {
  return shortSha ? `${taskKey}@${shortSha.slice(0, 7)}` : taskKey;
}

export type PromptSummaryLine = {
  tasks: string; // e.g. "DEV-30 (Done) · DEV-31 (Done)"
  changed: string;
  docs: string;
  deploy: string; // url or failed + commit
};

export function formatEndOfPromptSummary(s: PromptSummaryLine): string {
  return [`Tasks: ${s.tasks}`, `Changed: ${s.changed}`, `Docs: ${s.docs}`, `Deploy: ${s.deploy}`].join('\n');
}

export function changelogDeployLine(opts: {
  taskKey: string;
  title: string;
  assignee: string;
  commitSha?: string;
  deployUrl?: string;
  blocked?: boolean;
}): string {
  const status = opts.blocked ? 'Blocked' : 'Done';
  const deploy = opts.deployUrl ? ` · deploy ${opts.deployUrl}` : '';
  const commit = opts.commitSha ? ` · \`${opts.commitSha.slice(0, 7)}\`` : '';
  return `- 🟢 **[${opts.taskKey}]** ${opts.title} — **${status}** · **${opts.assignee}**${commit}${deploy}`;
}
