import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export async function getDashboardData(req: AuthRequest, res: Response) {
  try {
    const { projectId, orgId } = req.query;

    const taskWhere: any = { isArchived: false };
    if (projectId) taskWhere.projectId = String(projectId);
    else if (orgId) {
      taskWhere.project = { workspace: { orgId: String(orgId) } };
    }

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      include: {
        status: true,
        assignees: { include: { user: true } },
        project: true,
        sprint: true,
      },
    });

    // 1. Status Breakdown
    const statusMap: Record<string, { count: number; color: string }> = {};
    tasks.forEach((t) => {
      const name = t.status?.name || 'Unassigned';
      const color = t.status?.color || '#64748b';
      if (!statusMap[name]) statusMap[name] = { count: 0, color };
      statusMap[name].count += 1;
    });

    const statusBreakdown = Object.entries(statusMap).map(([name, data]) => ({
      name,
      value: data.count,
      color: data.color,
    }));

    // 2. Priority Distribution
    const priorityCounts: Record<string, number> = { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    tasks.forEach((t) => {
      const p = t.priority || 'MEDIUM';
      priorityCounts[p] = (priorityCounts[p] || 0) + 1;
    });

    const priorityBreakdown = [
      { name: 'Urgent', value: priorityCounts.URGENT, color: '#ef4444' },
      { name: 'High', value: priorityCounts.HIGH, color: '#f97316' },
      { name: 'Medium', value: priorityCounts.MEDIUM, color: '#eab308' },
      { name: 'Low', value: priorityCounts.LOW, color: '#64748b' },
    ];

    // 3. Workload Capacity per Assignee
    const userWorkload: Record<string, { name: string; avatarUrl?: string; taskCount: number; points: number; hours: number }> = {};
    tasks.forEach((t) => {
      t.assignees.forEach((a) => {
        if (!userWorkload[a.userId]) {
          userWorkload[a.userId] = {
            name: a.user.name,
            avatarUrl: a.user.avatarUrl || undefined,
            taskCount: 0,
            points: 0,
            hours: 0,
          };
        }
        userWorkload[a.userId].taskCount += 1;
        userWorkload[a.userId].points += t.storyPoints || 0;
        userWorkload[a.userId].hours += (t.timeEstimateMinutes || 0) / 60;
      });
    });

    const workloadList = Object.entries(userWorkload).map(([userId, data]) => ({
      userId,
      ...data,
      capacityHours: 40, // standard weekly capacity
      allocationPercentage: Math.min(150, Math.round((data.hours / 40) * 100)),
    }));

    // 4. Overdue Tasks
    const now = new Date();
    const overdueTasks = tasks
      .filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status?.category !== 'DONE')
      .map((t) => ({
        id: t.id,
        key: t.key,
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status?.name,
      }));

    // 5. Time Tracking Summary
    const timeEntries = await prisma.timeEntry.findMany({
      where: projectId ? { task: { projectId: String(projectId) } } : {},
      include: { user: true, task: true },
      orderBy: { date: 'desc' },
      take: 20,
    });

    const totalMinutes = timeEntries.reduce((sum, te) => sum + te.durationMinutes, 0);
    const billableMinutes = timeEntries.filter((te) => te.billable).reduce((sum, te) => sum + te.durationMinutes, 0);

    // 6. Recent Activity
    const recentLogs = await prisma.activityLog.findMany({
      where: projectId ? { task: { projectId: String(projectId) } } : {},
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        task: { select: { id: true, key: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return res.json({
      summary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.status?.category === 'DONE').length,
        inProgressTasks: tasks.filter((t) => t.status?.category === 'IN_PROGRESS').length,
        overdueCount: overdueTasks.length,
        totalHoursLogged: Math.round((totalMinutes / 60) * 10) / 10,
        billableHoursLogged: Math.round((billableMinutes / 60) * 10) / 10,
      },
      statusBreakdown,
      priorityBreakdown,
      workload: workloadList,
      overdueTasks,
      recentActivity: recentLogs,
      timeEntries,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch dashboard data', details: error.message });
  }
}

export async function getCustomDashboards(req: AuthRequest, res: Response) {
  try {
    const { projectId, orgId } = req.query;
    const where: any = {};
    if (projectId) where.projectId = String(projectId);
    if (orgId) where.orgId = String(orgId);

    const dashboards = await prisma.dashboard.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const formatted = dashboards.map((d) => {
      let widgets = [];
      try { widgets = JSON.parse(d.widgetsJson); } catch (e) {}
      return { ...d, widgets };
    });

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch dashboards' });
  }
}

export async function saveDashboard(req: AuthRequest, res: Response) {
  try {
    const { id, projectId, orgId, name, widgets } = req.body;
    let dashboard;

    if (id) {
      dashboard = await prisma.dashboard.update({
        where: { id },
        data: {
          name,
          widgetsJson: JSON.stringify(widgets || []),
        },
      });
    } else {
      dashboard = await prisma.dashboard.create({
        data: {
          projectId: projectId || null,
          orgId: orgId || null,
          name: name || 'Overview Dashboard',
          widgetsJson: JSON.stringify(widgets || []),
        },
      });
    }

    return res.json(dashboard);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to save dashboard' });
  }
}
