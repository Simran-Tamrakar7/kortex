import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { Task, Project, Sprint, Doc, AutomationRule, Notification, TimeEntry, Workspace } from '@kortex/shared';

// Fallback Mock Data for standalone / Vercel demo preview
const mockWorkspaces: any[] = [
  {
    id: 'ws_dev',
    orgId: 'org_acme',
    name: 'Product Development',
    slug: 'product-dev',
    icon: 'Layers',
    color: '#6366f1',
    folders: [
      {
        id: 'fld_kortex_core',
        name: 'Kortex Platform',
        color: '#6366f1',
        projects: [
          {
            id: 'proj_dev',
            name: 'Kortex',
            key: 'DEV',
            type: 'SOFTWARE_SCRUM',
          },
        ],
      },
    ],
    projects: [
      {
        id: 'proj_dev',
        name: 'Kortex',
        key: 'DEV',
        type: 'SOFTWARE_SCRUM',
      },
    ],
  },
  {
    id: 'ws_eng',
    orgId: 'org_acme',
    name: 'Engineering & Architecture',
    slug: 'eng-arch',
    icon: 'Cpu',
    color: '#3b82f6',
    folders: [],
    projects: [
      {
        id: 'proj_kor',
        name: 'Kortex Cloud Infrastructure',
        key: 'KOR',
        type: 'SOFTWARE_SCRUM',
      },
    ],
  },
  {
    id: 'ws_ops',
    orgId: 'org_acme',
    name: 'Operations & IT Support',
    slug: 'ops-it',
    icon: 'LifeBuoy',
    color: '#10b981',
    folders: [],
    projects: [
      {
        id: 'proj_its',
        name: 'IT Support & Cloud Operations',
        key: 'ITS',
        type: 'SERVICE_DESK',
      },
    ],
  },
];

