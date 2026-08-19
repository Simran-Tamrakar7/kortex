import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { socketManager } from '../sockets/socketManager';
import { createNotification } from '../services/notificationService';
import { logActivity } from '../services/activityService';
import { SOCKET_EVENTS } from '@kortex/shared';

export async function createComment(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { taskId, content, parentId } = req.body;

    if (!taskId || !content) {
      return res.status(400).json({ error: 'taskId and content are required' });
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId: req.user.id,
        parentId: parentId || null,
        content,
        reactionsJson: '[]',
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignees: true, watchers: true },
    });

    if (task) {
      // Activity log
      await logActivity({
        taskId,
        userId: req.user.id,
        action: `Commented: "${content.slice(0, 40)}${content.length > 40 ? '...' : ''}"`,
      });

      // Notify watchers & assignees
      const recipientIds = new Set<string>();
      task.assignees.forEach((a) => recipientIds.add(a.userId));
      task.watchers.forEach((w) => recipientIds.add(w.userId));
      recipientIds.delete(req.user.id);

      for (const uid of recipientIds) {
        await createNotification({
          userId: uid,
          title: `New Comment on ${task.key}`,
          message: `${req.user.name}: ${content.slice(0, 80)}`,
          type: 'MENTIONED',
          entityType: 'COMMENT',
          entityId: comment.id,
        });
      }

      socketManager.broadcastToTask(taskId, SOCKET_EVENTS.COMMENT_ADDED, comment);
      socketManager.broadcastToProject(task.projectId, SOCKET_EVENTS.COMMENT_ADDED, comment);
    }

    return res.status(201).json(comment);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create comment', details: error.message });
  }
}

export async function toggleReaction(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params; // commentId
    const { emoji } = req.body;

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    let reactions: { emoji: string; userIds: string[] }[] = [];
    try {
      reactions = comment.reactionsJson ? JSON.parse(comment.reactionsJson) : [];
    } catch (e) {}

    const existingIndex = reactions.findIndex((r) => r.emoji === emoji);
    if (existingIndex >= 0) {
      const userIndex = reactions[existingIndex].userIds.indexOf(req.user.id);
      if (userIndex >= 0) {
        reactions[existingIndex].userIds.splice(userIndex, 1);
        if (reactions[existingIndex].userIds.length === 0) {
          reactions.splice(existingIndex, 1);
        }
      } else {
        reactions[existingIndex].userIds.push(req.user.id);
      }
    } else {
      reactions.push({ emoji, userIds: [req.user.id] });
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { reactionsJson: JSON.stringify(reactions) },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    socketManager.broadcastToTask(comment.taskId, SOCKET_EVENTS.COMMENT_ADDED, updated);
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to toggle reaction' });
  }
}

export async function deleteComment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.comment.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
}
