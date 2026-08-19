import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useProject, useSprints, useBulkUpdateTasksMutation } from '../../api/queries';
import { Priority } from '@kortex/shared';
import {
  CheckSquare,
  X,
  Trash2,
  ArrowRight,
  Archive,
  Layers,
} from 'lucide-react';

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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl shadow-2xl px-5 py-2.5 flex items-center gap-4 text-xs text-[var(--text-primary)] animate-in fade-in slide-in-from-bottom-3 select-none transition-colors">
      <div className="flex items-center gap-2 pr-3 border-r border-[var(--border-subtle)]">
        <CheckSquare className="w-4 h-4 text-indigo-500" />
        <span className="font-bold">{selectedTaskIds.length} selected</span>
      </div>

      {/* Bulk Status Select */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-[var(--text-secondary)] font-semibold">Status:</span>
        <select
          onChange={(e) => handleBulkStatus(e.target.value)}
          defaultValue=""
          className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
        >
          <option value="" disabled>
            Change Status...
          </option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Priority Select */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-[var(--text-secondary)] font-semibold">Priority:</span>
        <select
          onChange={(e) => handleBulkPriority(e.target.value)}
          defaultValue=""
          className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
        >
          <option value="" disabled>
            Change Priority...
          </option>
          <option value="URGENT">🔴 Urgent</option>
          <option value="HIGH">🟠 High</option>
          <option value="MEDIUM">🟡 Medium</option>
          <option value="LOW">⚪ Low</option>
        </select>
      </div>

      {/* Bulk Sprint Select */}
      {sprints.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[var(--text-secondary)] font-semibold">Sprint:</span>
          <select
            onChange={(e) => handleBulkSprint(e.target.value)}
            defaultValue=""
            className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
          >
            <option value="" disabled>
              Move to Sprint...
            </option>
            <option value="null">Backlog</option>
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Delete / Clear */}
      <div className="flex items-center gap-2 pl-3 border-l border-[var(--border-subtle)]">
        <button
          onClick={handleBulkDelete}
          className="p-1 text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
          title="Delete selected tasks"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={clearSelectedTasks}
          className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
          title="Deselect all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