const mockProjectDev: any = {
  id: 'proj_dev',
  name: 'Kortex',
  key: 'DEV',
  type: 'SOFTWARE_SCRUM',
  description: 'Next-generation all-in-one work management platform combining Jira and ClickUp parity with AI workflows',
  leadId: 'usr_alex',
  statuses: [
    { id: 'st_backlog', name: 'Backlog', category: 'TODO', color: '#64748b', order: 0 },
    { id: 'st_todo', name: 'To Do', category: 'TODO', color: '#3b82f6', order: 1, wipLimit: 10 },
    { id: 'st_inprogress', name: 'In Progress', category: 'IN_PROGRESS', color: '#8b5cf6', order: 2, wipLimit: 6 },
    { id: 'st_review', name: 'In Review', category: 'IN_REVIEW', color: '#f59e0b', order: 3, wipLimit: 4 },
    { id: 'st_deploying', name: 'Deploying', category: 'DEPLOYING', color: '#06b6d4', order: 4, wipLimit: 3 },
    { id: 'st_blocked', name: 'Blocked', category: 'BLOCKED', color: '#ef4444', order: 5 },
    { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981', order: 6 },
  ],
  customFields: [
    { id: 'cf_1', name: 'Severity Level', type: 'DROPDOWN' },
    { id: 'cf_2', name: 'Target Release', type: 'TEXT' },
  ],
};

const mockProjectKor: any = {
  id: 'proj_kor',
  name: 'Kortex Cloud Infrastructure',
  key: 'KOR',
  type: 'SOFTWARE_SCRUM',
  description: 'Scalable distributed work management engine with real-time sync and automation',
  leadId: 'usr_alex',
  statuses: [
    { id: 'st_backlog', name: 'Backlog', category: 'TODO', color: '#64748b', order: 0 },
    { id: 'st_todo', name: 'To Do', category: 'TODO', color: '#3b82f6', order: 1, wipLimit: 8 },
    { id: 'st_inprogress', name: 'In Progress', category: 'IN_PROGRESS', color: '#8b5cf6', order: 2, wipLimit: 5 },
    { id: 'st_review', name: 'In Review', category: 'IN_REVIEW', color: '#f59e0b', order: 3, wipLimit: 4 },
    { id: 'st_deploying', name: 'Deploying', category: 'DEPLOYING', color: '#06b6d4', order: 4, wipLimit: 3 },
    { id: 'st_blocked', name: 'Blocked', category: 'BLOCKED', color: '#ef4444', order: 5 },
    { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981', order: 6 },
  ],
};

const mockSprints: any[] = [
  {
    id: 'sp_dev_0',
    projectId: 'proj_dev',
    name: 'Sprint 0',
    goal: 'Audit codebase, fix key collisions, persist timers, and add server RBAC',
    status: 'COMPLETED',
    totalPoints: 37,
    completedPoints: 37,
    startDate: new Date('2026-01-12').toISOString(),
    endDate: new Date('2026-01-25').toISOString(),
  },
  {
    id: 'sp_dev_1',
    projectId: 'proj_dev',
    name: 'Sprint 1',
    goal: 'Rebuild 4-level mind map, Confluence markdown editor, and workflow automations',
    status: 'COMPLETED',
    totalPoints: 13,
    completedPoints: 13,
    startDate: new Date('2026-01-26').toISOString(),
    endDate: new Date('2026-02-08').toISOString(),
  },
  {
    id: 'sp_dev_2',
    projectId: 'proj_dev',
    name: 'Sprint 2',
    goal: 'Ship server-side AI task summaries, subtask generator, writing assistant & natural language task creation',
    status: 'ACTIVE',
    totalPoints: 38,
    completedPoints: 8,
    startDate: new Date('2026-02-09').toISOString(),
    endDate: new Date('2026-02-22').toISOString(),
  },
  {
    id: 'sp_dev_3',
    projectId: 'proj_dev',
    name: 'Sprint 3',
    goal: 'Confluence page tree hierarchy, advanced search syntax, and portfolio timeline',
    status: 'PLANNING',
    totalPoints: 24,
    completedPoints: 0,
    startDate: new Date('2026-02-23').toISOString(),
    endDate: new Date('2026-03-08').toISOString(),
  },
  // Kortex Cloud Infrastructure (KOR) — ClickUp-style dated sprints
  {
    id: 'sp_kor_1',
    projectId: 'proj_kor',
    name: 'Sprint 1',
    goal: 'Infra baseline & CI hardening',
    status: 'COMPLETED',
    totalPoints: 21,
    completedPoints: 21,
    startDate: new Date('2026-01-26').toISOString(),
    endDate: new Date('2026-02-01').toISOString(),
  },
  {
    id: 'sp_kor_2',
    projectId: 'proj_kor',
    name: 'Sprint 2',
    goal: 'Realtime sync & caching layer',
    status: 'ACTIVE',
    totalPoints: 18,
    completedPoints: 8,
    startDate: new Date('2026-02-02').toISOString(),
    endDate: new Date('2026-02-08').toISOString(),
  },
  {
    id: 'sp_kor_3',
    projectId: 'proj_kor',
    name: 'Sprint 3',
    goal: 'Observability & alerting',
    status: 'ACTIVE',
    totalPoints: 13,
    completedPoints: 6,
    startDate: new Date('2026-02-09').toISOString(),
    endDate: new Date('2026-02-15').toISOString(),
  },
  {
    id: 'sp_kor_4',
    projectId: 'proj_kor',
    name: 'Sprint 4',
    goal: 'Multi-region failover dry-run',
    status: 'ACTIVE',
    totalPoints: 8,
    completedPoints: 1,
    startDate: new Date('2026-02-16').toISOString(),
    endDate: new Date('2026-02-22').toISOString(),
  },
  {
    id: 'sp_kor_5',
    projectId: 'proj_kor',
    name: 'Sprint 5',
    goal: 'Cost optimization pass',
    status: 'PLANNING',
    totalPoints: 5,
    completedPoints: 0,
    startDate: new Date('2026-02-23').toISOString(),
    endDate: new Date('2026-03-01').toISOString(),
  },
  {
    id: 'sp_kor_6',
    projectId: 'proj_kor',
    name: 'Sprint 6',
    goal: 'Edge CDN rollout',
    status: 'PLANNING',
    totalPoints: 8,
    completedPoints: 0,
    startDate: new Date('2026-03-09').toISOString(),
    endDate: new Date('2026-03-15').toISOString(),
  },
  {
    id: 'sp_kor_7',
    projectId: 'proj_kor',
    name: 'Sprint 7',
    goal: 'Secret rotation automation',
    status: 'PLANNING',
    totalPoints: 5,
    completedPoints: 0,
    startDate: new Date('2026-03-16').toISOString(),
    endDate: new Date('2026-03-22').toISOString(),
  },
  {
    id: 'sp_kor_8',
    projectId: 'proj_kor',
    name: 'Sprint 8',
    goal: 'DR game day & runbooks',
    status: 'PLANNING',
    totalPoints: 24,
    completedPoints: 0,
    startDate: new Date('2026-03-23').toISOString(),
    endDate: new Date('2026-03-29').toISOString(),
  },
];

const mockTasksSeed: any[] = [
  // Epics
  {
    id: 't_epic_core',
    key: 'DEV-EPIC-1',
    projectId: 'proj_dev',
    title: 'Core Engine Stability, Architecture & Real-Time Sync',
    description: 'Data integrity, robust task key generation, RBAC permission enforcement, and timer persistence.',
    issueType: 'EPIC',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_0',
    storyPoints: 26,
    order: 0,
    labels: ['Architecture', 'Engine', 'RBAC'],
    assignees: [{ id: 'usr_alex', name: 'Alex Rivera', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_epic_ui',
    key: 'DEV-EPIC-2',
    projectId: 'proj_dev',
    title: '8-View Interactive Canvas, Docs Markdown & Design System',
    description: 'Kanban WIP highlights, 4-level pan/zoom Mind Map, Confluence markdown renderer, and universal typography scaling.',
    issueType: 'EPIC',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_1',
    storyPoints: 34,
    order: 1,
    labels: ['UI/UX', 'MindMap', 'Docs'],
    assignees: [{ id: 'usr_jordan', name: 'Jordan Smith', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_epic_ai',
    key: 'DEV-EPIC-3',
    projectId: 'proj_dev',
    title: 'Phase 2: AI Intelligence Engine & Atlassian Parity Hub',
    description: 'Server-side task summarization, subtask generation, writing assistant, natural language parsing, and workspace Q&A search.',
    issueType: 'EPIC',
    priority: 'URGENT',
    statusId: 'st_inprogress',
    status: { id: 'st_inprogress', name: 'In Progress', category: 'IN_PROGRESS', color: '#8b5cf6' },
    sprintId: 'sp_dev_2',
    storyPoints: 38,
    order: 2,
    labels: ['AI', 'LLM', 'Gemini'],
    assignees: [{ id: 'usr_alex', name: 'Alex Rivera', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }],
  },

  // Tasks in Sprint 0 (Completed)
  {
    id: 't_dev_1',
    key: 'DEV-1',
    projectId: 'proj_dev',
    epicId: 't_epic_core',
    title: 'Task Key Collision Prevention & Numeric Suffix Parsing',
    description: 'Replace count()+1 with max numeric suffix query to prevent duplicate key constraint crashes on deleted tasks.',
    issueType: 'BUG',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_0',
    storyPoints: 3,
    order: 3,
    labels: ['Backend', 'Stability', 'Bug'],
    assignees: [{ id: 'usr_maya', name: 'Maya Lin', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_2',
    key: 'DEV-2',
    projectId: 'proj_dev',
    epicId: 't_epic_core',
    title: 'API Route Aliases for Reactions, Dashboards & Notifications',
    description: 'Support POST/PUT on /comments/:id/reactions and /dashboards/analytics to resolve client-server route mismatches.',
    issueType: 'TASK',
    priority: 'MEDIUM',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_0',
    storyPoints: 2,
    order: 4,
    labels: ['API', 'Routes'],
    assignees: [{ id: 'usr_devon', name: 'Devon Vance', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_3',
    key: 'DEV-3',
    projectId: 'proj_dev',
    epicId: 't_epic_ui',
    title: 'Task Detail Modal Interactive File Attachment Dropzone & Thumbnail Preview',
    description: 'Add drag-and-drop file upload, file list with download links, file size formatting, and image thumbnail viewer in task drawer.',
    issueType: 'STORY',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_0',
    storyPoints: 5,
    order: 5,
    labels: ['UI', 'Attachments', 'Modal'],
    assignees: [{ id: 'usr_jordan', name: 'Jordan Smith', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_4',
    key: 'DEV-4',
    projectId: 'proj_dev',
    epicId: 't_epic_ui',
    title: 'Inline Subtasks Tree & Parent-Child Linkage Engine',
    description: 'Add subtasks list in task detail drawer with completion checkboxes, progress bar, inline quick-add, and subtask navigation.',
    issueType: 'STORY',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_0',
    storyPoints: 5,
    order: 6,
    labels: ['Hierarchy', 'Subtasks'],
    assignees: [{ id: 'usr_jordan', name: 'Jordan Smith', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_5',
    key: 'DEV-5',
    projectId: 'proj_dev',
    epicId: 't_epic_ui',
    title: 'Task Dependencies Selector (Blocks, Is Blocked By, Relates To)',
    description: 'Interactive issue linker supporting dependency types and clickable badge navigators in task drawer.',
    issueType: 'STORY',
    priority: 'MEDIUM',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_0',
    storyPoints: 3,
    order: 7,
    labels: ['Dependencies', 'Graph'],
    assignees: [{ id: 'usr_maya', name: 'Maya Lin', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_6',
    key: 'DEV-6',
    projectId: 'proj_dev',
    epicId: 't_epic_ui',
    title: '@Mentions Teammate Autocomplete in Comments & Reaction Emojis',
    description: 'Dropdown menu appears when typing @ in comments to tag teammates with interactive emoji reaction pills.',
    issueType: 'STORY',
    priority: 'MEDIUM',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_0',
    storyPoints: 3,
    order: 8,
    labels: ['Comments', 'Mentions', 'Reactions'],
    assignees: [{ id: 'usr_alex', name: 'Alex Rivera', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_7',
    key: 'DEV-7',
    projectId: 'proj_dev',
    epicId: 't_epic_ui',
    title: 'Saved Filter Presets Toolbar (High Priority, My Tasks, Bugs, Epics)',
    description: 'Add 1-click filter preset pills and active filter reset button in ViewTabs.',
    issueType: 'STORY',
    priority: 'MEDIUM',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_0',
    storyPoints: 3,
    order: 9,
    labels: ['Filters', 'Presets'],
    assignees: [{ id: 'usr_jordan', name: 'Jordan Smith', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_8',
    key: 'DEV-8',
    projectId: 'proj_dev',
    epicId: 't_epic_ui',
    title: '100% Theme Token Refactor for Table, Gantt, Calendar & Modals',
    description: 'Eliminate hardcoded dark colors and ensure 100% clean contrast in both Light Mode and Dark Mode.',
    issueType: 'TASK',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_0',
    storyPoints: 5,
    order: 10,
    labels: ['Theming', 'DesignSystem', 'WCAG'],
    assignees: [{ id: 'usr_jordan', name: 'Jordan Smith', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_9',
    key: 'DEV-9',
    projectId: 'proj_dev',
    epicId: 't_epic_core',
    title: 'In-App Floating Real-Time Toast Notification System',
    description: 'Build ToastManager.tsx with single-fire SLA breach alerts and socket task update notifications.',
    issueType: 'STORY',
    priority: 'MEDIUM',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_0',
    storyPoints: 3,
    order: 11,
    labels: ['Toast', 'Notifications', 'RealTime'],
    assignees: [{ id: 'usr_devon', name: 'Devon Vance', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_10',
    key: 'DEV-10',
    projectId: 'proj_dev',
    epicId: 't_epic_core',
    title: 'Active Timer LocalStorage Persistence & Background Drift Recovery',
    description: 'Persist active stopwatch timer across browser refreshes, tab sleep, and page switches without losing elapsed seconds.',
    issueType: 'BUG',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_0',
    storyPoints: 3,
    order: 12,
    labels: ['Timer', 'Stopwatch', 'Bug'],
    assignees: [{ id: 'usr_maya', name: 'Maya Lin', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_14',
    key: 'DEV-14',
    projectId: 'proj_dev',
    epicId: 't_epic_core',
    title: 'Server-Side Role-Based Access Control (RBAC) Enforcement',
    description: 'Add requireRoles middleware on administrative endpoints preventing unauthorized actions by Guest/Viewer accounts.',
    issueType: 'TASK',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_0',
    storyPoints: 5,
    order: 13,
    labels: ['Security', 'RBAC', 'Auth'],
    assignees: [{ id: 'usr_devon', name: 'Devon Vance', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }],
  },

  // Tasks in Sprint 1 (Completed)
  {
    id: 't_dev_11',
    key: 'DEV-11',
    projectId: 'proj_dev',
    epicId: 't_epic_ui',
    title: 'Rebuild 4-Level Hierarchical Mind Map with Infinite Pan & Zoom',
    description: 'Rebuild mind map tree: Project Root -> Epics -> Stories -> Subtasks with drag-pan canvas and zoom controls.',
    issueType: 'STORY',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_1',
    storyPoints: 5,
    order: 14,
    labels: ['MindMap', 'Canvas', 'UI'],
    assignees: [{ id: 'usr_jordan', name: 'Jordan Smith', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_12',
    key: 'DEV-12',
    projectId: 'proj_dev',
    epicId: 't_epic_ui',
    title: 'Confluence-Grade Markdown Parser & Rich Editor with Live Split Preview',
    description: 'Parse headings, lists, blockquotes, code blocks, tables, and task checkboxes with Preview, Edit Raw, and Split modes.',
    issueType: 'STORY',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_1',
    storyPoints: 5,
    order: 15,
    labels: ['Docs', 'Markdown', 'Editor'],
    assignees: [{ id: 'usr_alex', name: 'Alex Rivera', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_13',
    key: 'DEV-13',
    projectId: 'proj_dev',
    epicId: 't_epic_core',
    title: 'Workflow Automation Rule Pipeline Alignment & Conflict Tracking',
    description: 'Audit trigger-condition-action pipeline display and add execution loop prevention with conflict tracking.',
    issueType: 'TASK',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_1',
    storyPoints: 3,
    order: 16,
    labels: ['Automations', 'Workflow', 'Engine'],
    assignees: [{ id: 'usr_devon', name: 'Devon Vance', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }],
  },

  // Tasks in Sprint 2 (Active - AI Features)
  {
    id: 't_dev_15',
    key: 'DEV-15',
    projectId: 'proj_dev',
    epicId: 't_epic_ai',
    title: 'Phase 2 Part A: Server-Side AI Intelligence Engine Architecture',
    description: 'Multi-provider LLM integration (Gemini/OpenAI/Offline NLP) powering 7 intelligent API endpoints.',
    issueType: 'STORY',
    priority: 'URGENT',
    statusId: 'st_inprogress',
    status: { id: 'st_inprogress', name: 'In Progress', category: 'IN_PROGRESS', color: '#8b5cf6' },
    sprintId: 'sp_dev_2',
    storyPoints: 13,
    order: 17,
    labels: ['AI', 'LLM', 'Core'],
    assignees: [
      { id: 'usr_alex', name: 'Alex Rivera', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr_jordan', name: 'Jordan Smith', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    ],
  },
  {
    id: 't_dev_17',
    key: 'DEV-17',
    projectId: 'proj_dev',
    epicId: 't_epic_ai',
    title: 'AI Task Detail Summarization Drawer Action',
    description: 'Condense threaded comments and activity stream into an executive 2-3 sentence AI summary.',
    issueType: 'STORY',
    priority: 'HIGH',
    statusId: 'st_inprogress',
    status: { id: 'st_inprogress', name: 'In Progress', category: 'IN_PROGRESS', color: '#8b5cf6' },
    sprintId: 'sp_dev_2',
    storyPoints: 5,
    order: 18,
    labels: ['AI', 'Summarization', 'Drawer'],
    assignees: [{ id: 'usr_alex', name: 'Alex Rivera', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_18',
    key: 'DEV-18',
    projectId: 'proj_dev',
    epicId: 't_epic_ai',
    title: 'AI Subtask Checklist Generator Modal',
    description: 'Decompose task title & description into actionable subtasks with editable checklist before saving.',
    issueType: 'STORY',
    priority: 'HIGH',
    statusId: 'st_todo',
    status: { id: 'st_todo', name: 'To Do', category: 'TODO', color: '#3b82f6' },
    sprintId: 'sp_dev_2',
    storyPoints: 5,
    order: 19,
    labels: ['AI', 'Subtasks', 'Generator'],
    assignees: [{ id: 'usr_jordan', name: 'Jordan Smith', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_19',
    key: 'DEV-19',
    projectId: 'proj_dev',
    epicId: 't_epic_ai',
    title: 'AI Inline Writing Assistant (Rewrite, Expand, Shorten, Fix Grammar)',
    description: 'Inline floating sparkler toolbar in rich text editors to polish and adjust tone.',
    issueType: 'STORY',
    priority: 'MEDIUM',
    statusId: 'st_todo',
    status: { id: 'st_todo', name: 'To Do', category: 'TODO', color: '#3b82f6' },
    sprintId: 'sp_dev_2',
    storyPoints: 5,
    order: 20,
    labels: ['AI', 'WritingAssist', 'Editor'],
    assignees: [{ id: 'usr_maya', name: 'Maya Lin', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_20',
    key: 'DEV-20',
    projectId: 'proj_dev',
    epicId: 't_epic_ai',
    title: 'Natural Language Plain-English Task Parser (Cmd+K)',
    description: 'Accept plain sentences (e.g. "Create high priority bug for Alex due next Monday") and extract structured parameters.',
    issueType: 'STORY',
    priority: 'HIGH',
    statusId: 'st_todo',
    status: { id: 'st_todo', name: 'To Do', category: 'TODO', color: '#3b82f6' },
    sprintId: 'sp_dev_2',
    storyPoints: 5,
    order: 21,
    labels: ['AI', 'NLParser', 'CommandPalette'],
    assignees: [{ id: 'usr_jordan', name: 'Jordan Smith', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_21',
    key: 'DEV-21',
    projectId: 'proj_dev',
    epicId: 't_epic_ai',
    title: 'AI Sprint Retrospective & Daily Standup Digest',
    description: 'Synthesize velocity metrics, blocker items, and achievements into executive sprint notes.',
    issueType: 'STORY',
    priority: 'MEDIUM',
    statusId: 'st_todo',
    status: { id: 'st_todo', name: 'To Do', category: 'TODO', color: '#3b82f6' },
    sprintId: 'sp_dev_2',
    storyPoints: 5,
    order: 22,
    labels: ['AI', 'Retro', 'Standup'],
    assignees: [{ id: 'usr_priya', name: 'Priya Patel', role: 'QA Lead', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' } as any],
  },

  // Tasks in Sprint 3 (Planning)
  {
    id: 't_dev_16',
    key: 'DEV-16',
    projectId: 'proj_dev',
    epicId: 't_epic_ai',
    title: 'Phase 2 Part B: Confluence Page Nesting, Portfolio Roadmap & Whiteboards',
    description: 'Confluence page tree hierarchy with drag-and-drop page nesting, cross-project portfolio timeline, and freeform whiteboard canvas.',
    issueType: 'STORY',
    priority: 'HIGH',
    statusId: 'st_backlog',
    status: { id: 'st_backlog', name: 'Backlog', category: 'TODO', color: '#64748b' },
    sprintId: 'sp_dev_3',
    storyPoints: 8,
    order: 23,
    labels: ['Docs', 'Hierarchy', 'Roadmap'],
    assignees: [{ id: 'usr_maya', name: 'Maya Lin', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_23',
    key: 'DEV-23',
    projectId: 'proj_dev',
    epicId: 't_epic_ai',
    title: 'Advanced Search Syntax Engine (status:done assignee:alex)',
    description: 'Support advanced tokenized search queries across tasks, docs, and comments in Command Palette.',
    issueType: 'STORY',
    priority: 'MEDIUM',
    statusId: 'st_backlog',
    status: { id: 'st_backlog', name: 'Backlog', category: 'TODO', color: '#64748b' },
    sprintId: 'sp_dev_3',
    storyPoints: 5,
    order: 24,
    labels: ['Search', 'CommandPalette', 'Tokens'],
    assignees: [{ id: 'usr_devon', name: 'Devon Vance', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_24',
    key: 'DEV-24',
    projectId: 'proj_dev',
    epicId: 't_epic_ai',
    title: 'Portfolio Cross-Project Milestone Roadmap Timeline',
    description: 'Rollup epics and key deliverables across multiple workspaces into a high-level Gantt roadmap view.',
    issueType: 'STORY',
    priority: 'HIGH',
    statusId: 'st_backlog',
    status: { id: 'st_backlog', name: 'Backlog', category: 'TODO', color: '#64748b' },
    sprintId: 'sp_dev_3',
    storyPoints: 8,
    order: 25,
    labels: ['Roadmap', 'Portfolio', 'Milestones'],
    assignees: [{ id: 'usr_alex', name: 'Alex Rivera', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_25',
    key: 'DEV-25',
    projectId: 'proj_dev',
    epicId: 't_epic_ai',
    title: 'Freeform Collaborative Whiteboard Canvas with Task Cards',
    description: 'Infinite visual whiteboard for brainstorming diagrams, sticky notes, and 1-click converting shapes to Kortex tasks.',
    issueType: 'STORY',
    priority: 'MEDIUM',
    statusId: 'st_backlog',
    status: { id: 'st_backlog', name: 'Backlog', category: 'TODO', color: '#64748b' },
    sprintId: 'sp_dev_3',
    storyPoints: 8,
    order: 26,
    labels: ['Whiteboard', 'Canvas', 'Ideation'],
    assignees: [{ id: 'usr_jordan', name: 'Jordan Smith', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }],
  },

  // Agent work log (Cursor & Antigravity) — status always mirrors what agents shipped
  {
    id: 't_epic_agents',
    key: 'DEV-EPIC-AGENTS',
    projectId: 'proj_dev',
    title: 'Agent Work Log — Cursor & Antigravity',
    description:
      'All autonomous agent turns are tracked here. Live statuses: To Do → In Progress → In Review → Deploying → Done (or Blocked).',
    issueType: 'EPIC',
    priority: 'HIGH',
    statusId: 'st_inprogress',
    status: { id: 'st_inprogress', name: 'In Progress', category: 'IN_PROGRESS', color: '#8b5cf6' },
    sprintId: 'sp_dev_1',
    storyPoints: 21,
    order: 27,
    labels: ['Agents', 'Cursor', 'Antigravity'],
    assignees: [
      { id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' },
      { id: 'usr_antigravity', name: 'Antigravity', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=antigravity' },
    ],
  },
  {
    id: 't_dev_26',
    key: 'DEV-26',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'Standardize fonts and text sizes to readable defaults',
    description:
      'Set 16px browser-standard rem base, clamp size controls to 14–18px, replace hardcoded 10/11px text with rem-based text-xs, bump chart labels.',
    issueType: 'TASK',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_1',
    storyPoints: 3,
    order: 28,
    labels: ['Typography', 'UI', 'Cursor'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
  {
    id: 't_dev_27',
    key: 'DEV-27',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'Create agent users Cursor & Antigravity + deploy work tracking',
    description:
      'Seed/login users cursor@kortex.dev and antigravity@kortex.dev. Every agent change is logged as a DEV task with the correct status and assignee, then deployed.',
    issueType: 'TASK',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_1',
    storyPoints: 5,
    order: 29,
    labels: ['Agents', 'Seed', 'Deploy', 'Cursor'],
    assignees: [
      { id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' },
      { id: 'usr_antigravity', name: 'Antigravity', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=antigravity' },
    ],
  },
  {
    id: 't_dev_28',
    key: 'DEV-28',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: '[Agent queue] Next Cursor / Antigravity turn',
    description: 'Placeholder: move to In Progress when an agent starts work; close as Done when shipped & deployed.',
    issueType: 'TASK',
    priority: 'MEDIUM',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_1',
    storyPoints: 3,
    order: 30,
    labels: ['Agents', 'Queue'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
  {
    id: 't_dev_29',
    key: 'DEV-29',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'ClickUp-style nested Sprints folder in Space sidebar',
    description:
      'Under Spaces & Projects, each Scrum list gets a collapsible "{List} Sprints" dropdown with Sprint N (MM/DD - MM/DD) rows, green play/check icons, counts, urgency badges, and docs updated in the Platform Guide.',
    issueType: 'STORY',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_1',
    storyPoints: 5,
    order: 31,
    labels: ['Sidebar', 'Sprints', 'ClickUp', 'Cursor'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
  // Prompt: tighten agent workflow rules (statuses, auto-task, docs, deploy)
  {
    id: 't_dev_30',
    key: 'DEV-30',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'Add Deploying and Blocked board statuses for live agent tracking',
    description:
      'Originating request: tighten agent Rule 1 with granular stages To Do → In Progress → In Review → Deploying → Done (or Blocked). Rename Code Review → In Review; add Deploying + Blocked columns on DEV/KOR boards.',
    issueType: 'TASK',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_2',
    storyPoints: 3,
    order: 32,
    labels: ['Agents', 'Statuses', 'Kanban', 'Cursor'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
  {
    id: 't_dev_31',
    key: 'DEV-31',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'Document agent workflow in Kortex Platform Walkthrough',
    description:
      'Originating request: every prompt auto-creates DEV tasks before work; docs stay in sync; end-of-prompt summary format; living Walkthrough spec (no batching docs to the end).',
    issueType: 'TASK',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_2',
    storyPoints: 5,
    order: 33,
    labels: ['Docs', 'Walkthrough', 'Agents', 'Cursor'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
  {
    id: 't_dev_32',
    key: 'DEV-32',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'Per-task deploy rules: one commit, verify, tag, changelog as deploy history',
    description:
      'Originating request: deploy after every change; self-check before Deploying; no Done on failed deploy; rollback/Blocked on broken prod; version/task-ID tags; duplicate-task link preference.',
    issueType: 'TASK',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_2',
    storyPoints: 5,
    order: 34,
    labels: ['Deploy', 'Vercel', 'Agents', 'Cursor'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
  {
    id: 't_kor_1',
    key: 'KOR-1',
    projectId: 'proj_kor',
    title: 'CI pipeline hardening for release channels',
    description: 'Stabilize GitHub Actions matrix for staging and production deploys.',
    issueType: 'TASK',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_kor_1',
    storyPoints: 5,
    order: 1,
    labels: ['CI', 'Infra'],
    assignees: [{ id: 'usr_devon', name: 'Devon Vance', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_kor_2',
    key: 'KOR-2',
    projectId: 'proj_kor',
    title: 'Realtime sync cache invalidation',
    description: 'Fix stale presence rooms after project switch.',
    issueType: 'BUG',
    priority: 'URGENT',
    statusId: 'st_inprogress',
    status: { id: 'st_inprogress', name: 'In Progress', category: 'IN_PROGRESS', color: '#8b5cf6' },
    sprintId: 'sp_kor_2',
    storyPoints: 3,
    order: 2,
    labels: ['Realtime', 'Cache'],
    assignees: [{ id: 'usr_maya', name: 'Maya Lin', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_kor_3',
    key: 'KOR-3',
    projectId: 'proj_kor',
    title: 'Prometheus alert rules for API p99',
    description: 'Add burn-rate alerts for /api/tasks latency.',
    issueType: 'STORY',
    priority: 'HIGH',
    statusId: 'st_todo',
    status: { id: 'st_todo', name: 'To Do', category: 'TODO', color: '#3b82f6' },
    sprintId: 'sp_kor_3',
    storyPoints: 5,
    order: 3,
    labels: ['Observability'],
    assignees: [{ id: 'usr_devon', name: 'Devon Vance', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_kor_4',
    key: 'KOR-4',
    projectId: 'proj_kor',
    title: 'Multi-region failover dry-run checklist',
    description: 'Document and execute DR tabletop for us-east failover.',
    issueType: 'TASK',
    priority: 'MEDIUM',
    statusId: 'st_todo',
    status: { id: 'st_todo', name: 'To Do', category: 'TODO', color: '#3b82f6' },
    sprintId: 'sp_kor_4',
    storyPoints: 2,
    order: 4,
    labels: ['DR'],
    assignees: [{ id: 'usr_alex', name: 'Alex Rivera', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_dev_33',
    key: 'DEV-33',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'Fix all sprints showing the same tasks',
    description:
      'Originating request: all sprints show same tasks — change that. Root: Kanban local sprint select ignores sidebar filters.sprintId; useTasks mock ignores projectId/sprintId params; sidebar count fell back to totalPoints.',
    issueType: 'BUG',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_2',
    storyPoints: 3,
    order: 35,
    labels: ['Bug', 'Sprints', 'Kanban', 'Cursor'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
  {
    id: 't_dev_34',
    key: 'DEV-34',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'QA audit: state persistence across refresh and rapid actions',
    description: 'Originating request: QA audit — create/reorder/switch views, refresh, confirm nothing lost; no races on rapid actions. Fix bugs found only.',
    issueType: 'TASK',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_2',
    storyPoints: 5,
    order: 36,
    labels: ['QA', 'Persistence', 'Cursor'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
  {
    id: 't_dev_41',
    key: 'DEV-41',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'Bug: active project/view/filters lost on page refresh',
    description:
      'Found in DEV-34 QA: activeProjectId, activeView, activeMainSection, and filters are in-memory only — refresh resets board context.',
    issueType: 'BUG',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_2',
    storyPoints: 3,
    order: 43,
    labels: ['Bug', 'Persistence', 'Cursor'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
  {
    id: 't_dev_42',
    key: 'DEV-42',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'Bug: offline demo task create/reorder lost on refresh',
    description:
      'Found in DEV-34 QA: mockTasks mutations (create/update/delete) live only in memory on Vercel/static fallback — refresh restores seed data.',
    issueType: 'BUG',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_2',
    storyPoints: 3,
    order: 44,
    labels: ['Bug', 'Persistence', 'OfflineDemo', 'Cursor'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
  {
    id: 't_dev_35',
    key: 'DEV-35',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'QA audit: drag-and-drop across Kanban, Backlog, Timeline',
    description: 'Originating request: QA DnD — empty column drops, rapid reorder, tablet width. Fix bugs found only.',
    issueType: 'TASK',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_2',
    storyPoints: 5,
    order: 37,
    labels: ['QA', 'DnD', 'Cursor'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
  {
    id: 't_dev_36',
    key: 'DEV-36',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'QA audit: CRUD edge cases (empty/long titles, HTML paste, special chars)',
    description: 'Originating request: QA CRUD edge cases — empty titles, long text overflow, pasted HTML/markdown injection, special characters.',
    issueType: 'TASK',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_dev_2',
    storyPoints: 5,
    order: 38,
    labels: ['QA', 'CRUD', 'Security', 'Cursor'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
  {
    id: 't_dev_37',
    key: 'DEV-37',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'QA audit: keyboard navigation and accessibility',
    description: 'Originating request: full keyboard-only flow; focus trapping and ARIA on Task Detail Drawer and Command Palette.',
    issueType: 'TASK',
    priority: 'HIGH',
    statusId: 'st_todo',
    status: { id: 'st_todo', name: 'To Do', category: 'TODO', color: '#3b82f6' },
    sprintId: 'sp_dev_2',
    storyPoints: 5,
    order: 39,
    labels: ['QA', 'a11y', 'Cursor'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
  {
    id: 't_dev_38',
    key: 'DEV-38',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'QA audit: performance with 100+ seeded tasks',
    description: 'Originating request: seed 100+ tasks; check frame drops on drag, search, filter. Fix perf bugs found.',
    issueType: 'TASK',
    priority: 'MEDIUM',
    statusId: 'st_todo',
    status: { id: 'st_todo', name: 'To Do', category: 'TODO', color: '#3b82f6' },
    sprintId: 'sp_dev_2',
    storyPoints: 5,
    order: 40,
    labels: ['QA', 'Performance', 'Cursor'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
  {
    id: 't_dev_39',
    key: 'DEV-39',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'URL-persisted filters on List, Kanban, and Spreadsheet views',
    description:
      'Originating request: persist filters/search/sort in URL query (?priority=high&search=auth) for bookmarkable/shareable filtered views.',
    issueType: 'STORY',
    priority: 'HIGH',
    statusId: 'st_todo',
    status: { id: 'st_todo', name: 'To Do', category: 'TODO', color: '#3b82f6' },
    sprintId: 'sp_dev_2',
    storyPoints: 5,
    order: 41,
    labels: ['Filters', 'URL', 'Cursor'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
  {
    id: 't_dev_40',
    key: 'DEV-40',
    projectId: 'proj_dev',
    epicId: 't_epic_agents',
    title: 'Generate .cursorrules for stack, patterns, and agent workflow',
    description:
      'Originating request: root .cursorrules capturing tech stack, folder conventions, component/Tailwind/Zustand patterns, and standing task/deploy/doc-sync rules.',
    issueType: 'TASK',
    priority: 'MEDIUM',
    statusId: 'st_todo',
    status: { id: 'st_todo', name: 'To Do', category: 'TODO', color: '#3b82f6' },
    sprintId: 'sp_dev_2',
    storyPoints: 3,
    order: 42,
    labels: ['Cursor', 'Docs', 'Tooling'],
    assignees: [{ id: 'usr_cursor', name: 'Cursor', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor' }],
  },
];

// Offline/Vercel demo: persist mock task mutations across refresh (DEV-42)
const MOCK_TASKS_KEY = 'kortex_mock_tasks';
function loadPersistedMockTasks(): any[] {
  try {
    const raw = localStorage.getItem(MOCK_TASKS_KEY);
    if (!raw) return mockTasksSeed.map((t) => ({ ...t }));
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    /* ignore */
  }
  return mockTasksSeed.map((t) => ({ ...t }));
}
let mockTasks: any[] = loadPersistedMockTasks();
function persistMockTasks() {
  try {
    localStorage.setItem(MOCK_TASKS_KEY, JSON.stringify(mockTasks));
  } catch {
    /* quota */
  }
}

const mockDocs: any[] = [
  {
    id: 'doc_changelog',
    workspaceId: 'ws_dev',
    projectId: 'proj_dev',
    title: 'Kortex Changelog',
    icon: 'Sparkles',
    content: `# Kortex Platform Changelog & Sprint Release History

All engineering tasks, bug fixes, and feature milestones are documented below with direct task IDs and sprint tags.

Agent logins: \`cursor@kortex.dev\` · \`antigravity@kortex.dev\` (password \`password123\`). Agents always create/update DEV tasks to match real status, then deploy.

---

## 🤖 Agent Work Log — Cursor & Antigravity
*Status: ACTIVE*

### 📅 August 21, 2026
- 🟢 **[DEV-26]** Standardize fonts and text sizes to readable defaults — **Done** · **Cursor**
- 🟢 **[DEV-27]** Create agent users Cursor & Antigravity + deploy work tracking — **Done** · **Cursor**, **Antigravity**
- 🟢 **[DEV-28]** [Agent queue] Next Cursor / Antigravity turn — **Done** · **Cursor**
- 🟢 **[DEV-29]** ClickUp-style nested Sprints folder in Space sidebar — **Done** · **Cursor**
- 🟢 **[DEV-30]** Add Deploying and Blocked board statuses for live agent tracking — **Done** · **Cursor**
- 🟢 **[DEV-31]** Document agent workflow in Kortex Platform Walkthrough — **Done** · **Cursor**
- 🟢 **[DEV-32]** Per-task deploy rules: one commit, verify, tag, changelog as deploy history — **Done** · **Cursor** · helpers in \`frontend/src/lib/agentWorkflow.ts\`
- 🟢 **[DEV-33]** Fix all sprints showing the same tasks — **Done** · **Cursor** · Kanban syncs \`filters.sprintId\`; mock \`useTasks\` filters by project/sprint; sidebar counts are real task counts
- 🟢 **[DEV-34]** QA audit: state persistence — **Done** · **Cursor** · Findings → DEV-41 (nav/filters), DEV-42 (offline mock tasks)
- 🟢 **[DEV-41]** Bug: active project/view/filters lost on refresh — **Done** · **Cursor** · \`kortex_session_nav\` localStorage
- 🟢 **[DEV-42]** Bug: offline demo task create/reorder lost on refresh — **Done** · **Cursor** · \`kortex_mock_tasks\` localStorage
- 🟢 **[DEV-35]** QA audit: drag-and-drop — **Done** · **Cursor** · Fixed status object on Kanban drop + optimistic updates; Timeline/Gantt has no DnD (not rebuilt)
- 🟢 **[DEV-36]** QA audit: CRUD edge cases — **Done** · **Cursor** · sanitizePlainText + max lengths; empty/HTML-only title reject; comment sanitize; break-words overflow

---

## ⚡ [Sprint 2] — AI Capabilities & Intelligence Engine
*Status: ACTIVE • Goal: Ship server-side AI task summaries, subtask generator, writing assistant & natural language task creation*

### 📅 In Progress (Sprint 2 Deliverables)
- 🟣 **[DEV-15]** Server-Side AI Intelligence Engine Architecture (\`AI\`, \`LLM\`, \`Gemini\`)
- 🟣 **[DEV-17]** AI Task Detail Summarization Drawer Action (\`AI\`, \`Summarization\`)
- 🔵 **[DEV-18]** AI Subtask Checklist Generator Modal (\`AI\`, \`Subtasks\`)
- 🔵 **[DEV-19]** AI Inline Writing Assistant (Rewrite, Expand, Fix Grammar) (\`AI\`, \`Editor\`)
- 🔵 **[DEV-20]** Natural Language Plain-English Task Parser (Cmd+K) (\`AI\`, \`NLParser\`)
- 🔵 **[DEV-21]** AI Sprint Retrospective & Daily Standup Digest (\`AI\`, \`Retro\`)

---

## 🚀 [Sprint 1] — Visualization & Workflows
*Status: COMPLETED • Points: 13 / 13 Completed*

### 📅 Completed Features
- 🟢 **[DEV-11] 4-Level Hierarchical Mind Map with Infinite Pan & Zoom**: Rebuilt radial mind map into full 4-level organizational hierarchy (Project Root → Epics → Stories → Subtasks) with smooth drag-pan canvas and zoom controls. (\`MindMap\`, \`Canvas\`, \`UI\`)
- 🟢 **[DEV-12] Confluence-Grade Markdown Parser & Rich Editor**: Built high-performance Markdown parser supporting Headings (#, ##, ###), bold/italic, lists, blockquotes, syntax code blocks, tables, and task checkboxes with Preview, Edit Raw, and Split modes. (\`Docs\`, \`Markdown\`, \`Editor\`)
- 🟢 **[DEV-13] Automation Pipeline Alignment & Rule Conflict Manager**: Resolved trigger/condition/action display mismatch in rule builder. Added deterministic execution ordering, loop prevention, and conflict audit notes. (\`Automations\`, \`Workflow\`)

---

## 🛡️ [Sprint 0] — Foundation & Stability Audit
*Status: COMPLETED • Points: 37 / 37 Completed*

### 📅 Completed Features & Fixes
- 🟢 **[DEV-1] Task Key Collision Prevention**: Fixed numeric suffix auto-generation to compute max(numeric_suffix) + 1, resolving duplicate key constraint crashes on deleted tasks. (\`Backend\`, \`Stability\`, \`Bug\`)
- 🟢 **[DEV-2] API Route Aliases**: Added route aliases for /comments/:id/reactions (POST/PUT), /dashboards/analytics (GET), and /notifications/all/read. (\`API\`, \`Routes\`)
- 🟢 **[DEV-3] File Attachments Dropzone**: Added interactive file upload to /api/attachments with image thumbnails and download links. (\`UI\`, \`Attachments\`)
- 🟢 **[DEV-4] Inline Subtasks Tree**: Added subtask checklist with progress bar and inline subtask creation. (\`Hierarchy\`, \`Subtasks\`)
- 🟢 **[DEV-5] Task Dependencies Linker**: Added visual dependency link cards (Blocks, Is Blocked By, Relates To) with clickable key links. (\`Dependencies\`, \`Graph\`)
- 🟢 **[DEV-6] @Mentions Autocomplete**: Suggestion menu when typing @ in comments and interactive emoji reaction pills. (\`Comments\`, \`Mentions\`)
- 🟢 **[DEV-7] Saved Filter Presets Toolbar**: Added 1-click filter pills (High Priority, My Tasks, Bugs, Epics) and reset button. (\`Filters\`, \`Presets\`)
- 🟢 **[DEV-8] 100% Theme Token Refactor**: Removed hardcoded dark colors across Table, Gantt, Calendar, and Modals for WCAG AA compliance. (\`Theming\`, \`DesignSystem\`)
- 🟢 **[DEV-9] Real-Time Toast Alerts**: Floating bottom-right notifications with single-fire SLA breach warnings. (\`Toast\`, \`Notifications\`)
- 🟢 **[DEV-10] Active Timer Persistence**: Stored active stopwatch in localStorage with drift recovery to survive tab sleeps and browser refreshes. (\`Timer\`, \`Bug\`)
- 🟢 **[DEV-14] Server-Side RBAC Enforcement**: Added requireRoles middleware protecting project deletion, workspace management, and sprint controls. (\`Security\`, \`RBAC\`)

---

## 🔮 [Sprint 3] — Docs Hierarchy & Portfolio Roadmap
*Status: PLANNING • Goal: Nested Confluence page trees, advanced search syntax, and portfolio timeline*
- 📋 **[DEV-16]** Confluence Page Tree Hierarchy & Page Nesting
- 📋 **[DEV-23]** Advanced Search Syntax Engine (\`status:done assignee:alex\`)
- 📋 **[DEV-24]** Portfolio Cross-Project Milestone Roadmap Timeline
- 📋 **[DEV-25]** Freeform Collaborative Whiteboard Canvas with Task Cards`,
    authorId: 'usr_alex',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'doc_arch',
    workspaceId: 'ws_dev',
    projectId: 'proj_dev',
    title: 'Kortex Platform Walkthrough',
    icon: 'BookOpen',
    content: `# Kortex Platform Walkthrough (Living Spec)

> Updated inside every agent task. If this doc disagrees with the live app, log a DEV bug and fix it — do not leave stale claims.

## Agent accounts
- \`cursor@kortex.dev\` / \`antigravity@kortex.dev\` (password \`password123\`)

## Agent workflow (mandatory)
1. **Prompt → tasks first:** one DEV task per distinct ask, before code. Plain-language titles. Assign executor. Active sprint. Description cites the originating request. Prefer linking an existing open/recent task over duplicates.
2. **Live statuses:** To Do → In Progress → In Review (self-check/build) → Deploying → Done, or **Blocked**.
3. **Docs in the same task:** update this Walkthrough + Platform Guide chapter + dated Changelog (with commit/deploy). Partial features marked \`🚧 Partial\`.
4. **Ship isolation:** one task → one commit (\`DEV-N: …\`) → one Vercel deploy → confirm success before Done. Failed deploy = Blocked, not Done. Broken prod → rollback + Blocked.
5. **Helpers:** \`frontend/src/lib/agentWorkflow.ts\` — overlap detection, commit/deploy tags, end-of-prompt summary formatter.
6. **Reply format:**
\`\`\`
Tasks: DEV-N (status) …
Changed: …
Docs: Walkthrough §… · Changelog …
Deploy: <url|failed> · commit <sha>
\`\`\`

## Session persistence
- Appearance (theme/font/size), timer, and auth token persist in localStorage.
- Active project, view, section, and filters persist in \`kortex_session_nav\` (survives refresh).
- Offline demo task create/update/delete persists in \`kortex_mock_tasks\` (survives refresh on static/Vercel fallback).

## CRUD text safety
- Titles/descriptions/comments go through \`sanitizePlainText\` (strip tags/null bytes, max lengths). Never render user text as HTML.
- Empty titles rejected; long titles use \`break-words\` / \`line-clamp\` on cards so layout does not overflow.

## Hierarchy
Organization → Spaces → Folders → Projects/Lists → **ClickUp-style \`{List} Sprints\` dropdown** → Tasks

## Board statuses (DEV / KOR)
Backlog · To Do · In Progress · In Review · Deploying · Blocked · Done

## 8 Switchable Project Views
1. **List View**: Grouped by status/priority with collapsible accordions.
2. **Kanban Board**: Drag-and-drop with column WIP limit alerts and swimlanes (includes Deploying / Blocked).
3. **Sprint Backlog**: Jira-style sprint grooming and point rollups.
4. **Timeline / Gantt**: SVG dependency link bezier curves and critical path highlight.
5. **Calendar**: Month grid scheduling with due date mapping.
6. **Workload Capacity**: Team capacity matrix against 40h standard baseline.
7. **Mind Map**: 4-level hierarchical project tree visualizer with pan/zoom.
8. **Spreadsheet Table**: Formula columns and inline cell editing.

## Architecture
- **@kortex/shared**: types, roles, status categories (incl. DEPLOYING, BLOCKED)
- **@kortex/backend**: Express, Prisma, Socket.io
- **@kortex/frontend**: React, Vite, Tailwind, Zustand, TanStack Query
`,
    authorId: 'usr_alex',
    updatedAt: new Date().toISOString(),
  },
];

// Workspace & Project Tree
export function useWorkspaceTree(orgId?: string) {
  return useQuery<Workspace[]>({
    queryKey: ['workspace-tree', orgId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/workspaces/tree?orgId=${orgId || ''}`);
        return res.data;
      } catch (e) {
        return mockWorkspaces;
      }
    },
    initialData: mockWorkspaces,
  });
}

export function useProject(projectId: string | null) {
  return useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      try {
        if (!projectId) return mockProjectDev;
        const res = await apiClient.get(`/projects/${projectId}`);
        return res.data;
      } catch (e) {
        if (projectId === 'proj_kor') return mockProjectKor;
        return mockProjectDev;
      }
    },
    initialData: mockProjectDev,
  });
}

// Tasks
function filterMockTasks(projectId: string | null, params: Record<string, any> = {}) {
  let list = mockTasks.slice();
  if (projectId) list = list.filter((t) => t.projectId === projectId);
  if (params.sprintId) list = list.filter((t) => t.sprintId === params.sprintId);
  if (params.search) {
    const q = String(params.search).toLowerCase();
    list = list.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.key?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    );
  }
  if (params.statusId) list = list.filter((t) => t.statusId === params.statusId);
  if (params.priority) list = list.filter((t) => t.priority === params.priority);
  if (params.issueType) list = list.filter((t) => t.issueType === params.issueType);
  return list;
}

export function useTasks(projectId: string | null, params: Record<string, any> = {}) {
  return useQuery<Task[]>({
    queryKey: ['tasks', projectId, params],
    queryFn: async () => {
      try {
        if (!projectId) return filterMockTasks(null, params);
        const queryParams = new URLSearchParams({ projectId, ...params }).toString();
        const res = await apiClient.get(`/tasks?${queryParams}`);
        return res.data;
      } catch (e) {
        return filterMockTasks(projectId, params);
      }
    },
    initialData: () => filterMockTasks(projectId, params),
  });
}

export function useTask(taskId: string | null) {
  return useQuery<Task>({
    queryKey: ['task', taskId],
    queryFn: async () => {
      if (!taskId) return null as any;
      try {
        const res = await apiClient.get(`/tasks/${taskId}`);
        return res.data;
      } catch (e) {
        return mockTasks.find((t) => t.id === taskId) || mockTasks[0];
      }
    },
    enabled: !!taskId,
  });
}

export function useCreateTaskMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      try {
        const res = await apiClient.post('/tasks', data);
        return res.data;
      } catch (e) {
        const keyNum = mockTasks.length + 1;
        const newTask = {
          id: `t_${Date.now()}`,
          key: `DEV-${keyNum}`,
          projectId: data.projectId || 'proj_dev',
          title: data.title,
          description: data.description,
          issueType: data.issueType || 'TASK',
          priority: data.priority || 'MEDIUM',
          statusId: data.statusId || 'st_todo',
          status: { id: data.statusId || 'st_todo', name: 'To Do', category: 'TODO', color: '#3b82f6' },
          sprintId: data.sprintId || 'sp_dev_2',
          parentId: data.parentId || null,
          storyPoints: data.storyPoints || 3,
          order: mockTasks.length,
          labels: data.labels || ['Feature'],
          assignees: [{ id: 'usr_alex', name: 'Alex Rivera', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }],
        };
        mockTasks.push(newTask);
        persistMockTasks();
        return newTask;
      }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
  });
}

export function useUpdateTaskMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      try {
        const res = await apiClient.put(`/tasks/${id}`, updates);
        return res.data;
      } catch (e) {
        const idx = mockTasks.findIndex((t) => t.id === id);
        if (idx !== -1) {
          mockTasks[idx] = { ...mockTasks[idx], ...updates };
          persistMockTasks();
          return mockTasks[idx];
        }
        return { id, ...updates };
      }
    },
    // Optimistic patch so rapid DnD does not race on refetch (DEV-35)
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const previous = qc.getQueriesData({ queryKey: ['tasks'] });
      qc.setQueriesData({ queryKey: ['tasks'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: any) => (t.id === id ? { ...t, ...updates } : t));
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previous?.forEach(([key, data]: any) => qc.setQueryData(key, data));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task'] });
      qc.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
  });
}

export function useDeleteTaskMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const res = await apiClient.delete(`/tasks/${id}`);
        return res.data;
      } catch (e) {
        const idx = mockTasks.findIndex((t) => t.id === id);
        if (idx !== -1) {
          mockTasks.splice(idx, 1);
          persistMockTasks();
        }
        return { success: true };
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
  });
}

export function useBulkUpdateTasksMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      try {
        const res = await apiClient.post('/tasks/bulk', data);
        return res.data;
      } catch (e) {
        return { success: true };
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
  });
}

// Sprints
export function useSprints(projectId: string | null) {
  return useQuery<Sprint[]>({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      try {
        if (!projectId) return mockSprints;
        const res = await apiClient.get(`/sprints?projectId=${projectId}`);
        return res.data;
      } catch (e) {
        // ponytail: offline/Vercel demo — filter mocks by project like the API would
        return projectId
          ? mockSprints.filter((s) => s.projectId === projectId)
          : mockSprints;
      }
    },
    initialData: projectId
      ? mockSprints.filter((s) => s.projectId === projectId)
      : mockSprints,
  });
}

export function useSprintReport(sprintId: string | null) {
  return useQuery<any>({
    queryKey: ['sprint-report', sprintId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/sprints/${sprintId}/report`);
        return res.data;
      } catch (e) {
        return {
          sprint: mockSprints[2],
          burndown: [
            { day: 'Day 1', ideal: 38, actual: 38 },
            { day: 'Day 2', ideal: 32, actual: 35 },
            { day: 'Day 3', ideal: 26, actual: 28 },
            { day: 'Day 4', ideal: 20, actual: 22 },
            { day: 'Day 5', ideal: 14, actual: 18 },
            { day: 'Day 6', ideal: 8, actual: 13 },
          ],
          velocity: [
            { name: 'Sprint 0', commitment: 37, completed: 37 },
            { name: 'Sprint 1', commitment: 13, completed: 13 },
            { name: 'Sprint 2', commitment: 38, completed: 18 },
          ],
          statusCounts: [
            { name: 'To Do', value: 20, color: '#3b82f6' },
            { name: 'In Progress', value: 18, color: '#8b5cf6' },
            { name: 'Done', value: 50, color: '#10b981' },
          ],
        };
      }
    },
  });
}

// Comments & Reactions
export function useCreateCommentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { taskId: string; content: string; parentId?: string }) => {
      try {
        const res = await apiClient.post('/comments', data);
        return res.data;
      } catch (e) {
        const newComm = {
          id: `c_${Date.now()}`,
          content: data.content,
          author: { name: 'Alex Rivera' },
          createdAt: new Date().toISOString(),
        };
        const task = mockTasks.find((t) => t.id === data.taskId);
        if (task) {
          if (!task.comments) task.comments = [];
          task.comments.push(newComm);
        }
        return newComm;
      }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['task'] });
    },
  });
}

// Docs
export function useDocs(workspaceId?: string, projectId?: string | null) {
  return useQuery<Doc[]>({
    queryKey: ['docs', workspaceId, projectId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/docs?workspaceId=${workspaceId || ''}`);
        return res.data;
      } catch (e) {
        return mockDocs;
      }
    },
    initialData: mockDocs,
  });
}

// Automations
export function useAutomations(projectId: string | null) {
  return useQuery<AutomationRule[]>({
    queryKey: ['automations', projectId],
    queryFn: async () => {
      try {
        if (!projectId) return [];
        const res = await apiClient.get(`/automations?projectId=${projectId}`);
        return res.data;
      } catch (e) {
        return [
          {
            id: 'aut_1',
            projectId: 'proj_dev',
            name: 'Celebrate High-Priority Completions',
            description: 'When high-priority items are marked as Done, automatically post a celebratory bot comment.',
            isEnabled: true,
            trigger: { type: 'STATUS_CHANGED', config: { toStatusId: 'st_done' } },
            conditions: [{ field: 'priority', operator: 'EQUALS', value: 'HIGH' }],
            actions: [{ type: 'POST_COMMENT', config: { message: '🎉 Great job team! High-priority item resolved.' } }],
            executionCount: 14,
            lastExecutedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'aut_2',
            projectId: 'proj_dev',
            name: 'Auto-Transition Urgent Reviews to Done',
            description: 'When urgent tasks enter Code Review, fast-track status to Done.',
            isEnabled: true,
            trigger: { type: 'STATUS_CHANGED', config: { toStatusId: 'st_review' } },
            conditions: [{ field: 'priority', operator: 'EQUALS', value: 'URGENT' }],
            actions: [{ type: 'SET_STATUS', config: { statusId: 'st_done', statusName: 'Done' } }],
            executionCount: 8,
            lastExecutedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      }
    },
  });
}

// Time Tracking
export function useTimeEntries(taskId?: string) {
  return useQuery<TimeEntry[]>({
    queryKey: ['time-entries', taskId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/time-entries${taskId ? `?taskId=${taskId}` : ''}`);
        return res.data;
      } catch (e) {
        return [
          {
            id: 'te_1',
            taskId: 't_dev_11',
            userId: 'usr_jordan',
            durationMinutes: 180,
            description: 'Built 4-level hierarchical mind map and pan/zoom canvas',
            billable: true,
            date: new Date().toISOString(),
          },
          {
            id: 'te_2',
            taskId: 't_dev_12',
            userId: 'usr_alex',
            durationMinutes: 150,
            description: 'Built Confluence-grade markdown parser and live preview modes',
            billable: true,
            date: new Date().toISOString(),
          },
        ];
      }
    },
  });
}

// Dashboards & Analytics
export function useDashboardAnalytics(projectId: string | null, orgId?: string) {
  return useQuery<any>({
    queryKey: ['dashboard-analytics', projectId, orgId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/dashboards/analytics?projectId=${projectId || ''}&orgId=${orgId || ''}`);
        return res.data;
      } catch (e) {
        return {
          summary: {
            totalTasks: mockTasks.length,
            completedTasks: mockTasks.filter((t) => t.statusId === 'st_done').length,
            inProgressTasks: mockTasks.filter((t) => t.statusId === 'st_inprogress').length,
            overdueCount: 0,
            totalHoursLogged: 48,
            billableHoursLogged: 42,
          },
          statusBreakdown: [
            { name: 'To Do', count: 4, color: '#3b82f6' },
            { name: 'In Progress', count: 3, color: '#8b5cf6' },
            { name: 'Code Review', count: 0, color: '#f59e0b' },
            { name: 'Done', count: 16, color: '#10b981' },
          ],
          priorityBreakdown: [
            { name: 'URGENT', count: 2, color: '#ef4444' },
            { name: 'HIGH', count: 12, color: '#f97316' },
            { name: 'MEDIUM', count: 8, color: '#eab308' },
            { name: 'LOW', count: 0, color: '#64748b' },
          ],
          recentActivity: [
            { id: 'act_1', action: 'Started Sprint 2: AI Capabilities & Intelligence Engine', user: { name: 'Alex Rivera' }, createdAt: new Date().toISOString() },
            { id: 'act_2', action: 'Completed Sprint 1: Visualization & Workflows (13 pts)', user: { name: 'Jordan Smith' }, createdAt: new Date().toISOString() },
            { id: 'act_3', action: 'Updated Kortex Changelog in Docs & Wiki', user: { name: 'Alex Rivera' }, createdAt: new Date().toISOString() },
          ],
        };
      }
    },
  });
}

// Notifications
export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/notifications');
        return res.data;
      } catch (e) {
        return [
          {
            id: 'n_1',
            userId: 'usr_alex',
            title: 'Sprint 2 Started',
            message: 'Sprint 2 — AI Capabilities & Intelligence Engine is now active with 6 deliverables.',
            type: 'MENTION',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'n_2',
            userId: 'usr_alex',
            title: 'Sprint 1 Completed',
            message: 'Sprint 1 — Visualization & Workflows was successfully completed (100% of points resolved).',
            type: 'MENTION',
            isRead: true,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ];
      }
    },
  });
}

export function useMarkNotificationReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const res = await apiClient.put(`/notifications/${id}/read`);
        return res.data;
      } catch (e) {
        return { success: true };
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        const res = await apiClient.put('/notifications/all/read');
        return res.data;
      } catch (e) {
        return { success: true };
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
