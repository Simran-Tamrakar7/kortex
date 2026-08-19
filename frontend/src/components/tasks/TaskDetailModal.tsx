import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  useTask,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useCreateCommentMutation,
  useProject,
  useSprints,
} from '../../api/queries';
import { IssueTypeBadge } from '../common/IssueTypeBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Avatar } from '../common/Avatar';
import { Priority, IssueType } from '@kortex/shared';
import {
  X,
  Trash2,
  Calendar,
  Clock,
  CheckSquare,
  Paperclip,
  Send,
  User,
  Tag,
  Link,
  Shield,
  Layers,
  Sparkles,
  Smile,
  Play,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';

export const TaskDetailModal: React.FC = () => {
  const { activeTaskId, setActiveTaskId, activeProjectId, startTimer } = useAppStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useTask(activeTaskId);
  const comments = task?.comments || [];
  const { data: project } = useProject(activeProjectId);
  const { data: sprints = [] } = useSprints(activeProjectId);

  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();
  const createCommentMutation = useCreateCommentMutation();

  const [newComment, setNewComment] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');

  if (!activeTaskId || !task) return null;

  const statuses = project?.statuses || [];
  const epics = (project as any)?.epics || [];

  const handleUpdate = (field: string, value: any) => {
    updateTaskMutation.mutate({
      id: task.id,
      [field]: value,
    });
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this issue?')) {
      await deleteTaskMutation.mutateAsync(task.id);
      setActiveTaskId(null);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await createCommentMutation.mutateAsync({
      taskId: task.id,
      content: newComment.trim(),
    });
    setNewComment('');
  };

  const handleToggleChecklist = (index: number) => {
    const items = [...(task.checklists || [])];
    items[index] = { ...items[index], completed: !items[index].completed };
    handleUpdate('checklists', items);
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const items = [...(task.checklists || []), { id: `chk-${Date.now()}`, text: newChecklistText.trim(), completed: false }];
    handleUpdate('checklists', items);
    setNewChecklistText('');
  };

  const handleRemoveChecklist = (index: number) => {
    const items = [...(task.checklists || [])];
    items.splice(index, 1);
    handleUpdate('checklists', items);
  };

  const handleAddReaction = async (commentId: string, emoji: string) => {
    try {
      await apiClient.post(`/comments/${commentId}/reactions`, { emoji });
      queryClient.invalidateQueries({ queryKey: ['comments', task.id] });
    } catch (e) {}
  };

  const completedChecklistCount = (task.checklists || []).filter((c: any) => c.completed).length;
  const totalChecklistCount = (task.checklists || []).length;
  const checklistProgress = totalChecklistCount ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-3xl h-full bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-2xl flex flex-col overflow-hidden text-xs transition-colors">
        {/* Top Header */}
        <div className="h-14 px-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)] shrink-0">
          <div className="flex items-center gap-2.5">
            <IssueTypeBadge type={task.issueType} />
            <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{task.key}</span>
            {task.epic && (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                ⚡ {task.epic.key}: {task.epic.title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Start Stop-watch timer button */}
            <button
              onClick={() => startTimer({ id: task.id, key: task.key, title: task.title })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-default)] font-semibold transition-colors shadow-sm"
              title="Start Live Stopwatch"
            >
              <Play className="w-3.5 h-3.5 text-emerald-500 fill-current" />
              <span>Track Time</span>
            </button>

            <button
              onClick={handleDelete}
              className="p-2 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Delete Issue"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTaskId(null)}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SLA Breach Alert Banner if active and breached */}
        {task.slaBreached && (
          <div className="bg-rose-500/15 border-b border-rose-500/30 px-6 py-2 flex items-center justify-between text-rose-600 dark:text-rose-400 font-semibold animate-pulse">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>SLA Target Breached: Resolution time exceeded customer contract</span>
            </span>
          </div>
        )}

        {/* Drawer Body Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Main Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Task Title */}
            <div>
              {isEditingTitle ? (
                <input
                  type="text"
                  autoFocus
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={() => {
                    if (titleValue.trim() && titleValue !== task.title) {
                      handleUpdate('title', titleValue.trim());
                    }
                    setIsEditingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (titleValue.trim() && titleValue !== task.title) {
                        handleUpdate('title', titleValue.trim());
                      }
                      setIsEditingTitle(false);
                    }
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  className="w-full text-base font-bold bg-[var(--bg-input)] text-[var(--text-primary)] border border-indigo-500 rounded-lg p-2 outline-none"
                />
              ) : (
                <h2
                  onClick={() => {
                    setTitleValue(task.title);
                    setIsEditingTitle(true);
                  }}
                  className="text-base font-bold text-[var(--text-primary)] hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer p-1 rounded transition-colors"
                >
                  {task.title}
                </h2>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">Description</span>
              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    rows={6}
                    value={descValue}
                    onChange={(e) => setDescValue(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-indigo-500 rounded-lg p-3 text-xs text-[var(--text-primary)] outline-none resize-none font-mono"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingDesc(false)}
                      className="px-3 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleUpdate('description', descValue);
                        setIsEditingDesc(false);
                      }}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium"
                    >
                      Save Description
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setDescValue(task.description || '');
                    setIsEditingDesc(true);
                  }}
                  className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-indigo-500/50 cursor-pointer text-xs text-[var(--text-secondary)] whitespace-pre-wrap min-h-[70px] transition-colors leading-relaxed"
                >
                  {task.description || 'Click to add a detailed description, acceptance criteria, or repro steps...'}
                </div>
              )}
            </div>

            {/* Checklists */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Acceptance Checklist ({completedChecklistCount}/{totalChecklistCount})</span>
                </span>
                <span className="text-[11px] font-mono text-[var(--text-muted)] font-bold">{checklistProgress}%</span>
              </div>

              {/* Progress Bar */}
              {totalChecklistCount > 0 && (
                <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${checklistProgress}%` }}
                  />
                </div>
              )}

              {/* Checklist Items */}
              <div className="space-y-1.5">
                {(task.checklists || []).map((item: any, index: number) => (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] group"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pr-2">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklist(index)}
                        className="rounded border-[var(--border-default)] bg-[var(--bg-input)] text-indigo-600 focus:ring-0"
                      />
                      <span className={`text-xs ${item.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                        {item.text}
                      </span>
                    </label>
                    <button
                      onClick={() => handleRemoveChecklist(index)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-rose-500 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add Checklist Item Input */}
                <form onSubmit={handleAddChecklist} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add checklist item..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    className="flex-1 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>

            {/* Comments & Activity Tab Container */}
            <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-2 text-xs">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`font-bold transition-colors ${
                    activeTab === 'comments' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 pb-1' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Discussion & Comments ({comments.length})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`font-bold transition-colors ${
                    activeTab === 'activity' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 pb-1' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Audit History
                </button>
              </div>

              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {/* New comment form */}
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <Avatar name={user?.name} avatarUrl={user?.avatarUrl} size="sm" />
                    <div className="flex-1 space-y-2">
                      <textarea
                        rows={2}
                        placeholder="Write a comment or mention @teammate..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl p-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-indigo-500 resize-none"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow text-xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>Post Comment</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Comments list */}
                  <div className="space-y-3">
                    {comments.map((c: any) => (
                      <div key={c.id} className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar name={c.author?.name} avatarUrl={c.author?.avatarUrl} size="xs" />
                            <span className="font-bold text-[var(--text-primary)]">{c.author?.name}</span>
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">{c.content}</p>

                        {/* Emoji Reactions */}
                        <div className="flex items-center gap-1.5 pt-1">
                          {['👍', '🚀', '🔥', '❤️', '👀'].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleAddReaction(c.id, emoji)}
                              className="px-2 py-0.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[11px] transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-2 text-[11px]">
                  {(task.activityLogs || []).map((log: any) => (
                    <div key={log.id} className="flex items-center gap-2 text-[var(--text-secondary)] py-1">
                      <Avatar name={log.user?.name} avatarUrl={log.user?.avatarUrl} size="xs" />
                      <span>
                        <strong className="text-[var(--text-primary)]">{log.user?.name}</strong> {log.action}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono ml-auto">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Meta fields & Status */}
          <div className="w-72 border-l border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 space-y-5 shrink-0 overflow-y-auto">
            {/* Status Picker */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Status</label>
              <select
                value={task.statusId}
                onChange={(e) => handleUpdate('statusId', e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              >
                {statuses.map((s: any) => (
                  <option key={s.id} value={s.id} className="bg-[var(--bg-card)]">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Picker */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Priority</label>
              <select
                value={task.priority}
                onChange={(e) => handleUpdate('priority', e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              >
                <option value="URGENT">🔴 Urgent</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">⚪ Low</option>
              </select>
            </div>

            {/* Story Points */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Story Points (Fibonacci)</label>
              <input
                type="number"
                value={task.storyPoints ?? ''}
                placeholder="Unestimated"
                onChange={(e) => handleUpdate('storyPoints', e.target.value === '' ? null : Number(e.target.value))}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none font-mono"
              />
            </div>

            {/* Sprint */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Sprint</label>
              <select
                value={task.sprintId || ''}
                onChange={(e) => handleUpdate('sprintId', e.target.value || null)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              >
                <option value="">📦 Backlog (No Sprint)</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[var(--bg-card)]">
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Due Date</label>
              <input
                type="date"
                value={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ''}
                onChange={(e) => handleUpdate('dueDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              />
            </div>

            {/* Assignees */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Assignees</label>
              <div className="space-y-1.5">
                {task.assignees?.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <Avatar name={a.name} avatarUrl={a.avatarUrl} size="xs" />
                    <span className="font-semibold text-[var(--text-primary)]">{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
