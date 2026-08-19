import { prisma } from '../db';
import { socketManager } from '../sockets/socketManager';
import { SOCKET_EVENTS } from '@kortex/shared';

export async function logActivity(params: {
  taskId: string;
  userId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}) {
  try {
    const log = await prisma.activityLog.create({
      data: {
        taskId: params.taskId,
        userId: params.userId,
        action: params.action,
        field: params.field,
        oldValue: params.oldValue,
        newValue: params.newValue,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
      },
    });

    socketManager.broadcastToTask(params.taskId, SOCKET_EVENTS.ACTIVITY_LOGGED, log);
    return log;
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
