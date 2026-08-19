import { create } from 'zustand';
import { UserPresence } from '@kortex/shared';

interface PresenceState {
  onlineUsers: UserPresence[];
  typingUsers: { taskId: string; userId: string; name: string }[];
  setOnlineUsers: (users: UserPresence[]) => void;
  setTyping: (data: { taskId: string; userId: string; name: string; isTyping: boolean }) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUsers: [],
  typingUsers: [],

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  setTyping: (data) => {
    set((state) => {
      if (data.isTyping) {
        const filtered = state.typingUsers.filter(
          (u) => !(u.taskId === data.taskId && u.userId === data.userId)
        );
        return { typingUsers: [...filtered, { taskId: data.taskId, userId: data.userId, name: data.name }] };
      } else {
        return {
          typingUsers: state.typingUsers.filter(
            (u) => !(u.taskId === data.taskId && u.userId === data.userId)
          ),
        };
      }
    });
  },
}));
