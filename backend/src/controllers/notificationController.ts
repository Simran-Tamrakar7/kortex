import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    return res.json({ notifications, unreadCount });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    if (id === 'all') {
      await prisma.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true },
      });
    } else {
      await prisma.notification.update({
        where: { id, userId: req.user.id },
        data: { isRead: true },
      });
    }

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update notification' });
  }
}
