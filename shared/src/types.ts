export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST' | 'VIEWER';

export type ProjectType = 'SOFTWARE_SCRUM' | 'SOFTWARE_KANBAN' | 'BUSINESS' | 'SERVICE_DESK';

export type IssueType = 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK' | 'BUG';

export type Priority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type StatusCategory = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export type DependencyType = 'BLOCKS' | 'BLOCKED_BY' | 'RELATES_TO' | 'DUPLICATES';

export type SprintStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED';

export type CustomFieldType = 
  | 'TEXT'
  | 'NUMBER'
  | 'DROPDOWN'
  | 'CHECKBOX'
  | 'DATE'
  | 'CURRENCY'
  | 'FORMULA'
  | 'USER_PICKER';

export type ViewType = 
  | 'OVERVIEW'
  | 'LIST' 
  | 'BOARD' 
  | 'BACKLOG' 
  | 'CALENDAR' 
  | 'GANTT' 
  | 'WORKLOAD' 
  | 'MINDMAP' 
  | 'TABLE';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  timezone?: string;
  workingHours?: {
    start: string; // e.g. "09:00"
    end: string;   // e.g. "17:00"
    daysOfWeek: number[]; // [1,2,3,4,5]
    dailyCapacityHours: number;
  };
  notificationPreferences?: {
    emailDigest: boolean;
    taskAssigned: boolean;
    taskMentioned: boolean;
    statusChanged: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: 'FREE' | 'TEAM' | 'BUSINESS' | 'ENTERPRISE';
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members?: OrgMember[];
  workspaces?: Workspace[];
}

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  role: Role;
  user?: User;
  invitedEmail?: string;
  inviteStatus: 'ACCEPTED' | 'PENDING';
  createdAt: string;
}

export interface Workspace {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  folders?: Folder[];
  projects?: Project[];
  members?: WorkspaceMember[];
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  user?: User;
  createdAt: string;
}

export interface Folder {
  id: string;
  workspaceId: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  projects?: Project[];
}

export interface Project {
  id: string;
  workspaceId: string;
  folderId?: string;
  name: string;
  key: string; // e.g. "KOR"
  type: ProjectType;
  description?: string;
  icon?: string;
  leadId?: string;
  lead?: User;
  leadName?: string;
  estimationType: 'STORY_POINTS_FIBONACCI' | 'STORY_POINTS_TSHIRT' | 'HOURS';
  createdAt: string;
  updatedAt: string;
  statuses?: Status[];
  views?: ViewConfig[];
  customFields?: CustomFieldDefinition[];
  sprints?: Sprint[];
  slaConfig?: SLAConfig;
}

export interface Status {
  id: string;
  projectId: string;
  name: string;
  category: StatusCategory;
  color: string;
  order: number;
  wipLimit?: number;
  allowedTransitionIds?: string[];
}

export interface CustomFieldDefinition {
  id: string;
  projectId: string;
  name: string;
  type: CustomFieldType;
  options?: string[]; // for DROPDOWN
  formulaExpression?: string; // for FORMULA
  currencyCode?: string; // for CURRENCY e.g. "USD", "EUR"
  isRequired?: boolean;
}

export interface CustomFieldValue {
  id: string;
  taskId: string;
  fieldId: string;
  value: any; // string, number, boolean, array, etc.
}

export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface RecurringConfig {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  intervalDays?: number;
  dayOfWeek?: number;
  timeOfDay?: string;
  nextRunDate?: string;
}

