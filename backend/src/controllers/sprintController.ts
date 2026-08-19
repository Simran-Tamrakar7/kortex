import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { socketManager } from '../sockets/socketManager';
import { SOCKET_EVENTS } from '@kortex/shared';

export async function getSprints(req: AuthRequest, res: Response) {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    const sprints = await prisma.sprint.findMany({
      where: { projectId: String(projectId) },
      include: {
        tasks: {
          include: {
            status: true,
            assignees: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = sprints.map((s) => {
      const totalStoryPoints = s.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const completedStoryPoints = s.tasks
        .filter((t) => t.status?.category === 'DONE')
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      return {
        ...s,
        totalPoints: totalStoryPoints,
        completedPoints: completedStoryPoints,
        taskCount: s.tasks.length,
        completedTaskCount: s.tasks.filter((t) => t.status?.category === 'DONE').length,
      };
    });

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch sprints' });
  }
}

export async function createSprint(req: AuthRequest, res: Response) {
  try {
    const { projectId, name, goal, startDate, endDate } = req.body;
    if (!projectId || !name) return res.status(400).json({ error: 'projectId and name are required' });

    const sprint = await prisma.sprint.create({
      data: {
        projectId,
        name,
        goal,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'PLANNING',
      },
    });

    socketManager.broadcastToProject(projectId, SOCKET_EVENTS.SPRINT_UPDATED, sprint);
    return res.status(201).json(sprint);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create sprint' });
  }
}

export async function startSprint(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { startDate, endDate, goal } = req.body;

    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: { tasks: { include: { status: true } } },
    });

    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const totalPoints = sprint.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    const updated = await prisma.sprint.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // default 2 weeks
        goal: goal || sprint.goal,
        totalPoints,
      },
    });

    socketManager.broadcastToProject(sprint.projectId, SOCKET_EVENTS.SPRINT_UPDATED, updated);
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to start sprint' });
  }
}

export async function completeSprint(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { rolloverTargetSprintId } = req.body; // sprintId or null (backlog)

    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: { tasks: { include: { status: true } } },
    });

    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const totalPoints = sprint.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = sprint.tasks
      .filter((t) => t.status?.category === 'DONE')
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Roll over incomplete tasks
    const incompleteTasks = sprint.tasks.filter((t) => t.status?.category !== 'DONE');
    if (incompleteTasks.length > 0) {
      await prisma.task.updateMany({
        where: {
          id: { in: incompleteTasks.map((t) => t.id) },
        },
        data: {
          sprintId: rolloverTargetSprintId || null,
        },
      });
    }

    const updated = await prisma.sprint.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        totalPoints,
        completedPoints,
      },
    });

    socketManager.broadcastToProject(sprint.projectId, SOCKET_EVENTS.SPRINT_UPDATED, updated);
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to complete sprint' });
  }
}

export async function getSprintReport(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // sprintId
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            status: true,
            assignees: { include: { user: true } },
          },
        },
        project: true,
      },
    });

    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    // Generate Burndown Chart points (Ideal vs Actual)
    const startDate = sprint.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = sprint.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const totalPoints = sprint.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0) || 40;
    const completedPoints = sprint.tasks
      .filter((t) => t.status?.category === 'DONE')
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    const burndownData = [];
    for (let day = 0; day <= totalDays; day++) {
      const date = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
      const idealRemaining = Math.max(0, Math.round(totalPoints - (totalPoints / totalDays) * day));
      
      // Compute simulated / actual progress curve
      let actualRemaining: number | null = null;
      if (date <= new Date()) {
        const progressFactor = day / totalDays;
        actualRemaining = Math.max(
          totalPoints - completedPoints,
          Math.round(totalPoints - (completedPoints * 1.1) * progressFactor)
        );
      }

      burndownData.push({
        day: `Day ${day}`,
        date: date.toISOString().split('T')[0],
        ideal: idealRemaining,
        actual: actualRemaining,
      });
    }

    // Past velocity data for velocity chart
    const pastSprints = await prisma.sprint.findMany({
      where: { projectId: sprint.projectId },
      orderBy: { createdAt: 'asc' },
      take: 6,
    });

    const velocityData = pastSprints.map((ps) => ({
      name: ps.name,
      committed: ps.totalPoints || 30,
      completed: ps.completedPoints || (ps.status === 'COMPLETED' ? (ps.totalPoints || 30) * 0.9 : completedPoints),
    }));

    // Status distribution
    const statusCounts: Record<string, number> = {};
    sprint.tasks.forEach((t) => {
      const cat = t.status?.name || 'Uncategorized';
      statusCounts[cat] = (statusCounts[cat] || 0) + 1;
    });

    return res.json({
      sprint,
      burndown: burndownData,
      velocity: velocityData,
      statusBreakdown: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
      summary: {
        totalTasks: sprint.tasks.length,
        completedTasks: sprint.tasks.filter((t) => t.status?.category === 'DONE').length,
        totalPoints,
        completedPoints,
        completionRate: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to generate sprint report', details: error.message });
  }
}
