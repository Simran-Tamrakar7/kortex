import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../services/activityService';

export async function getTimeEntries(req: AuthRequest, res: Response) {
  try {
    const { taskId, projectId, userId, startDate, endDate } = req.query;

    const where: any = {};
    if (taskId) where.taskId = String(taskId);
    if (userId) where.userId = String(userId);
    if (projectId) where.task = { projectId: String(projectId) };
    if (startDate && endDate) {
      where.date = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate)),
      };
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        task: { select: { id: true, key: true, title: true, projectId: true } },
      },
      orderBy: { date: 'desc' },
    });

    const totalMinutes = entries.reduce((acc, e) => acc + e.durationMinutes, 0);
    const billableMinutes = entries.filter((e) => e.billable).reduce((acc, e) => acc + e.durationMinutes, 0);

    return res.json({
      entries,
      summary: {
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        billableMinutes,
        billableHours: Math.round((billableMinutes / 60) * 10) / 10,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch time entries' });
  }
}

export async function logTime(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { taskId, durationMinutes, description, billable, date } = req.body;

    if (!taskId || !durationMinutes) {
      return res.status(400).json({ error: 'taskId and durationMinutes are required' });
    }

    const entry = await prisma.timeEntry.create({
      data: {
        taskId,
        userId: req.user.id,
        durationMinutes: Number(durationMinutes),
        description,
        billable: billable !== undefined ? !!billable : true,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Update task's cumulative timeSpentMinutes
    await prisma.task.update({
      where: { id: taskId },
      data: {
        timeSpentMinutes: { increment: Number(durationMinutes) },
      },
    });

    await logActivity({
      taskId,
      userId: req.user.id,
      action: `Logged ${Math.round((durationMinutes / 60) * 10) / 10}h of work${description ? ` ("${description}")` : ''}`,
    });

    return res.status(201).json(entry);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to log time', details: error.message });
  }
}

export async function deleteTimeEntry(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) return res.status(404).json({ error: 'Time entry not found' });

    // Decrement from task
    await prisma.task.update({
      where: { id: entry.taskId },
      data: {
        timeSpentMinutes: { decrement: entry.durationMinutes },
      },
    });

    await prisma.timeEntry.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete time entry' });
  }
}
