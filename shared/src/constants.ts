import { Priority, IssueType, StatusCategory } from './types';

export const DEFAULT_PRIORITIES: { key: Priority; label: string; color: string; icon: string }[] = [
  { key: 'URGENT', label: 'Urgent', color: '#ef4444', icon: 'AlertOctagon' },
  { key: 'HIGH', label: 'High', color: '#f97316', icon: 'ArrowUp' },
  { key: 'MEDIUM', label: 'Medium', color: '#eab308', icon: 'Equal' },
  { key: 'LOW', label: 'Low', color: '#64748b', icon: 'ArrowDown' },
];

export const DEFAULT_ISSUE_TYPES: { key: IssueType; label: string; color: string; icon: string }[] = [
  { key: 'EPIC', label: 'Epic', color: '#a855f7', icon: 'Zap' },
  { key: 'STORY', label: 'Story', color: '#22c55e', icon: 'Bookmark' },
  { key: 'TASK', label: 'Task', color: '#3b82f6', icon: 'CheckSquare' },
  { key: 'SUBTASK', label: 'Subtask', color: '#06b6d4', icon: 'GitCommit' },
  { key: 'BUG', label: 'Bug', color: '#ef4444', icon: 'AlertTriangle' },
];

export const DEFAULT_STATUS_CATEGORIES: { key: StatusCategory; label: string; defaultColor: string }[] = [
  { key: 'TODO', label: 'To Do', defaultColor: '#64748b' },
  { key: 'IN_PROGRESS', label: 'In Progress', defaultColor: '#3b82f6' },
  { key: 'IN_REVIEW', label: 'In Review', defaultColor: '#f59e0b' },
  { key: 'DONE', label: 'Done', defaultColor: '#10b981' },
];

export const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21];
export const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const;

export const SOCKET_EVENTS = {
  // Connection & Room
  JOIN_WORKSPACE: 'join:workspace',
  LEAVE_WORKSPACE: 'leave:workspace',
  JOIN_PROJECT: 'join:project',
  LEAVE_PROJECT: 'leave:project',
  JOIN_TASK: 'join:task',
  LEAVE_TASK: 'leave:task',

  // Presence
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_SYNC: 'presence:sync',
  USER_TYPING: 'user:typing',

  // Real-time entity changes
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_MOVED: 'task:moved',
  SPRINT_UPDATED: 'sprint:updated',
  COMMENT_ADDED: 'comment:added',
  ACTIVITY_LOGGED: 'activity:logged',
  NOTIFICATION_RECEIVED: 'notification:received',
  DOC_UPDATED: 'doc:updated',
} as const;
