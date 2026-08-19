import { prisma } from '../db';
import { socketManager } from '../sockets/socketManager';
import { SOCKET_EVENTS } from '@kortex/shared';

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: 'TASK_ASSIGNED' | 'MENTIONED' | 'STATUS_CHANGED' | 'DUE_SOON' | 'SLA_BREACH' | 'SYSTEM';
  entityType?: 'TASK' | 'PROJECT' | 'COMMENT' | 'DOC';
  entityId?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        entityType: params.entityType,
        entityId: params.entityId,
      },
    });

    socketManager.sendToUser(params.userId, SOCKET_EVENTS.NOTIFICATION_RECEIVED, notification);
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
