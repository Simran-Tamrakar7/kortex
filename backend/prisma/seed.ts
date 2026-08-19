import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive Kortex database seed with rich dummy data...');

  // 1. Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.taskWatcher.deleteMany();
  await prisma.customFieldValue.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.customField.deleteMany();
  await prisma.viewConfig.deleteMany();
  await prisma.status.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.sLAConfig.deleteMany();
  await prisma.doc.deleteMany();
  await prisma.dashboard.deleteMany();
  await prisma.project.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.orgMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const defaultPassword = await bcrypt.hash('password123', 10);

  const alex = await prisma.user.create({
    data: {
      email: 'alex@kortex.dev',
      name: 'Alex Rivera',
      passwordHash: defaultPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      timezone: 'America/New_York',
    },
  });

  const maya = await prisma.user.create({
    data: {
      email: 'maya@kortex.dev',
      name: 'Maya Lin',
      passwordHash: defaultPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      timezone: 'America/Los_Angeles',
    },
  });

  const jordan = await prisma.user.create({
    data: {
      email: 'jordan@kortex.dev',
      name: 'Jordan Smith',
      passwordHash: defaultPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      timezone: 'Europe/London',
    },
  });

  const devon = await prisma.user.create({
    data: {
      email: 'devon@kortex.dev',
      name: 'Devon Vance',
      passwordHash: defaultPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      timezone: 'America/Chicago',
    },
  });

  const priya = await prisma.user.create({
    data: {
      email: 'priya@kortex.dev',
      name: 'Priya Patel',
      passwordHash: defaultPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      timezone: 'Asia/Kolkata',
    },
  });

  console.log('✅ Created 5 team users');

  // 3. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Global Innovations',
      slug: 'acme-global',
      plan: 'ENTERPRISE',
      ownerId: alex.id,
      members: {
        create: [
          { userId: alex.id, role: 'OWNER' },
          { userId: maya.id, role: 'ADMIN' },
          { userId: jordan.id, role: 'MEMBER' },
          { userId: devon.id, role: 'MEMBER' },
          { userId: priya.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // 4. Create Workspaces
  const engWorkspace = await prisma.workspace.create({
    data: {
      orgId: org.id,
      name: 'Engineering & Product',
      slug: 'eng-product',
      description: 'Core product development, architecture, sprint planning, and infrastructure',
      icon: 'Cpu',
      color: '#6366f1',
      members: {
        create: [
          { userId: alex.id, role: 'OWNER' },
          { userId: maya.id, role: 'ADMIN' },
          { userId: jordan.id, role: 'MEMBER' },
          { userId: devon.id, role: 'MEMBER' },
          { userId: priya.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const opsWorkspace = await prisma.workspace.create({
    data: {
      orgId: org.id,
      name: 'Operations & IT Support',
      slug: 'ops-it',
      description: 'Internal service desk, IT requests, client onboarding, and SLAs',
      icon: 'LifeBuoy',
      color: '#10b981',
      members: {
        create: [
          { userId: alex.id, role: 'ADMIN' },
          { userId: devon.id, role: 'OWNER' },
        ],
      },
    },
  });

  // 5. Create Folders
  const coreFolder = await prisma.folder.create({
    data: {
      workspaceId: engWorkspace.id,
      name: 'Platform Core',
      color: '#6366f1',
      icon: 'Layers',
    },
  });

  const marketingFolder = await prisma.folder.create({
    data: {
      workspaceId: engWorkspace.id,
      name: 'Growth & Marketing',
      color: '#f59e0b',
      icon: 'TrendingUp',
    },
  });

  // 6. Create Scrum Project: Kortex Cloud Platform (KOR)
  const scrumProject = await prisma.project.create({
    data: {
      workspaceId: engWorkspace.id,
      folderId: coreFolder.id,
      name: 'Kortex Cloud Platform',
      key: 'KOR',
      type: 'SOFTWARE_SCRUM',
      description: 'Scalable distributed work management engine with real-time sync and automation',
      icon: 'Layers',
      leadId: alex.id,
      estimationType: 'STORY_POINTS_FIBONACCI',
    },
  });

  // Custom statuses for Scrum project
  const statusBacklog = await prisma.status.create({
    data: { projectId: scrumProject.id, name: 'Backlog', category: 'TODO', color: '#64748b', order: 0 },
  });
  const statusTodo = await prisma.status.create({
    data: { projectId: scrumProject.id, name: 'To Do', category: 'TODO', color: '#3b82f6', order: 1, wipLimit: 8 },
  });
  const statusInProgress = await prisma.status.create({
    data: { projectId: scrumProject.id, name: 'In Progress', category: 'IN_PROGRESS', color: '#8b5cf6', order: 2, wipLimit: 5 },
  });
  const statusCodeReview = await prisma.status.create({
    data: { projectId: scrumProject.id, name: 'Code Review', category: 'IN_REVIEW', color: '#f59e0b', order: 3, wipLimit: 4 },
  });
  const statusDone = await prisma.status.create({
    data: { projectId: scrumProject.id, name: 'Done', category: 'DONE', color: '#10b981', order: 4 },
  });

  // Default Views for Scrum project
  await prisma.viewConfig.createMany({
    data: [
      { projectId: scrumProject.id, name: 'List', type: 'LIST', isDefault: true, configJson: JSON.stringify({ groupBy: 'status' }) },
      { projectId: scrumProject.id, name: 'Kanban Board', type: 'BOARD', isDefault: false, configJson: JSON.stringify({ groupBy: 'status' }) },
      { projectId: scrumProject.id, name: 'Sprint Backlog', type: 'BACKLOG', isDefault: false, configJson: JSON.stringify({}) },
      { projectId: scrumProject.id, name: 'Timeline / Gantt', type: 'GANTT', isDefault: false, configJson: JSON.stringify({}) },
      { projectId: scrumProject.id, name: 'Calendar', type: 'CALENDAR', isDefault: false, configJson: JSON.stringify({}) },
      { projectId: scrumProject.id, name: 'Workload Capacity', type: 'WORKLOAD', isDefault: false, configJson: JSON.stringify({}) },
      { projectId: scrumProject.id, name: 'Mind Map', type: 'MINDMAP', isDefault: false, configJson: JSON.stringify({}) },
      { projectId: scrumProject.id, name: 'Spreadsheet', type: 'TABLE', isDefault: false, configJson: JSON.stringify({}) },
    ],
  });

  // Custom Fields for Scrum project
  const cfPriorityLevel = await prisma.customField.create({
    data: {
      projectId: scrumProject.id,
      name: 'Severity Level',
      type: 'DROPDOWN',
      optionsJson: JSON.stringify(['P0 - Blocker', 'P1 - High Priority', 'P2 - Normal', 'P3 - Low']),
    },
  });
  const cfReleaseVersion = await prisma.customField.create({
    data: {
      projectId: scrumProject.id,
      name: 'Target Release',
      type: 'TEXT',
    },
  });
  const cfClientImpact = await prisma.customField.create({
    data: {
      projectId: scrumProject.id,
      name: 'Client Impact',
      type: 'DROPDOWN',
      optionsJson: JSON.stringify(['High (All Orgs)', 'Medium (Pro Plans)', 'Low (Internal)']),
    },
  });

  // Sprints
  const pastSprint23 = await prisma.sprint.create({
    data: {
      projectId: scrumProject.id,
      name: 'Sprint 23 - Core Architecture',
      goal: 'Deliver initial database indexing and authentication microservices',
      startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      status: 'COMPLETED',
      completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      totalPoints: 34,
      completedPoints: 32,
    },
  });

  const activeSprint24 = await prisma.sprint.create({
    data: {
      projectId: scrumProject.id,
      name: 'Sprint 24 - Live Collaboration & Sprints',
      goal: 'Launch WebSockets real-time task board, Gantt charts, and custom workflow automations',
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      totalPoints: 52,
      completedPoints: 23,
    },
  });

  const futureSprint25 = await prisma.sprint.create({
    data: {
      projectId: scrumProject.id,
      name: 'Sprint 25 - AI Workflows & Mobile PWA',
      goal: 'Implement intelligent task summaries and responsive mobile experience',
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000),
      status: 'PLANNING',
      totalPoints: 30,
    },
  });

  // Epics
  const epicAuth = await prisma.task.create({
    data: {
      key: 'KOR-1',
      projectId: scrumProject.id,
      title: 'Enterprise Authentication & Multi-Tenancy Architecture',
      description: 'Architect secure JWT + refresh token session rotation, OAuth2 SSO, and organization role delegation.',
      issueType: 'EPIC',
      priority: 'HIGH',
      statusId: statusInProgress.id,
      reporterId: alex.id,
      storyPoints: 13,
      labelsJson: JSON.stringify(['Security', 'Auth', 'Architecture']),
      order: 1,
      assignees: { create: [{ userId: maya.id }] },
    },
  });

  const epicRealtime = await prisma.task.create({
    data: {
      key: 'KOR-2',
      projectId: scrumProject.id,
      title: 'Real-Time Synchronized Canvas & Presence Engine',
      description: 'Implement bi-directional Socket.io protocol for live card dragging, presence avatars, and optimistic conflict resolution.',
      issueType: 'EPIC',
      priority: 'URGENT',
      statusId: statusInProgress.id,
      reporterId: alex.id,
      storyPoints: 21,
      labelsJson: JSON.stringify(['WebSockets', 'Frontend', 'Realtime']),
      order: 2,
      assignees: { create: [{ userId: jordan.id }, { userId: maya.id }] },
    },
  });

  const epicAutomations = await prisma.task.create({
    data: {
      key: 'KOR-3',
      projectId: scrumProject.id,
      title: 'Event-Driven Workflow Automation Engine',
      description: 'Build flexible Trigger -> Condition -> Action execution pipeline with SLA monitors and webhook triggers.',
      issueType: 'EPIC',
      priority: 'MEDIUM',
      statusId: statusTodo.id,
      reporterId: alex.id,
      storyPoints: 13,
      labelsJson: JSON.stringify(['Backend', 'Automations', 'Engine']),
      order: 3,
      assignees: { create: [{ userId: devon.id }] },
    },
  });

  // Sprint 24 Active Tasks
  const task1 = await prisma.task.create({
    data: {
      key: 'KOR-10',
      projectId: scrumProject.id,
      title: 'Build Interactive Gantt / Timeline View with Dependency Curves',
      description: 'Render responsive SVG timeline bars with interactive drag-to-reschedule, dependency link connectors, and critical path highlighting.',
      issueType: 'STORY',
      priority: 'HIGH',
      statusId: statusInProgress.id,
      sprintId: activeSprint24.id,
      epicId: epicRealtime.id,
      reporterId: alex.id,
      storyPoints: 8,
      timeEstimateMinutes: 960,
      timeSpentMinutes: 360,
      startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      labelsJson: JSON.stringify(['Gantt', 'UI/UX', 'Interactive']),
      checklistsJson: JSON.stringify([
        { id: '1', text: 'SVG Bezier curve generator between task nodes', completed: true },
        { id: '2', text: 'Drag handle for duration resizing', completed: true },
        { id: '3', text: 'Critical path calculation algorithm', completed: false },
      ]),
      order: 1,
      assignees: { create: [{ userId: jordan.id }] },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      key: 'KOR-11',
      projectId: scrumProject.id,
      title: 'Implement Multi-Assignee Avatar Picker with Live Presence Badges',
      description: 'Allow assigning multiple team members to a single issue like ClickUp, displaying pulsing live active indicators.',
      issueType: 'TASK',
      priority: 'MEDIUM',
      statusId: statusDone.id,
      sprintId: activeSprint24.id,
      epicId: epicRealtime.id,
      reporterId: alex.id,
      storyPoints: 5,
      timeEstimateMinutes: 480,
      timeSpentMinutes: 480,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      labelsJson: JSON.stringify(['UI/UX', 'Presence']),
      checklistsJson: JSON.stringify([
        { id: '1', text: 'Multi-select user dropdown component', completed: true },
        { id: '2', text: 'WebSocket presence broadcast event', completed: true },
      ]),
      order: 2,
      assignees: { create: [{ userId: jordan.id }, { userId: maya.id }] },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      key: 'KOR-12',
      projectId: scrumProject.id,
      title: 'Sprint Backlog Grooming Drag-and-Drop & Rollover Logic',
      description: 'Build Jira-style backlog page with collapsible sprint boxes, total point rollups, sprint start modal, and completion modal.',
      issueType: 'STORY',
      priority: 'URGENT',
      statusId: statusCodeReview.id,
      sprintId: activeSprint24.id,
      epicId: epicRealtime.id,
      reporterId: alex.id,
      storyPoints: 8,
      timeEstimateMinutes: 720,
      timeSpentMinutes: 600,
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      labelsJson: JSON.stringify(['Agile', 'Scrum', 'Backlog']),
      checklistsJson: JSON.stringify([
        { id: '1', text: 'Collapsible sprint containers', completed: true },
        { id: '2', text: 'Sprint complete modal with rollover options', completed: true },
        { id: '3', text: 'Burndown calculation endpoint', completed: true },
      ]),
      order: 3,
      assignees: { create: [{ userId: maya.id }] },
    },
  });

  const task4 = await prisma.task.create({
    data: {
      key: 'KOR-13',
      projectId: scrumProject.id,
      title: 'Fix optimistic UI state flicker on rapid column drag',
      description: 'When dragging multiple cards across kanban swimlanes quickly, ensure state reconciles seamlessly without DOM bounce.',
      issueType: 'BUG',
      priority: 'HIGH',
      statusId: statusTodo.id,
      sprintId: activeSprint24.id,
      epicId: epicRealtime.id,
      reporterId: priya.id,
      storyPoints: 3,
      timeEstimateMinutes: 240,
      startDate: new Date(Date.now()),
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      labelsJson: JSON.stringify(['Bugfix', 'Kanban', 'DnD']),
      order: 4,
      assignees: { create: [{ userId: jordan.id }] },
    },
  });

  const task5 = await prisma.task.create({
    data: {
      key: 'KOR-14',
      projectId: scrumProject.id,
      title: 'Workload & Capacity Planning View with Working Hours Matrix',
      description: 'Calculate weekly available capacity per developer and visualize over-allocation warnings with color bars.',
      issueType: 'STORY',
      priority: 'MEDIUM',
      statusId: statusInProgress.id,
      sprintId: activeSprint24.id,
      epicId: epicAutomations.id,
      reporterId: alex.id,
      storyPoints: 5,
      timeEstimateMinutes: 480,
      timeSpentMinutes: 240,
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      labelsJson: JSON.stringify(['Workload', 'Reporting']),
      order: 5,
      assignees: { create: [{ userId: devon.id }, { userId: alex.id }] },
    },
  });

  const task8 = await prisma.task.create({
    data: {
      key: 'KOR-17',
      projectId: scrumProject.id,
      title: 'Implement Dark & Light Theme Mode Customizer with Font Scaling',
      description: 'Support seamless system theme toggle, custom typography selectors (Inter, Outfit, Jakarta, JetBrains Mono), and UI density scaling.',
      issueType: 'STORY',
      priority: 'HIGH',
      statusId: statusDone.id,
      sprintId: activeSprint24.id,
      epicId: epicRealtime.id,
      reporterId: alex.id,
      storyPoints: 5,
      timeEstimateMinutes: 300,
      timeSpentMinutes: 300,
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      labelsJson: JSON.stringify(['Theming', 'UI/UX', 'Typography']),
      order: 6,
      assignees: { create: [{ userId: jordan.id }] },
    },
  });

  const task9 = await prisma.task.create({
    data: {
      key: 'KOR-18',
      projectId: scrumProject.id,
      title: 'OAuth2 Social Login Provider Integration (Google & GitHub)',
      description: 'Allow team members to sign in with their existing GitHub and Google enterprise workspace accounts.',
      issueType: 'TASK',
      priority: 'MEDIUM',
      statusId: statusTodo.id,
      sprintId: activeSprint24.id,
      epicId: epicAuth.id,
      reporterId: alex.id,
      storyPoints: 5,
      timeEstimateMinutes: 360,
      startDate: new Date(Date.now()),
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      labelsJson: JSON.stringify(['Auth', 'OAuth', 'Security']),
      order: 7,
      assignees: { create: [{ userId: maya.id }] },
    },
  });

  // Backlog tasks (SprintId = null)
  const task6 = await prisma.task.create({
    data: {
      key: 'KOR-15',
      projectId: scrumProject.id,
      title: 'Mind Map Hierarchical Node Visualizer for Complex Epics',
      description: 'ClickUp-style radial/tree mind map view allowing users to brainstorm projects, epics, tasks, and subtasks visually.',
      issueType: 'STORY',
      priority: 'LOW',
      statusId: statusBacklog.id,
      sprintId: null,
      epicId: epicRealtime.id,
      reporterId: alex.id,
      storyPoints: 8,
      labelsJson: JSON.stringify(['MindMap', 'Visualization']),
      order: 8,
      assignees: { create: [{ userId: jordan.id }] },
    },
  });

  const task7 = await prisma.task.create({
    data: {
      key: 'KOR-16',
      projectId: scrumProject.id,
      title: 'Formula Column Calculation Engine for Spreadsheet Table View',
      description: 'Support custom formula expressions (e.g. SUM, DAYS_BETWEEN, POINT_PROGRESS) inside the dense table view.',
      issueType: 'TASK',
      priority: 'MEDIUM',
      statusId: statusBacklog.id,
      sprintId: null,
      epicId: epicAutomations.id,
      reporterId: alex.id,
      storyPoints: 5,
      labelsJson: JSON.stringify(['Formulas', 'Table']),
      order: 9,
      assignees: { create: [{ userId: maya.id }] },
    },
  });

  const task10 = await prisma.task.create({
    data: {
      key: 'KOR-19',
      projectId: scrumProject.id,
      title: 'GraphQL Subscription Layer for High-Frequency Telemetry',
      description: 'Evaluate GraphQL subscriptions vs native Socket.io for handling 10k concurrent team updates.',
      issueType: 'TASK',
      priority: 'LOW',
      statusId: statusBacklog.id,
      sprintId: null,
      reporterId: devon.id,
      storyPoints: 8,
      labelsJson: JSON.stringify(['Architecture', 'Backend']),
      order: 10,
      assignees: { create: [{ userId: devon.id }] },
    },
  });

  // Task Dependencies
  await prisma.taskDependency.create({
    data: {
      taskId: task1.id,
      dependsOnTaskId: task2.id,
      type: 'BLOCKS',
    },
  });

  // Comments
  const comment1 = await prisma.comment.create({
    data: {
      taskId: task1.id,
      userId: alex.id,
      content: 'The SVG bezier path rendering looks super clean! Let’s make sure critical path nodes have an orange neon outline.',
      reactionsJson: JSON.stringify([{ emoji: '🔥', userIds: [maya.id, jordan.id] }]),
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      taskId: task1.id,
      userId: jordan.id,
      parentId: comment1.id,
      content: 'Added the critical path highlight toggle and tested with 20+ dependency links. Zero frame drops!',
      reactionsJson: JSON.stringify([{ emoji: '🚀', userIds: [alex.id] }]),
    },
  });

  // Custom Field Values
  await prisma.customFieldValue.createMany({
    data: [
      { taskId: task1.id, fieldId: cfPriorityLevel.id, valueJson: JSON.stringify('P1 - High Priority') },
      { taskId: task1.id, fieldId: cfReleaseVersion.id, valueJson: JSON.stringify('v2.4.0-rc1') },
      { taskId: task1.id, fieldId: cfClientImpact.id, valueJson: JSON.stringify('High (All Orgs)') },
      { taskId: task2.id, fieldId: cfPriorityLevel.id, valueJson: JSON.stringify('P2 - Normal') },
      { taskId: task2.id, fieldId: cfReleaseVersion.id, valueJson: JSON.stringify('v2.4.0-rc1') },
    ],
  });

  // Time Entries
  await prisma.timeEntry.createMany({
    data: [
      { taskId: task1.id, userId: jordan.id, durationMinutes: 180, description: 'Created SVG timeline bar drag handles and snapping grid', billable: true, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { taskId: task1.id, userId: jordan.id, durationMinutes: 180, description: 'Implemented dependency arrow bezier connector math', billable: true, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { taskId: task2.id, userId: maya.id, durationMinutes: 240, description: 'Multi-assignee dropdown and presence broadcast listener', billable: true, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { taskId: task3.id, userId: maya.id, durationMinutes: 300, description: 'Sprint rollover modal and backlog reordering logic', billable: true, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { taskId: task8.id, userId: jordan.id, durationMinutes: 300, description: 'Built typography preferences panel and light mode CSS variables', billable: true, date: new Date(Date.now()) },
    ],
  });

  // Activity Logs
  await prisma.activityLog.createMany({
    data: [
      { taskId: task1.id, userId: alex.id, action: 'Created task KOR-10', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { taskId: task1.id, userId: jordan.id, action: 'Moved status from To Do to In Progress', field: 'status', oldValue: 'To Do', newValue: 'In Progress', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { taskId: task1.id, userId: jordan.id, action: 'Logged 3.0h of work', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { taskId: task8.id, userId: jordan.id, action: 'Marked KOR-17 as Done', field: 'status', oldValue: 'In Progress', newValue: 'Done', createdAt: new Date(Date.now()) },
    ],
  });

  // Automations
  await prisma.automationRule.create({
    data: {
      projectId: scrumProject.id,
      name: 'Auto-Complete Sprint Tasks to Done',
      description: 'When all subtasks of a story are completed, notify the assignees.',
      triggerJson: JSON.stringify({ type: 'STATUS_CHANGED', config: { toStatusId: statusDone.id } }),
      conditionsJson: JSON.stringify([{ field: 'priority', operator: 'EQUALS', value: 'HIGH' }]),
      actionsJson: JSON.stringify([
        { type: 'POST_COMMENT', config: { message: '🎉 Great job! High priority item marked as completed.' } },
      ]),
      executionCount: 7,
      lastExecutedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  // Docs
  await prisma.doc.createMany({
    data: [
      {
        workspaceId: engWorkspace.id,
        projectId: scrumProject.id,
        title: 'Kortex Platform Architecture & Realtime Protocols',
        icon: 'Cpu',
        content: `# Kortex Cloud Architecture\n\n## Overview\nKortex provides high-throughput agile workflow tooling with sub-50ms optimistic UI synchronizations.\n\n### Key Components\n- **Real-Time WebSockets**: Socket.io partitioned by project & workspace rooms.\n- **Agile Engine**: Automatic burndown calculations and sprint rollover.\n- **Custom Automations**: Reactive event loop evaluating trigger -> condition -> actions.\n- **Light & Dark Mode**: Dynamic CSS design tokens with custom typography scaling.`,
        authorId: alex.id,
      },
      {
        workspaceId: engWorkspace.id,
        projectId: scrumProject.id,
        title: 'Sprint 24 Goals & QA Verification Matrix',
        icon: 'CheckSquare',
        content: `# Sprint 24 Release Checklist\n\n- [x] WebSockets presence badges\n- [x] Interactive Gantt timeline dependencies\n- [x] Light / Dark mode typography preferences\n- [x] Multi-filter builder with AND/OR chips\n- [ ] Slack webhook payload delivery`,
        authorId: priya.id,
      },
      {
        workspaceId: engWorkspace.id,
        projectId: scrumProject.id,
        title: 'Design System & Typography Guidelines',
        icon: 'Type',
        content: `# Typography & Appearance Guidelines\n\n- **Default Typeface**: Inter (Clean, legible, modern UI standard)\n- **Code & Sprints**: JetBrains Mono or Fira Code for technical clarity\n- **Display & Marketing**: Outfit or Plus Jakarta Sans\n- **Contrast Compliance**: WCAG AA verified in both Light and Dark modes.`,
        authorId: jordan.id,
      },
    ],
  });

  // 7. Create IT Service Desk Project with SLAs
  const itProject = await prisma.project.create({
    data: {
      workspaceId: opsWorkspace.id,
      name: 'IT Support & Cloud Operations',
      key: 'ITS',
      type: 'SERVICE_DESK',
      description: 'Enterprise IT helpdesk, access provisioning, and infrastructure incidents',
      icon: 'LifeBuoy',
      leadId: devon.id,
      estimationType: 'HOURS',
      statuses: {
        create: [
          { name: 'Open', category: 'TODO', color: '#ef4444', order: 0 },
          { name: 'Investigating', category: 'IN_PROGRESS', color: '#3b82f6', order: 1 },
          { name: 'Waiting on Vendor', category: 'IN_REVIEW', color: '#f59e0b', order: 2 },
          { name: 'Resolved', category: 'DONE', color: '#10b981', order: 3 },
        ],
      },
      views: {
        create: [
          { name: 'All Tickets', type: 'LIST', isDefault: true, configJson: JSON.stringify({ groupBy: 'status' }) },
          { name: 'Kanban Queue', type: 'BOARD', isDefault: false, configJson: JSON.stringify({}) },
        ],
      },
      slaConfig: {
        create: {
          firstResponseMinutes: 30,
          resolutionMinutes: 240, // 4 hours
          priorityModifiersJson: JSON.stringify({ URGENT: 0.25, HIGH: 0.5, MEDIUM: 1.0, LOW: 2.0 }),
        },
      },
    },
  });

  const itStatuses = await prisma.status.findMany({ where: { projectId: itProject.id } });
  const itOpenStatus = itStatuses.find((s) => s.category === 'TODO') || itStatuses[0];
  const itInvestigatingStatus = itStatuses.find((s) => s.category === 'IN_PROGRESS') || itStatuses[1];
  const itResolvedStatus = itStatuses.find((s) => s.category === 'DONE') || itStatuses[3];

  await prisma.task.createMany({
    data: [
      {
        key: 'ITS-1',
        projectId: itProject.id,
        title: 'Production Database Read Replica Latency Spike Alert',
        description: 'Replica lag exceeded 450ms in eu-west-1 availability zone. Investigate connection pooling and lock contention.',
        issueType: 'BUG',
        priority: 'URGENT',
        statusId: itOpenStatus.id,
        reporterId: devon.id,
        timeEstimateMinutes: 120,
        labelsJson: JSON.stringify(['Incident', 'Database', 'P0']),
        order: 1,
      },
      {
        key: 'ITS-2',
        projectId: itProject.id,
        title: 'SSL Certificate Auto-Renewal Expiring in 7 Days on API Gateway',
        description: 'Check Let’s Encrypt cert-manager cronjob and update wildcard SAN domains on Cloudflare.',
        issueType: 'TASK',
        priority: 'HIGH',
        statusId: itInvestigatingStatus.id,
        reporterId: devon.id,
        timeEstimateMinutes: 60,
        labelsJson: JSON.stringify(['Security', 'Infra', 'SSL']),
        order: 2,
      },
      {
        key: 'ITS-3',
        projectId: itProject.id,
        title: 'Provision Okta SAML SSO Credentials for New Engineering Cohort',
        description: 'Set up role-based group mappings for 4 new senior backend engineers in Okta and AWS IAM Identity Center.',
        issueType: 'TASK',
        priority: 'MEDIUM',
        statusId: itResolvedStatus.id,
        reporterId: alex.id,
        timeEstimateMinutes: 90,
        labelsJson: JSON.stringify(['Access', 'SSO', 'Onboarding']),
        order: 3,
      },
    ],
  });

  // 8. Create Marketing & Growth Project (MKT)
  const mktProject = await prisma.project.create({
    data: {
      workspaceId: engWorkspace.id,
      folderId: marketingFolder.id,
      name: 'Product Launch & Growth Q3',
      key: 'MKT',
      type: 'BUSINESS',
      description: 'Go-to-market campaigns, Product Hunt launch, content pipeline, and SEO',
      icon: 'TrendingUp',
      leadId: alex.id,
      estimationType: 'HOURS',
      statuses: {
        create: [
          { name: 'Idea / Draft', category: 'TODO', color: '#64748b', order: 0 },
          { name: 'In Production', category: 'IN_PROGRESS', color: '#6366f1', order: 1 },
          { name: 'Legal & Brand Review', category: 'IN_REVIEW', color: '#f59e0b', order: 2 },
          { name: 'Published', category: 'DONE', color: '#10b981', order: 3 },
        ],
      },
      views: {
        create: [
          { name: 'List', type: 'LIST', isDefault: true, configJson: JSON.stringify({ groupBy: 'status' }) },
          { name: 'Kanban Pipeline', type: 'BOARD', isDefault: false, configJson: JSON.stringify({}) },
          { name: 'Calendar Schedule', type: 'CALENDAR', isDefault: false, configJson: JSON.stringify({}) },
        ],
      },
    },
  });

  const mktStatuses = await prisma.status.findMany({ where: { projectId: mktProject.id } });
  const mktDraft = mktStatuses[0];
  const mktProduction = mktStatuses[1];
  const mktReview = mktStatuses[2];
  const mktPublished = mktStatuses[3];

  await prisma.task.createMany({
    data: [
      {
        key: 'MKT-1',
        projectId: mktProject.id,
        title: 'Product Hunt Launch Day Kit & Interactive Demo Video',
        description: 'Record 60-second video demo showing instant sprint planning and live collaborative drag-and-drop.',
        issueType: 'STORY',
        priority: 'URGENT',
        statusId: mktProduction.id,
        reporterId: alex.id,
        timeEstimateMinutes: 360,
        labelsJson: JSON.stringify(['ProductHunt', 'Launch', 'Video']),
        order: 1,
      },
      {
        key: 'MKT-2',
        projectId: mktProject.id,
        title: 'Technical Case Study: Migrating from Jira + ClickUp to Kortex',
        description: 'Publish deep-dive article detailing 4x faster page loads and integrated sprint-to-doc workflows.',
        issueType: 'TASK',
        priority: 'HIGH',
        statusId: mktReview.id,
        reporterId: alex.id,
        timeEstimateMinutes: 240,
        labelsJson: JSON.stringify(['Content', 'Blog', 'CaseStudy']),
        order: 2,
      },
      {
        key: 'MKT-3',
        projectId: mktProject.id,
        title: 'Landing Page Interactive ROI Calculator Component',
        description: 'Interactive slider allowing engineering leads to calculate developer hours saved per sprint.',
        issueType: 'TASK',
        priority: 'MEDIUM',
        statusId: mktPublished.id,
        reporterId: alex.id,
        timeEstimateMinutes: 180,
        labelsJson: JSON.stringify(['Web', 'Growth', 'Interactive']),
        order: 3,
      },
    ],
  });

  // Notifications for Alex
  await prisma.notification.createMany({
    data: [
      {
        userId: alex.id,
        title: 'Task Assigned',
        message: 'Jordan assigned you to KOR-14: Workload & Capacity Planning View',
        type: 'TASK_ASSIGNED',
        entityType: 'TASK',
        entityId: task5.id,
      },
      {
        userId: alex.id,
        title: 'New Comment',
        message: 'Jordan replied on KOR-10: "Added the critical path highlight toggle..."',
        type: 'MENTIONED',
        entityType: 'COMMENT',
        entityId: comment2.id,
      },
    ],
  });

  console.log('🎉 Kortex database successfully seeded with full agile, operations, and marketing data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