export interface Task {
  id: string;
  key: string; // e.g. "KOR-42"
  projectId: string;
  title: string;
  description?: string;
  issueType: IssueType;
  priority: Priority;
  statusId: string;
  status?: Status;
  reporterId: string;
  reporter?: User;
  assignees?: User[];
  assigneeIds?: string[];
  sprintId?: string;
  sprint?: Sprint;
  epicId?: string;
  epic?: Task;
  parentId?: string;
  parent?: Task;
  subtasks?: Task[];
  storyPoints?: number;
  tShirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  timeEstimateMinutes?: number;
  timeSpentMinutes?: number;
  startDate?: string;
  dueDate?: string;
  labels?: string[];
  checklists?: ChecklistItem[];
  customFieldValues?: Record<string, any>;
  order: number;
  recurringConfig?: RecurringConfig;
  watcherIds?: string[];
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  dependencies?: TaskDependencyItem[];
  commentsCount?: number;
  attachmentsCount?: number;
  slaBreached?: boolean;
  slaRemainingMinutes?: number;
}

export interface TaskDependencyItem {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  type: DependencyType;
  dependsOnTask?: {
    id: string;
    key: string;
    title: string;
    statusId: string;
    priority: Priority;
  };
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: SprintStatus;
  completedAt?: string;
  totalPoints?: number;
  completedPoints?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentReaction {
  emoji: string;
  userIds: string[];
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
  parentId?: string; // For threaded comments
  content: string;
  reactions?: CommentReaction[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  uploaderId: string;
  uploader?: User;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'TASK_ASSIGNED' | 'MENTIONED' | 'STATUS_CHANGED' | 'DUE_SOON' | 'SLA_BREACH' | 'SYSTEM';
  entityType?: 'TASK' | 'PROJECT' | 'COMMENT' | 'DOC';
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Doc {
  id: string;
  workspaceId: string;
  projectId?: string;
  title: string;
  content: string;
  icon?: string;
  coverUrl?: string;
  authorId: string;
  author?: User;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationTrigger {
  type: 'STATUS_CHANGED' | 'ASSIGNEE_ADDED' | 'DUE_DATE_PASSED' | 'TASK_CREATED' | 'PRIORITY_CHANGED';
  config?: Record<string, any>;
}

export interface AutomationCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'IS_EMPTY' | 'IS_NOT_EMPTY';
  value: any;
}

export interface AutomationAction {
  type: 'SET_STATUS' | 'SET_ASSIGNEE' | 'SET_PRIORITY' | 'ADD_LABEL' | 'SEND_NOTIFICATION' | 'POST_COMMENT';
  config: Record<string, any>;
}

export interface AutomationRule {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
  durationMinutes: number;
  description?: string;
  billable: boolean;
  date: string;
  createdAt: string;
}

export interface ViewFilter {
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'notIn' | 'between' | 'isEmpty';
  value: any;
}

export interface ViewConfig {
  id: string;
  projectId: string;
  name: string;
  type: ViewType;
  isDefault?: boolean;
  groupBy?: 'status' | 'assignee' | 'priority' | 'epic' | 'none';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: ViewFilter[];
  visibleColumns?: string[];
  swimlane?: 'none' | 'assignee' | 'epic' | 'priority';
  wipLimitsEnabled?: boolean;
}

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  type: 
    | 'BURNDOWN' 
    | 'STATUS_PIE' 
    | 'PRIORITY_BAR' 
    | 'WORKLOAD' 
    | 'VELOCITY' 
    | 'OVERDUE' 
    | 'TIME_TRACKING' 
    | 'RECENT_ACTIVITY'
    | 'CUMULATIVE_FLOW';
  x: number;
  y: number;
  w: number;
  h: number;
  settings?: Record<string, any>;
}

export interface Dashboard {
  id: string;
  orgId?: string;
  projectId?: string;
  name: string;
  widgets: DashboardWidgetConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface SLAConfig {
  id: string;
  projectId: string;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  priorityModifiers?: Record<Priority, number>;
}

export interface Webhook {
  id: string;
  projectId: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export interface UserPresence {
  userId: string;
  name: string;
  avatarUrl?: string;
  currentLocation?: {
    projectId?: string;
    taskId?: string;
    view?: ViewType;
  };
  lastSeen: string;
}

export interface AuthResponse {
  user: User;
  organization: Organization;
  workspaces: Workspace[];
  token: string;
  refreshToken: string;
}
