import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { Task, Project, Sprint, Doc, AutomationRule, Notification, TimeEntry, Workspace } from '@kortex/shared';

// Fallback Mock Data for standalone / Vercel demo preview
const mockWorkspaces: any[] = [
  {
    id: 'ws_eng',
    orgId: 'org_acme',
    name: 'Engineering & Product',
    slug: 'eng-product',
    icon: 'Cpu',
    color: '#6366f1',
    folders: [
      {
        id: 'fld_core',
        name: 'Platform Core',
        color: '#6366f1',
        projects: [
          {
            id: 'proj_kor',
            name: 'Kortex Cloud Platform',
            key: 'KOR',
            type: 'SOFTWARE_SCRUM',
          },
        ],
      },
      {
        id: 'fld_growth',
        name: 'Growth & Marketing',
        color: '#f59e0b',
        projects: [
          {
            id: 'proj_mkt',
            name: 'Product Launch & Growth Q3',
            key: 'MKT',
            type: 'BUSINESS',
          },
        ],
      },
    ],
    projects: [],
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

const mockProjectKor: any = {
  id: 'proj_kor',
  name: 'Kortex Cloud Platform',
  key: 'KOR',
  type: 'SOFTWARE_SCRUM',
  description: 'Scalable distributed work management engine with real-time sync and automation',
  leadId: 'usr_alex',
  statuses: [
    { id: 'st_backlog', name: 'Backlog', category: 'TODO', color: '#64748b', order: 0 },
    { id: 'st_todo', name: 'To Do', category: 'TODO', color: '#3b82f6', order: 1, wipLimit: 8 },
    { id: 'st_inprogress', name: 'In Progress', category: 'IN_PROGRESS', color: '#8b5cf6', order: 2, wipLimit: 5 },
    { id: 'st_review', name: 'Code Review', category: 'IN_REVIEW', color: '#f59e0b', order: 3, wipLimit: 4 },
    { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981', order: 4 },
  ],
  customFields: [
    { id: 'cf_1', name: 'Severity Level', type: 'DROPDOWN' },
    { id: 'cf_2', name: 'Target Release', type: 'TEXT' },
  ],
};

const mockSprints: any[] = [
  {
    id: 'sp_23',
    projectId: 'proj_kor',
    name: 'Sprint 23 - Core Architecture',
    goal: 'Deliver initial database indexing and authentication microservices',
    status: 'COMPLETED',
    totalPoints: 34,
    completedPoints: 32,
    startDate: new Date(Date.now() - 28 * 86400000).toISOString(),
    endDate: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'sp_24',
    projectId: 'proj_kor',
    name: 'Sprint 24 - Live Collaboration & Sprints',
    goal: 'Launch WebSockets real-time task board, Gantt charts, and custom workflow automations',
    status: 'ACTIVE',
    totalPoints: 52,
    completedPoints: 23,
    startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 9 * 86400000).toISOString(),
  },
  {
    id: 'sp_25',
    projectId: 'proj_kor',
    name: 'Sprint 25 - AI Workflows & Mobile PWA',
    goal: 'Implement intelligent task summaries and responsive mobile experience',
    status: 'PLANNING',
    totalPoints: 30,
    startDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 24 * 86400000).toISOString(),
  },
];

const mockTasks: any[] = [
  // Epics
  {
    id: 't_epic_1',
    key: 'KOR-1',
    projectId: 'proj_kor',
    title: 'Distributed Real-Time Engine & Data Integrity',
    description: 'Multi-tenant real-time sync, WebSockets presence protocol, and automated RBAC security.',
    issueType: 'EPIC',
    priority: 'HIGH',
    statusId: 'st_inprogress',
    status: { id: 'st_inprogress', name: 'In Progress', category: 'IN_PROGRESS', color: '#8b5cf6' },
    sprintId: 'sp_24',
    storyPoints: 21,
    order: 0,
    assignees: [{ id: 'usr_alex', name: 'Alex Rivera', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_epic_2',
    key: 'KOR-2',
    projectId: 'proj_kor',
    title: '8-View Interactive Canvas & AI Productivity Engine',
    description: 'Kanban, Timeline/Gantt, Backlog Grooming, Formula Spreadsheet, Mind Map, Docs, and LLM Intelligence Hub.',
    issueType: 'EPIC',
    priority: 'URGENT',
    statusId: 'st_inprogress',
    status: { id: 'st_inprogress', name: 'In Progress', category: 'IN_PROGRESS', color: '#8b5cf6' },
    sprintId: 'sp_24',
    storyPoints: 34,
    order: 1,
    assignees: [{ id: 'usr_jordan', name: 'Jordan Smith', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }],
  },

  // Tasks under Epic 1
  {
    id: 't_11',
    key: 'KOR-11',
    projectId: 'proj_kor',
    epicId: 't_epic_1',
    title: 'Implement Multi-Assignee Avatar Picker with Live Presence Badges',
    description: 'Allow assigning multiple team members to a single issue like ClickUp, displaying pulsing live active indicators.',
    issueType: 'TASK',
    priority: 'MEDIUM',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_24',
    storyPoints: 5,
    order: 2,
    assignees: [
      { id: 'usr_jordan', name: 'Jordan Smith', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr_maya', name: 'Maya Lin', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
    ],
  },
  {
    id: 't_12',
    key: 'KOR-12',
    projectId: 'proj_kor',
    epicId: 't_epic_1',
    title: 'Sprint Backlog Grooming Drag-and-Drop & Rollover Logic',
    description: 'Build Jira-style backlog page with collapsible sprint boxes, total point rollups, sprint start modal, and completion modal.',
    issueType: 'STORY',
    priority: 'URGENT',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_24',
    storyPoints: 8,
    order: 3,
    assignees: [{ id: 'usr_maya', name: 'Maya Lin', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' }],
  },

  // Tasks under Epic 2
  {
    id: 't_10',
    key: 'KOR-10',
    projectId: 'proj_kor',
    epicId: 't_epic_2',
    title: 'Build Interactive Gantt / Timeline View with Dependency Curves',
    description: 'Render responsive SVG timeline bars with interactive drag-to-reschedule, dependency link connectors, and critical path highlighting.',
    issueType: 'STORY',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_24',
    storyPoints: 8,
    timeEstimateMinutes: 960,
    timeSpentMinutes: 360,
    startDate: new Date(Date.now() - 4 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    labels: ['Gantt', 'UI/UX', 'Interactive'],
    order: 4,
    assignees: [{ id: 'usr_jordan', name: 'Jordan Smith', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_sub_1',
    key: 'KOR-10-A',
    projectId: 'proj_kor',
    parentId: 't_10',
    title: 'SVG Bezier Curve Connector Math',
    issueType: 'SUBTASK',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    order: 1,
  },
  {
    id: 't_sub_2',
    key: 'KOR-10-B',
    projectId: 'proj_kor',
    parentId: 't_10',
    title: 'Drag Handle Time Resizing & Zoom Modes',
    issueType: 'SUBTASK',
    priority: 'MEDIUM',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    order: 2,
  },
  {
    id: 't_20',
    key: 'KOR-20',
    projectId: 'proj_kor',
    epicId: 't_epic_2',
    title: 'Rebuild 4-Level Hierarchical Mind Map with Pan & Zoom Canvas',
    description: 'Hierarchical node visualizer: Project -> Epics -> Stories -> Subtasks with smooth interactive pan, drag, and zoom.',
    issueType: 'STORY',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_24',
    storyPoints: 5,
    order: 5,
    assignees: [{ id: 'usr_jordan', name: 'Jordan Smith', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_21',
    key: 'KOR-21',
    projectId: 'proj_kor',
    epicId: 't_epic_2',
    title: 'Confluence-Grade Markdown Parser & Rich Editor with Split Preview',
    description: 'Parse headings, lists, blockquotes, code blocks, tables, and task checkboxes with live preview mode.',
    issueType: 'TASK',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_24',
    storyPoints: 5,
    order: 6,
    assignees: [{ id: 'usr_alex', name: 'Alex Rivera', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_22',
    key: 'KOR-22',
    projectId: 'proj_kor',
    epicId: 't_epic_1',
    title: 'Workflow Automation Pipeline Alignment & Rule Conflict Manager',
    description: 'Audit trigger-condition-action pipeline cards and add execution loop prevention with conflict tracking.',
    issueType: 'TASK',
    priority: 'HIGH',
    statusId: 'st_done',
    status: { id: 'st_done', name: 'Done', category: 'DONE', color: '#10b981' },
    sprintId: 'sp_24',
    storyPoints: 5,
    order: 7,
    assignees: [{ id: 'usr_devon', name: 'Devon Vance', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }],
  },
  {
    id: 't_23',
    key: 'KOR-23',
    projectId: 'proj_kor',
    epicId: 't_epic_2',
    title: 'Phase 2: Server-Side AI Intelligence Engine (Summaries, Subtasks, NL Parsing)',
    description: 'LLM integrations for task summarization, atomic subtask generation, writing assistant, natural language creation, and workspace Q&A.',
    issueType: 'STORY',
    priority: 'URGENT',
    statusId: 'st_inprogress',
    status: { id: 'st_inprogress', name: 'In Progress', category: 'IN_PROGRESS', color: '#8b5cf6' },
    sprintId: 'sp_24',
    storyPoints: 13,
    order: 8,
    assignees: [
      { id: 'usr_alex', name: 'Alex Rivera', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr_jordan', name: 'Jordan Smith', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    ],
  },
  {
    id: 't_24',
    key: 'KOR-24',
    projectId: 'proj_kor',
    epicId: 't_epic_2',
    title: 'Phase 2: Portfolio Cross-Project Roadmap & Whiteboard Canvas',
    description: 'Build high-level cross-project milestone roadmap and freeform visual whiteboard with task convert actions.',
    issueType: 'STORY',
    priority: 'MEDIUM',
    statusId: 'st_todo',
    status: { id: 'st_todo', name: 'To Do', category: 'TODO', color: '#3b82f6' },
    sprintId: 'sp_24',
    storyPoints: 8,
    order: 9,
    assignees: [{ id: 'usr_maya', name: 'Maya Lin', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' }],
  },
];

// Workspace & Project Tree
export function useWorkspaceTree(orgId?: string) {
  return useQuery<Workspace[]>({
    queryKey: ['workspace-tree', orgId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/workspaces/tree?orgId=${orgId}`);
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
        if (!projectId) return mockProjectKor;
        const res = await apiClient.get(`/projects/${projectId}`);
        return res.data;
      } catch (e) {
        return mockProjectKor;
      }
    },
    initialData: mockProjectKor,
  });
}

// Tasks
export function useTasks(projectId: string | null, params: Record<string, any> = {}) {
  return useQuery<Task[]>({
    queryKey: ['tasks', projectId, params],
    queryFn: async () => {
      try {
        if (!projectId) return mockTasks;
        const queryParams = new URLSearchParams();
        queryParams.set('projectId', projectId);
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            queryParams.set(key, String(val));
          }
        });
        const res = await apiClient.get(`/tasks?${queryParams.toString()}`);
        return res.data;
      } catch (e) {
        return mockTasks;
      }
    },
    initialData: mockTasks,
  });
}

export function useTask(taskId: string | null) {
  return useQuery<any>({
    queryKey: ['task', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      try {
        const res = await apiClient.get(`/tasks/${taskId}`);
        return res.data;
      } catch (e) {
        return mockTasks.find((t) => t.id === taskId) || mockTasks[0];
      }
    },
  });
}

export function useCreateTaskMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Task> & { assigneeIds?: string[]; customFieldValues?: any }) => {
      try {
        const res = await apiClient.post('/tasks', data);
        return res.data;
      } catch (e) {
        const newTask = {
          id: `t_${Date.now()}`,
          key: `KOR-${Math.floor(Math.random() * 80 + 20)}`,
          ...data,
          status: mockProjectKor.statuses.find((s: any) => s.id === data.statusId) || mockProjectKor.statuses[0],
        };
        mockTasks.push(newTask);
        return newTask;
      }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['sprints'] });
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
        const tIndex = mockTasks.findIndex((t) => t.id === id);
        if (tIndex >= 0) {
          mockTasks[tIndex] = { ...mockTasks[tIndex], ...updates };
          if (updates.statusId) {
            mockTasks[tIndex].status = mockProjectKor.statuses.find((s: any) => s.id === updates.statusId);
          }
          return mockTasks[tIndex];
        }
        return { id, ...updates };
      }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', data?.id] });
      qc.invalidateQueries({ queryKey: ['sprints'] });
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
        return { id, ...res.data };
      } catch (e) {
        const idx = mockTasks.findIndex((t) => t.id === id);
        if (idx >= 0) mockTasks.splice(idx, 1);
        return { id };
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['sprints'] });
    },
  });
}

export function useBulkUpdateTasksMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      taskIds: string[];
      statusId?: string;
      priority?: any;
      sprintId?: string | null;
      action?: 'delete';
      deletePermanent?: boolean;
      projectId?: string;
    }) => {
      try {
        const res = await apiClient.post('/tasks/bulk', data);
        return res.data;
      } catch (e) {
        return { count: data.taskIds.length };
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['sprints'] });
    },
  });
}

// Sprints
export function useSprints(projectId: string | null) {
  return useQuery<Sprint[]>({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/sprints?projectId=${projectId}`);
        return res.data;
      } catch (e) {
        return mockSprints;
      }
    },
    initialData: mockSprints,
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
          sprint: mockSprints[1],
          burndown: [
            { day: 'Day 1', ideal: 52, actual: 52 },
            { day: 'Day 2', ideal: 47, actual: 50 },
            { day: 'Day 3', ideal: 42, actual: 44 },
            { day: 'Day 4', ideal: 37, actual: 38 },
            { day: 'Day 5', ideal: 32, actual: 29 },
            { day: 'Day 6', ideal: 27, actual: 29 },
          ],
          velocity: [
            { name: 'Sprint 22', commitment: 40, completed: 38 },
            { name: 'Sprint 23', commitment: 34, completed: 32 },
            { name: 'Sprint 24', commitment: 52, completed: 23 },
          ],
          statusCounts: [
            { name: 'To Do', value: 12, color: '#3b82f6' },
            { name: 'In Progress', value: 16, color: '#8b5cf6' },
            { name: 'Code Review', value: 8, color: '#f59e0b' },
            { name: 'Done', value: 23, color: '#10b981' },
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
        return [
          {
            id: 'doc_1',
            workspaceId: 'ws_eng',
            projectId: 'proj_kor',
            title: 'Kortex Platform Architecture & Realtime Protocols',
            icon: 'Cpu',
            content: `# Kortex Cloud Architecture\n\n## Overview\nKortex provides high-throughput agile workflow tooling with sub-50ms optimistic UI synchronizations.\n\n### Key Components\n- **Real-Time WebSockets**: Socket.io partitioned by project & workspace rooms.\n- **Agile Engine**: Automatic burndown calculations and sprint rollover.\n- **Custom Automations**: Reactive event loop evaluating trigger -> condition -> actions.`,
            authorId: 'usr_alex',
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'doc_2',
            workspaceId: 'ws_eng',
            projectId: 'proj_kor',
            title: 'Sprint 24 Goals & QA Verification Matrix',
            icon: 'CheckSquare',
            content: `# Sprint 24 Release Checklist\n\n- [x] WebSockets presence badges\n- [x] Interactive Gantt timeline dependencies\n- [x] Light / Dark mode typography preferences\n- [ ] Slack webhook payload delivery`,
            authorId: 'usr_priya',
            updatedAt: new Date().toISOString(),
          },
        ];
      }
    },
  });
}

// Automations
export function useAutomations(projectId: string | null) {
  return useQuery<AutomationRule[]>({
    queryKey: ['automations', projectId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/automations?projectId=${projectId}`);
        return res.data;
      } catch (e) {
        return [
          {
            id: 'rule_1',
            projectId: 'proj_kor',
            name: 'Auto-Complete Sprint Tasks to Done',
            isEnabled: true,
            trigger: { type: 'STATUS_CHANGED' },
            conditions: [{ field: 'priority', operator: 'EQUALS', value: 'HIGH' }],
            actions: [{ type: 'POST_COMMENT' }],
            executionCount: 7,
          },
        ];
      }
    },
    enabled: !!projectId,
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
            totalTasks: 18,
            completedTasks: 8,
            inProgressTasks: 6,
            overdueCount: 1,
            totalHoursLogged: 24,
            billableHoursLogged: 19,
          },
          statusBreakdown: [
            { name: 'To Do', value: 4, color: '#3b82f6' },
            { name: 'In Progress', value: 6, color: '#8b5cf6' },
            { name: 'Code Review', value: 2, color: '#f59e0b' },
            { name: 'Done', value: 8, color: '#10b981' },
          ],
          priorityBreakdown: [
            { name: 'Urgent', value: 3, color: '#ef4444' },
            { name: 'High', value: 7, color: '#f97316' },
            { name: 'Medium', value: 5, color: '#eab308' },
            { name: 'Low', value: 3, color: '#64748b' },
          ],
          overdueTasks: [
            { id: 't_13', key: 'KOR-13', title: 'Fix optimistic UI state flicker on rapid column drag', dueDate: new Date(Date.now() - 86400000).toISOString() },
          ],
          recentActivity: [
            { id: 'a_1', user: { name: 'Jordan Smith' }, action: 'Moved KOR-10 to In Progress', createdAt: new Date().toISOString(), task: { key: 'KOR-10', id: 't_10' } },
            { id: 'a_2', user: { name: 'Alex Rivera' }, action: 'Created task KOR-17', createdAt: new Date().toISOString(), task: { key: 'KOR-17', id: 't_17' } },
          ],
        };
      }
    },
  });
}

// Time Entries
export function useTimeEntries(projectId?: string | null) {
  return useQuery<any>({
    queryKey: ['time-entries', projectId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/time-entries?projectId=${projectId || ''}`);
        return res.data;
      } catch (e) {
        return {
          summary: { totalHours: 18.5, billableHours: 15.0 },
          entries: [
            {
              id: 'te_1',
              user: { name: 'Jordan Smith' },
              task: { key: 'KOR-10', title: 'Build Interactive Gantt View' },
              durationMinutes: 180,
              billable: true,
              description: 'Created SVG timeline bar drag handles and snapping grid',
              date: new Date().toISOString(),
            },
            {
              id: 'te_2',
              user: { name: 'Maya Lin' },
              task: { key: 'KOR-12', title: 'Sprint Backlog Grooming Logic' },
              durationMinutes: 240,
              billable: true,
              description: 'Sprint rollover modal and backlog reordering',
              date: new Date().toISOString(),
            },
          ],
        };
      }
    },
  });
}

// Notifications
export function useNotifications() {
  return useQuery<{ notifications: Notification[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/notifications');
        return res.data;
      } catch (e) {
        return {
          unreadCount: 1,
          notifications: [
            {
              id: 'n_1',
              title: 'Task Assigned',
              message: 'Jordan assigned you to KOR-14: Workload & Capacity Planning View',
              type: 'TASK_ASSIGNED',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }
    },
  });
}
