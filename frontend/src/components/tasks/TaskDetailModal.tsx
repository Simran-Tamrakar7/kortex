import React, { useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  useTask,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useCreateCommentMutation,
  useCreateTaskMutation,
  useProject,
  useSprints,
  useTasks,
} from '../../api/queries';
import { IssueTypeBadge } from '../common/IssueTypeBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Avatar } from '../common/Avatar';
import { Priority, IssueType } from '@kortex/shared';
import { sanitizePlainText, TITLE_MAX, DESC_MAX, COMMENT_MAX } from '../../lib/sanitizeText';
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
  GitPullRequest,
  Download,
  FileText,
  Image,
  ArrowRight,
  GitCommit,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';

export const TaskDetailModal: React.FC = () => {
  const { activeTaskId, setActiveTaskId, activeProjectId, startTimer } = useAppStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useTask(activeTaskId);
  const rawTask: any = task;
  const comments = rawTask?.comments || [];
  const { data: project } = useProject(activeProjectId);
  const { data: sprints = [] } = useSprints(activeProjectId);
  const { data: allTasks = [] } = useTasks(activeProjectId);

  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();
  const createCommentMutation = useCreateCommentMutation();
  const createTaskMutation = useCreateTaskMutation();

  const [newComment, setNewComment] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isAddingDep, setIsAddingDep] = useState(false);
  const [depTaskId, setDepTaskId] = useState('');
  const [depType, setDepType] = useState('BLOCKS');

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'subtasks' | 'attachments'>('comments');

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  if (!activeTaskId || !task) return null;

  const statuses = project?.statuses || [];
  const epics = (project as any)?.epics || [];
  const subtasks = rawTask.subtasks || [];
  const attachments = rawTask.attachments || [];
  const dependencies = rawTask.dependencies || [];
  const dependentOnBy = rawTask.dependentOnBy || [];
  const activityLogs = rawTask.activityLogs || [];

  const teamMembers = [
    { id: 'usr_alex', name: 'Alex Rivera', role: 'Product Lead' },
    { id: 'usr_maya', name: 'Maya Lin', role: 'Fullstack Dev' },
    { id: 'usr_jordan', name: 'Jordan Smith', role: 'Frontend Architect' },
    { id: 'usr_devon', name: 'Devon Vance', role: 'DevOps Lead' },
    { id: 'usr_priya', name: 'Priya Patel', role: 'QA Lead' },
  ];

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
    const content = sanitizePlainText(newComment, COMMENT_MAX).trim();
    if (!content) return;
    await createCommentMutation.mutateAsync({
      taskId: task.id,
      content,
    });
    setNewComment('');
    setMentionQuery(null);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = sanitizePlainText(e.target.value, COMMENT_MAX);
    setNewComment(val);

    // Check for @mention trigger
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf('@');
    if (lastAt !== -1 && !textBeforeCursor.slice(lastAt).includes(' ')) {
      setMentionQuery(textBeforeCursor.slice(lastAt + 1).toLowerCase());
    } else {
      setMentionQuery(null);
    }
  };

  const handleSelectMention = (memberName: string) => {
    if (!commentInputRef.current) return;
    const cursor = commentInputRef.current.selectionStart;
    const textBeforeCursor = newComment.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = newComment.slice(cursor);
    const updated = textBeforeCursor.slice(0, lastAt) + `@${memberName} ` + textAfterCursor;
    setNewComment(updated);
    setMentionQuery(null);
    commentInputRef.current.focus();
  };

  const handleToggleChecklist = (index: number) => {
    const items: any[] = [...(task.checklists || [])];
    const currentVal = items[index].isCompleted ?? items[index].completed ?? false;
    items[index] = { ...items[index], isCompleted: !currentVal, completed: !currentVal };
    handleUpdate('checklists', items);
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const items: any[] = [...(task.checklists || []), { id: `chk-${Date.now()}`, text: newChecklistText.trim(), isCompleted: false, completed: false }];
    handleUpdate('checklists', items);
    setNewChecklistText('');
  };

  const handleRemoveChecklist = (index: number) => {
    const items: any[] = [...(task.checklists || [])];
    items.splice(index, 1);
    handleUpdate('checklists', items);
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !activeProjectId) return;
    await createTaskMutation.mutateAsync({
      projectId: activeProjectId,
      parentId: task.id,
      title: newSubtaskTitle.trim(),
      issueType: 'SUBTASK',
      priority: 'MEDIUM',
    });
    setNewSubtaskTitle('');
    setIsAddingSubtask(false);
    queryClient.invalidateQueries({ queryKey: ['task', task.id] });
  };

  const handleAddDependency = async () => {
    if (!depTaskId || depTaskId === task.id) return;
    try {
      await apiClient.post('/tasks/dependencies', {
        taskId: task.id,
        dependsOnTaskId: depTaskId,
        type: depType,
      });
      setIsAddingDep(false);
      setDepTaskId('');
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
    } catch (e) {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', task.id);
      await apiClient.post('/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
    } catch (e) {} finally {
      setIsUploadingFile(false);
    }
  };

  const handleAddReaction = async (commentId: string, emoji: string) => {
    try {
      await apiClient.put(`/comments/${commentId}/react`, { emoji });
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
    } catch (e) {}
  };

  const completedChecklistCount = (task.checklists || []).filter((c: any) => c.isCompleted ?? c.completed).length;
  const totalChecklistCount = (task.checklists || []).length;
  const checklistProgress = totalChecklistCount ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;

  const completedSubtasksCount = subtasks.filter((s: any) => s.status?.category === 'DONE').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-3xl h-full bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-2xl flex flex-col overflow-hidden text-xs transition-colors">
        {/* Top Header */}
        <div className="h-14 px-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)] shrink-0">
          <div className="flex items-center gap-2.5">
            <IssueTypeBadge type={task.issueType} />
            <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{task.key}</span>
            {task.epic && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                ⚡ {task.epic.key}: {task.epic.title}
              </span>
            )}
            {task.parent && (
              <button
                onClick={() => task.parent?.id && setActiveTaskId(task.parent.id)}
                className="px-2 py-0.5 rounded text-xs font-semibold bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)]"
              >
                Subtask of {task.parent.key}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Start Stopwatch timer button */}
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
              title="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body Grid: Left Content (65%), Right Meta (35%) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Main Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-[var(--border-subtle)]">
            {/* SLA Alert Badge if active/breached */}
            {task.slaBreached && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-xl flex items-center justify-between text-rose-700 dark:text-rose-300 shadow-sm animate-pulse">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-500" />
                  <span className="font-bold">Incident SLA Target Breached!</span>
                </div>
                <span className="text-xs font-mono uppercase px-2 py-0.5 bg-rose-200 dark:bg-rose-900 rounded font-bold">
                  Immediate Action Required
                </span>
              </div>
            )}

            {/* Title Editing */}
            <div className="space-y-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    maxLength={TITLE_MAX}
                    value={titleValue}
                    onChange={(e) => setTitleValue(sanitizePlainText(e.target.value, TITLE_MAX))}
                    className="flex-1 bg-[var(--bg-input)] border border-indigo-500 rounded-lg px-3 py-1.5 text-sm font-bold text-[var(--text-primary)] outline-none"
                  />
                  <button
                    onClick={() => {
                      const next = sanitizePlainText(titleValue, TITLE_MAX).trim();
                      if (next) handleUpdate('title', next);
                      else setTitleValue(task.title);
                      setIsEditingTitle(false);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setTitleValue(task.title);
                      setIsEditingTitle(false);
                    }}
                    className="px-2 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <h1
                  onClick={() => {
                    setTitleValue(task.title);
                    setIsEditingTitle(true);
                  }}
                  className="text-base font-bold text-[var(--text-primary)] hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer rounded px-1 -mx-1 py-0.5 transition-colors break-words"
                >
                  {task.title}
                </h1>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Description
              </label>
              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    autoFocus
                    maxLength={DESC_MAX}
                    value={descValue}
                    onChange={(e) => setDescValue(sanitizePlainText(e.target.value, DESC_MAX))}
                    className="w-full bg-[var(--bg-input)] border border-indigo-500 rounded-xl p-3 text-xs text-[var(--text-primary)] outline-none resize-y font-mono break-words"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        handleUpdate('description', sanitizePlainText(descValue, DESC_MAX).trim());
                        setIsEditingDesc(false);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setDescValue(task.description || '');
                        setIsEditingDesc(false);
                      }}
                      className="px-2 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setDescValue(task.description || '');
                    setIsEditingDesc(true);
                  }}
                  className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-secondary)] hover:border-indigo-400 cursor-pointer min-h-[70px] whitespace-pre-wrap break-words transition-colors leading-relaxed"
                >
                  {task.description || (
                    <span className="text-[var(--text-muted)] italic">Add a rich description or acceptance criteria...</span>
                  )}
                </div>
              )}
            </div>

            {/* Subtasks Section */}
            <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-indigo-500" />
                  <span className="font-bold text-[var(--text-primary)]">
                    Subtasks ({completedSubtasksCount}/{subtasks.length})
                  </span>
                </div>
                <button
                  onClick={() => setIsAddingSubtask(!isAddingSubtask)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subtask</span>
                </button>
              </div>

              {/* Subtasks list */}
              {subtasks.length > 0 ? (
                <div className="space-y-1.5">
                  {subtasks.map((st: any) => {
                    const isDone = st.status?.category === 'DONE';
                    return (
                      <div
                        key={st.id}
                        onClick={() => setActiveTaskId(st.id)}
                        className="flex items-center justify-between p-2.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <IssueTypeBadge type={st.issueType || 'SUBTASK'} showLabel={false} />
                          <span className="font-mono text-xs font-bold text-indigo-500">{st.key}</span>
                          <span className={`truncate font-medium ${isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                            {st.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <PriorityBadge priority={st.priority || 'MEDIUM'} />
                          {st.status && <StatusBadge status={st.status} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Add subtask form */}
              {isAddingSubtask && (
                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter subtask title..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="flex-1 bg-[var(--bg-input)] border border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                  >
                    Add
                  </button>
                </form>
              )}
            </div>

            {/* Checklists */}
            <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-[var(--text-primary)]">
                    Checklist ({completedChecklistCount}/{totalChecklistCount})
                  </span>
                </div>
                {totalChecklistCount > 0 && (
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {checklistProgress}%
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {totalChecklistCount > 0 && (
                <div className="w-full h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${checklistProgress}%` }}
                  />
                </div>
              )}

              {/* Checklist items */}
              <div className="space-y-1.5">
                {(task.checklists || []).map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between group px-2 py-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklist(idx)}
                        className="rounded border-[var(--border-default)] bg-[var(--bg-input)] text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                      <span
                        className={`text-xs ${
                          item.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)] font-medium'
                        }`}
                      >
                        {item.text}
                      </span>
                    </label>
                    <button
                      onClick={() => handleRemoveChecklist(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add checklist input */}
              <form onSubmit={handleAddChecklist} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add a checklist item..."
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  className="flex-1 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold rounded-xl border border-[var(--border-default)]"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Task Dependencies Section */}
            <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-[var(--text-primary)]">
                    Linked Dependencies ({dependencies.length + dependentOnBy.length})
                  </span>
                </div>
                <button
                  onClick={() => setIsAddingDep(!isAddingDep)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Link Issue</span>
                </button>
              </div>

              {/* Dependency links list */}
              <div className="space-y-1.5">
                {dependencies.map((dep: any) => (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {dep.type}
                      </span>
                      <button
                        onClick={() => setActiveTaskId(dep.dependsOnTaskId)}
                        className="font-mono text-indigo-500 font-bold hover:underline"
                      >
                        {dep.dependsOnTask?.key}
                      </button>
                      <span className="text-[var(--text-primary)] truncate max-w-[200px]">
                        {dep.dependsOnTask?.title}
                      </span>
                    </div>
                  </div>
                ))}

                {dependentOnBy.map((dep: any) => (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        IS BLOCKED BY
                      </span>
                      <button
                        onClick={() => setActiveTaskId(dep.taskId)}
                        className="font-mono text-indigo-500 font-bold hover:underline"
                      >
                        {dep.task?.key}
                      </button>
                      <span className="text-[var(--text-primary)] truncate max-w-[200px]">
                        {dep.task?.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Dependency Selector */}
              {isAddingDep && (
                <div className="p-3 bg-[var(--bg-elevated)] border border-indigo-500/40 rounded-xl space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={depType}
                      onChange={(e) => setDepType(e.target.value)}
                      className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg p-1.5 text-xs text-[var(--text-primary)]"
                    >
                      <option value="BLOCKS">Blocks</option>
                      <option value="BLOCKED_BY">Is Blocked By</option>
                      <option value="RELATES_TO">Relates To</option>
                      <option value="DUPLICATES">Duplicates</option>
                    </select>

                    <select
                      value={depTaskId}
                      onChange={(e) => setDepTaskId(e.target.value)}
                      className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg p-1.5 text-xs text-[var(--text-primary)]"
                    >
                      <option value="">Select target issue...</option>
                      {allTasks
                        .filter((t) => t.id !== task.id)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.key}: {t.title.slice(0, 30)}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddDependency}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold"
                    >
                      Save Link
                    </button>
                    <button
                      onClick={() => setIsAddingDep(false)}
                      className="px-2 py-1 text-[var(--text-secondary)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* File Attachments Section */}
            <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-[var(--text-primary)]">
                    Attachments ({attachments.length})
                  </span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isUploadingFile ? 'Uploading...' : 'Upload File'}</span>
                </button>
              </div>

              {attachments.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {attachments.map((att: any) => (
                    <div
                      key={att.id}
                      className="p-2.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {att.mimeType?.startsWith('image/') ? (
                          <Image className="w-4 h-4 text-indigo-500 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className="truncate font-medium text-[var(--text-primary)]">{att.name}</span>
                      </div>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-indigo-500"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Comments & Activity Stream Tabs */}
            <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-4 border-b border-[var(--border-subtle)] pb-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`pb-1 transition-colors ${
                    activeTab === 'comments'
                      ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Comments ({comments.length})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`pb-1 transition-colors ${
                    activeTab === 'activity'
                      ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Audit Activity ({activityLogs.length})
                </button>
              </div>

              {activeTab === 'comments' ? (
                <div className="space-y-4">
                  {/* Comments list */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {comments.length > 0 ? (
                      comments.map((comm: any) => {
                        let reactions: any[] = [];
                        try {
                          reactions = comm.reactionsJson ? JSON.parse(comm.reactionsJson) : [];
                        } catch (e) {}

                        return (
                          <div
                            key={comm.id}
                            className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar name={comm.author?.name || comm.user?.name} size="sm" />
                                <span className="font-bold text-[var(--text-primary)]">
                                  {comm.author?.name || comm.user?.name || 'Teammate'}
                                </span>
                              </div>
                              <span className="text-xs text-[var(--text-muted)]">
                                {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[var(--text-secondary)] leading-relaxed break-words whitespace-pre-wrap">{comm.content}</p>

                            {/* Reactions bar */}
                            <div className="flex items-center gap-1.5 pt-1">
                              {reactions.map((r: any, rIdx: number) => (
                                <button
                                  key={rIdx}
                                  onClick={() => handleAddReaction(comm.id, r.emoji)}
                                  className="px-2 py-0.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-xs flex items-center gap-1"
                                >
                                  <span>{r.emoji}</span>
                                  <span className="font-bold text-xs text-[var(--text-secondary)]">
                                    {r.userIds?.length || 1}
                                  </span>
                                </button>
                              ))}

                              {/* Emoji add pills */}
                              <div className="flex items-center gap-1 ml-1 opacity-60 hover:opacity-100 transition-opacity">
                                {['👍', '🚀', '❤️', '🔥', '🎉'].map((emo) => (
                                  <button
                                    key={emo}
                                    onClick={() => handleAddReaction(comm.id, emo)}
                                    className="p-1 hover:bg-[var(--bg-hover)] rounded text-xs"
                                  >
                                    {emo}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[var(--text-muted)] italic text-center py-4">No comments yet. Start the discussion!</p>
                    )}
                  </div>

                  {/* Comment Input with @Mentions Popup */}
                  <div className="relative">
                    {/* Mention suggest dropdown */}
                    {mentionQuery !== null && (
                      <div className="absolute bottom-full mb-1 left-0 w-60 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                        <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          Mention Teammate
                        </div>
                        {teamMembers
                          .filter((m) => m.name.toLowerCase().includes(mentionQuery))
                          .map((m) => (
                            <button
                              key={m.id}
                              onClick={() => handleSelectMention(m.name)}
                              className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-[var(--bg-hover)] flex items-center justify-between text-xs"
                            >
                              <span className="font-bold text-[var(--text-primary)]">{m.name}</span>
                              <span className="text-xs text-[var(--text-muted)]">{m.role}</span>
                            </button>
                          ))}
                      </div>
                    )}

                    <form onSubmit={handleAddComment} className="space-y-2">
                      <textarea
                        ref={commentInputRef}
                        rows={2}
                        maxLength={COMMENT_MAX}
                        placeholder="Write a comment... (Type @ to mention teammates)"
                        value={newComment}
                        onChange={handleCommentChange}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl p-3 text-xs text-[var(--text-primary)] outline-none focus:border-indigo-500 resize-none font-sans break-words"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Post Comment</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                /* Activity Log Stream */
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activityLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-2.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-[var(--text-primary)]">{log.action}</p>
                        <p className="text-xs text-[var(--text-muted)]">by {log.user?.name || 'System'}</p>
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar Meta Attributes (35%) */}
          <div className="w-72 bg-[var(--bg-sidebar)] p-5 space-y-4 overflow-y-auto shrink-0">
            {/* Status Select */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Status
              </label>
              <select
                value={task.statusId}
                onChange={(e) => handleUpdate('statusId', e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg p-2 text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Select */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Priority
              </label>
              <select
                value={task.priority}
                onChange={(e) => handleUpdate('priority', e.target.value as Priority)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg p-2 text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
              >
                <option value="URGENT">🔴 Urgent</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">⚪ Low</option>
              </select>
            </div>

            {/* Issue Type Select */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Issue Type
              </label>
              <select
                value={task.issueType}
                onChange={(e) => handleUpdate('issueType', e.target.value as IssueType)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg p-2 text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
              >
                <option value="EPIC">⚡ Epic</option>
                <option value="STORY">🔖 Story</option>
                <option value="TASK">☑️ Task</option>
                <option value="SUBTASK">🔹 Subtask</option>
                <option value="BUG">⚠️ Bug</option>
              </select>
            </div>

            {/* Story Points */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Story Points (Fibonacci)
              </label>
              <input
                type="number"
                min={0}
                value={task.storyPoints ?? ''}
                onChange={(e) => handleUpdate('storyPoints', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 1, 2, 3, 5, 8, 13"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg p-2 text-xs text-[var(--text-primary)] outline-none font-mono font-bold"
              />
            </div>

            {/* Sprint Selector */}
            {sprints.length > 0 && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Sprint
                </label>
                <select
                  value={task.sprintId || ''}
                  onChange={(e) => handleUpdate('sprintId', e.target.value || null)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg p-2 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  <option value="">Backlog (No Sprint)</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dates: Start Date & Due Date */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Start Date
                </label>
                <input
                  type="date"
                  value={task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleUpdate('startDate', e.target.value || null)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg p-1.5 text-xs text-[var(--text-primary)] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Due Date
                </label>
                <input
                  type="date"
                  value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleUpdate('dueDate', e.target.value || null)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg p-1.5 text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
            </div>

            {/* Time Tracking Progress */}
            <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--text-muted)] uppercase text-xs">Logged Time</span>
                <span className="font-mono text-[var(--text-primary)] font-bold">
                  {Math.round((task.timeSpentMinutes || 0) / 60)}h / {Math.round((task.timeEstimateMinutes || 240) / 60)}h
                </span>
              </div>
              <div className="w-full h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500"
                  style={{
                    width: `${Math.min(100, Math.round(((task.timeSpentMinutes || 0) / (task.timeEstimateMinutes || 240)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
