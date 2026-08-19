import { Server as SocketIOServer, Socket } from 'socket.io';
import { SOCKET_EVENTS, UserPresence } from '@kortex/shared';

export class SocketManager {
  private io: SocketIOServer | null = null;
  private activePresences: Map<string, UserPresence> = new Map(); // socketId -> presence

  public init(io: SocketIOServer) {
    this.io = io;

    io.on('connection', (socket: Socket) => {
      // Room joining
      socket.on(SOCKET_EVENTS.JOIN_WORKSPACE, (workspaceId: string) => {
        socket.join(`workspace:${workspaceId}`);
      });

      socket.on(SOCKET_EVENTS.LEAVE_WORKSPACE, (workspaceId: string) => {
        socket.leave(`workspace:${workspaceId}`);
      });

      socket.on(SOCKET_EVENTS.JOIN_PROJECT, (projectId: string) => {
        socket.join(`project:${projectId}`);
      });

      socket.on(SOCKET_EVENTS.LEAVE_PROJECT, (projectId: string) => {
        socket.leave(`project:${projectId}`);
      });

      socket.on(SOCKET_EVENTS.JOIN_TASK, (taskId: string) => {
        socket.join(`task:${taskId}`);
      });

      socket.on(SOCKET_EVENTS.LEAVE_TASK, (taskId: string) => {
        socket.leave(`task:${taskId}`);
      });

      // Presence
      socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, (data: Partial<UserPresence>) => {
        if (!data.userId) return;
        const presence: UserPresence = {
          userId: data.userId,
          name: data.name || 'User',
          avatarUrl: data.avatarUrl,
          currentLocation: data.currentLocation,
          lastSeen: new Date().toISOString(),
        };
        this.activePresences.set(socket.id, presence);

        if (data.currentLocation?.projectId) {
          this.broadcastToProject(data.currentLocation.projectId, SOCKET_EVENTS.PRESENCE_SYNC, this.getProjectPresences(data.currentLocation.projectId));
        }
      });

      // Typing indicators
      socket.on(SOCKET_EVENTS.USER_TYPING, (data: { taskId: string; userId: string; name: string; isTyping: boolean }) => {
        socket.to(`task:${data.taskId}`).emit(SOCKET_EVENTS.USER_TYPING, data);
      });

      socket.on('disconnect', () => {
        const presence = this.activePresences.get(socket.id);
        if (presence?.currentLocation?.projectId) {
          const projectId = presence.currentLocation.projectId;
          this.activePresences.delete(socket.id);
          this.broadcastToProject(projectId, SOCKET_EVENTS.PRESENCE_SYNC, this.getProjectPresences(projectId));
        } else {
          this.activePresences.delete(socket.id);
        }
      });
    });
  }

  private getProjectPresences(projectId: string): UserPresence[] {
    const list: UserPresence[] = [];
    const seenUsers = new Set<string>();

    for (const p of this.activePresences.values()) {
      if (p.currentLocation?.projectId === projectId && !seenUsers.has(p.userId)) {
        seenUsers.add(p.userId);
        list.push(p);
      }
    }
    return list;
  }

  public broadcastToProject(projectId: string, event: string, payload: any) {
    if (this.io) {
      this.io.to(`project:${projectId}`).emit(event, payload);
    }
  }

  public broadcastToWorkspace(workspaceId: string, event: string, payload: any) {
    if (this.io) {
      this.io.to(`workspace:${workspaceId}`).emit(event, payload);
    }
  }

  public broadcastToTask(taskId: string, event: string, payload: any) {
    if (this.io) {
      this.io.to(`task:${taskId}`).emit(event, payload);
    }
  }

  public sendToUser(userId: string, event: string, payload: any) {
    if (this.io) {
      this.io.emit(`${event}:${userId}`, payload);
    }
  }
}

export const socketManager = new SocketManager();
