import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useProject, useSprints, useCreateTaskMutation } from '../../api/queries';
import { IssueType, Priority } from '@kortex/shared';
import { X, Plus, Sparkles } from 'lucide-react';

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
  const [dueDate, setDueDate] = useState('');

  if (!isCreateTaskOpen) return null;

  const statuses = project?.statuses || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !activeProjectId) return;

    const newTask = await createTaskMutation.mutateAsync({
      projectId: activeProjectId,
      title: title.trim(),
      description: description.trim(),
      issueType,
      priority,
      statusId: statusId || statuses[0]?.id,
      sprintId: sprintId || undefined,
      storyPoints: storyPoints === '' ? undefined : Number(storyPoints),
      dueDate: dueDate || undefined,
    });

    setCreateTaskOpen(false);
    setTitle('');
    setDescription('');
    setActiveTaskId(newTask.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-xl bg-[#131b2a] border border-[#233352] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">
              Create Issue in {project?.name || 'Project'}
            </h3>
          </div>
          <button
            onClick={() => setCreateTaskOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Issue Type & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Issue Type</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueType)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
              >
                <option value="EPIC">⚡ Epic</option>
                <option value="STORY">🔖 Story</option>
                <option value="TASK">☑️ Task</option>
                <option value="SUBTASK">🔹 Subtask</option>
                <option value="BUG">⚠️ Bug</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
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
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Title *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Implement WebSockets real-time sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Provide background, steps, or acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg p-3 text-xs text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status & Sprint & Points */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Status</label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Sprint</label>
              <select
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
              >
                <option value="">📦 Backlog</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Story Points</label>
              <input
                type="number"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCreateTaskOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow"
            >
              Create Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
