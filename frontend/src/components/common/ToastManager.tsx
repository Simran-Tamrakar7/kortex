import React, { useState, useEffect, useRef } from 'react';
import { socketService } from '../../api/socket';
import { SOCKET_EVENTS } from '@kortex/shared';
import { useAppStore } from '../../store/useAppStore';
import { Bell, CheckCircle2, AlertTriangle, X, Zap, ShieldAlert } from 'lucide-react';

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
  
  // Track tasks for which SLA breach was already alerted to ensure single-fire per session
  const alertedBreachesRef = useRef<Set<string>>(new Set());

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

      // Check for SLA Breach single-fire notification
      if (task.slaBreached && !alertedBreachesRef.current.has(task.id)) {
        alertedBreachesRef.current.add(task.id);
        addToast({
          title: `⚠️ SLA Target Breached: ${task.key}`,
          message: `Ticket "${task.title}" has exceeded resolution deadline.`,
          type: 'error',
          taskId: task.id,
        });
        return;
      }

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
          className={`pointer-events-auto bg-[var(--bg-card)] border rounded-2xl shadow-2xl p-3.5 flex items-start justify-between gap-3 text-xs animate-in slide-in-from-bottom-5 fade-in duration-200 transition-colors ${
            t.type === 'error'
              ? 'border-rose-400 dark:border-rose-800 ring-1 ring-rose-500/20'
              : 'border-[var(--border-default)]'
          }`}
        >
          <div
            onClick={() => t.taskId && setActiveTaskId(t.taskId)}
            className="flex items-start gap-2.5 flex-1 cursor-pointer"
          >
            <div
              className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                t.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-500/40 text-rose-600 dark:text-rose-400'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {t.type === 'error' ? <ShieldAlert className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            </div>
            <div className="space-y-0.5 min-w-0">
              <p
                className={`font-bold truncate ${
                  t.type === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-primary)]'
                }`}
              >
                {t.title}
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">{t.message}</p>
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
