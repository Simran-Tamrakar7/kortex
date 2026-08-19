import React, { useState, useEffect } from 'react';
import { socketService } from '../../api/socket';
import { SOCKET_EVENTS } from '@kortex/shared';
import { useAppStore } from '../../store/useAppStore';
import { Bell, CheckCircle2, AlertTriangle, X, Zap } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  taskId?: string;
}

export const ToastManager: React.FC = () => {
  const { setActiveTaskId } = useAppStore();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const handleTaskUpdated = (task: any) => {
      if (!task) return;
      addToast({
        title: `Task Updated: ${task.key}`,
        message: task.title,
        type: 'info',
        taskId: task.id,
      });
    };

    const handleCommentAdded = (comment: any) => {
      if (!comment) return;
      addToast({
        title: 'New Comment',
        message: comment.content?.slice(0, 50) || 'A teammate posted a comment',
        type: 'info',
        taskId: comment.taskId,
      });
    };

    socketService.on(SOCKET_EVENTS.TASK_UPDATED, handleTaskUpdated);
    socketService.on(SOCKET_EVENTS.COMMENT_ADDED, handleCommentAdded);

    return () => {
      socketService.off(SOCKET_EVENTS.TASK_UPDATED);
      socketService.off(SOCKET_EVENTS.COMMENT_ADDED);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none select-none max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-3.5 flex items-start justify-between gap-3 text-xs animate-in slide-in-from-bottom-5 fade-in duration-200 transition-colors"
        >
          <div
            onClick={() => t.taskId && setActiveTaskId(t.taskId)}
            className="flex items-start gap-2.5 flex-1 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="font-bold text-[var(--text-primary)] truncate">{t.title}</p>
              <p className="text-[11px] text-[var(--text-secondary)] truncate">{t.message}</p>
            </div>
          </div>

          <button
            onClick={() => removeToast(t.id)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
