import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../services/activityService';
import { socketManager } from '../sockets/socketManager';
import { SOCKET_EVENTS } from '@kortex/shared';

export async function getWebhooks(req: AuthRequest, res: Response) {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    const webhooks = await prisma.webhook.findMany({
      where: { projectId: String(projectId) },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = webhooks.map((w) => {
      let events = [];
      try { events = JSON.parse(w.eventsJson); } catch (e) {}
      return { ...w, events };
    });

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
}

export async function createWebhook(req: AuthRequest, res: Response) {
  try {
    const { projectId, name, url, secret, events, isActive } = req.body;
    if (!projectId || !name || !url) {
      return res.status(400).json({ error: 'projectId, name, and url are required' });
    }

    const webhook = await prisma.webhook.create({
      data: {
        projectId,
        name,
        url,
        secret,
        eventsJson: JSON.stringify(events || ['task.created', 'task.updated']),
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });

    return res.status(201).json(webhook);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create webhook' });
  }
}

export async function deleteWebhook(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.webhook.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete webhook' });
  }
}

// GitHub / GitLab commit / PR integration simulator
export async function handleGitHubWebhook(req: AuthRequest, res: Response) {
  try {
    const { projectId, commitMessage, prTitle, action, author } = req.body;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    const textToMatch = `${commitMessage || ''} ${prTitle || ''}`;
    // Extract task keys e.g. KOR-101, KOR-42
    const keyMatches = textToMatch.match(/[A-Z]{2,10}-\d+/g);

    if (!keyMatches || !keyMatches.length) {
      return res.json({ message: 'No task keys found in commit/PR' });
    }

    const updatedTasks = [];
    for (const key of keyMatches) {
      const task = await prisma.task.findFirst({
        where: { projectId, key },
        include: { status: true, project: { include: { statuses: true } } },
      });

      if (task) {
        // Find review or done status
        let targetStatus = task.project.statuses.find((s) => s.category === 'IN_REVIEW');
        if (action === 'closed' || action === 'merged') {
          targetStatus = task.project.statuses.find((s) => s.category === 'DONE') || targetStatus;
        }

        if (targetStatus && targetStatus.id !== task.statusId) {
          await prisma.task.update({
            where: { id: task.id },
            data: { statusId: targetStatus.id },
          });

          await logActivity({
            taskId: task.id,
            userId: req.user?.id || task.reporterId,
            action: `GitHub Integration: PR/Commit by ${author || 'developer'} transitioned task to ${targetStatus.name}`,
          });

          socketManager.broadcastToProject(projectId, SOCKET_EVENTS.TASK_UPDATED, {
            ...task,
            statusId: targetStatus.id,
            status: targetStatus,
          });

          updatedTasks.push(task.key);
        }
      }
    }

    return res.json({
      success: true,
      message: `Processed GitHub event. Updated tasks: ${updatedTasks.join(', ') || 'None'}`,
      updatedTasks,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to process GitHub event', details: error.message });
  }
}
