import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useProject, useSprints, useCreateTaskMutation } from '../../api/queries';
import { IssueType, Priority } from '@kortex/shared';
import { X, Plus, Sparkles, AlertCircle } from 'lucide-react';

export const TaskCreateModal: React.FC = () => {
  const {
    isCreateTaskOpen,
    setCreateTaskOpen,
    createTaskDefaults,
    activeProjectId,
    setActiveTaskId,
  } = useAppStore();

  const { data: project } = useProject(activeProjectId);
  const { data: sprints = [] } = useSprints(activeProjectId);
  const createTaskMutation = useCreateTaskMutation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState<IssueType>(createTaskDefaults.issueType || 'TASK');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [statusId, setStatusId] = useState(createTaskDefaults.statusId || '');
  const [sprintId, setSprintId] = useState(createTaskDefaults.sprintId || '');
  const [storyPoints, setStoryPoints] = useState<number | ''>(3);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isCreateTaskOpen) return null;

  const statuses = project?.statuses || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Please provide an issue title.');
      return;
    }
    if (!activeProjectId) {
      setErrorMessage('No active project selected.');
      return;
    }

    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      setErrorMessage('Start date cannot be after due date.');
      return;
    }

    try {
      const newTask = await createTaskMutation.mutateAsync({
        projectId: activeProjectId,
        title: title.trim(),
        description: description.trim(),
        issueType,
        priority,
        statusId: statusId || statuses[0]?.id,
        sprintId: sprintId || undefined,
        storyPoints: storyPoints === '' ? undefined : Number(storyPoints),
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
      });

      setCreateTaskOpen(false);
      setTitle('');
      setDescription('');
      setStartDate('');
      setDueDate('');
      if (newTask?.id) {
        setActiveTaskId(newTask.id);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to create task');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Create Issue in {project?.name || 'Project'}
            </h3>
          </div>
          <button
            onClick={() => setCreateTaskOpen(false)}
            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error alert if validation fails */}
        {errorMessage && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Issue Type & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Issue Type</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueType)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
              >
                <option value="EPIC">⚡ Epic</option>
                <option value="STORY">🔖 Story</option>
                <option value="TASK">☑️ Task</option>
                <option value="SUBTASK">🔹 Subtask</option>
                <option value="BUG">⚠️ Bug</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
              >
                <option value="URGENT">🔴 Urgent</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">⚪ Low</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Title *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Implement WebSockets real-time sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Add details, reproduction steps, or acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-indigo-500 font-sans resize-y"
            />
          </div>

          {/* Status & Sprint */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Status</label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Sprint</label>
              <select
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
              >
                <option value="">Backlog (No Sprint)</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Story Points & Dates */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Story Pts</label>
              <input
                type="number"
                min={0}
                placeholder="3"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setCreateTaskOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || createTaskMutation.isPending}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md hover:shadow transition-all disabled:opacity-50"
            >
              {createTaskMutation.isPending ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
