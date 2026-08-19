import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useProject, useSprints, useBulkUpdateTasksMutation } from '../../api/queries';
import { CheckSquare, Trash2, X, ArrowRight, Flag } from 'lucide-react';

export const BulkActionBar: React.FC = () => {
  const {
    selectedTaskIds,
    clearSelectedTasks,
    activeProjectId,
  } = useAppStore();

  const { data: project } = useProject(activeProjectId);
  const { data: sprints = [] } = useSprints(activeProjectId);
  const bulkUpdateMutation = useBulkUpdateTasksMutation();

  if (!selectedTaskIds.length || !activeProjectId) return null;

  const statuses = project?.statuses || [];

  const handleBulkStatus = (statusId: string) => {
    if (!statusId) return;
    bulkUpdateMutation.mutate({
      taskIds: selectedTaskIds,
      statusId,
      projectId: activeProjectId,
    });
  };

  const handleBulkPriority = (priority: string) => {
    if (!priority) return;
    bulkUpdateMutation.mutate({
      taskIds: selectedTaskIds,
      priority,
      projectId: activeProjectId,
    });
  };

  const handleBulkSprint = (sprintId: string) => {
    bulkUpdateMutation.mutate({
      taskIds: selectedTaskIds,
      sprintId: sprintId === 'null' ? null : sprintId,
      projectId: activeProjectId,
    });
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedTaskIds.length} selected tasks?`)) {
      bulkUpdateMutation.mutate({
        taskIds: selectedTaskIds,
        deletePermanent: true,
        projectId: activeProjectId,
      });
      clearSelectedTasks();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#131d31] border border-[#233555] rounded-2xl shadow-2xl px-5 py-2.5 flex items-center gap-4 text-xs text-slate-200 animate-in fade-in slide-in-from-bottom-3 select-none">
      <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
          {selectedTaskIds.length}
        </span>
        <span className="font-semibold">Selected</span>
      </div>

      {/* Change Status */}
      <div className="flex items-center gap-1.5">
        <span className="text-slate-400">Status:</span>
        <select
          defaultValue=""
          onChange={(e) => {
            handleBulkStatus(e.target.value);
            e.target.value = '';
          }}
          className="bg-[#0b0f17] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none"
        >
          <option value="" disabled>Change Status...</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Change Priority */}
      <div className="flex items-center gap-1.5">
        <span className="text-slate-400">Priority:</span>
        <select
          defaultValue=""
          onChange={(e) => {
            handleBulkPriority(e.target.value);
            e.target.value = '';
          }}
          className="bg-[#0b0f17] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none"
        >
          <option value="" disabled>Change Priority...</option>
          <option value="URGENT">🔴 Urgent</option>
          <option value="HIGH">🟠 High</option>
          <option value="MEDIUM">🟡 Medium</option>
          <option value="LOW">⚪ Low</option>
        </select>
      </div>

      {/* Move to Sprint */}
      <div className="flex items-center gap-1.5">
        <span className="text-slate-400">Sprint:</span>
        <select
          defaultValue=""
          onChange={(e) => {
            handleBulkSprint(e.target.value);
            e.target.value = '';
          }}
          className="bg-[#0b0f17] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none"
        >
          <option value="" disabled>Move to Sprint...</option>
          <option value="null">📦 Backlog</option>
          {sprints.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Delete button */}
      <button
        onClick={handleBulkDelete}
        className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
        title="Delete Selected Tasks"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Clear selection */}
      <button
        onClick={clearSelectedTasks}
        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
        title="Deselect All"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
