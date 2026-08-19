import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@kortex/shared';

class SocketService {
  public socket: Socket | null = null;

  public connect() {
    if (this.socket && this.socket.connected) return;

    this.socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Connected to Kortex real-time server');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from Kortex real-time server');
    });
  }

  public joinWorkspace(workspaceId: string) {
    this.socket?.emit(SOCKET_EVENTS.JOIN_WORKSPACE, workspaceId);
  }

  public leaveWorkspace(workspaceId: string) {
    this.socket?.emit(SOCKET_EVENTS.LEAVE_WORKSPACE, workspaceId);
  }

  public joinProject(projectId: string) {
    this.socket?.emit(SOCKET_EVENTS.JOIN_PROJECT, projectId);
  }

  public leaveProject(projectId: string) {
    this.socket?.emit(SOCKET_EVENTS.LEAVE_PROJECT, projectId);
  }

  public joinTask(taskId: string) {
    this.socket?.emit(SOCKET_EVENTS.JOIN_TASK, taskId);
  }

  public leaveTask(taskId: string) {
    this.socket?.emit(SOCKET_EVENTS.LEAVE_TASK, taskId);
  }

  public updatePresence(presence: any) {
    this.socket?.emit(SOCKET_EVENTS.PRESENCE_UPDATE, presence);
  }

  public sendTyping(data: { taskId: string; userId: string; name: string; isTyping: boolean }) {
    this.socket?.emit(SOCKET_EVENTS.USER_TYPING, data);
  }

  public on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  public off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }
}

export const socketService = new SocketService();
