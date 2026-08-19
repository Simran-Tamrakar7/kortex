import React, { useState } from 'react';
import { Task, Priority } from '@kortex/shared';
import { useAppStore } from '../../store/useAppStore';
import { useProject, useUpdateTaskMutation } from '../../api/queries';
import { IssueTypeBadge } from '../common/IssueTypeBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Avatar } from '../common/Avatar';
import {
  Table as TableIcon,
  Calculator,
  Plus,
  ArrowUpDown,
  Check,
} from 'lucide-react';

interface Props {
  tasks: Task[];
}

export const TableView: React.FC<Props> = ({ tasks }) => {
  const { activeProjectId, setActiveTaskId } = useAppStore();
  const { data: project } = useProject(activeProjectId);
  const updateTaskMutation = useUpdateTaskMutation();

  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  const statuses = project?.statuses || [];

  const handleCellClick = (task: Task, field: string, currentValue: any) => {
    setEditingCell({ taskId: task.id, field });
    setEditValue(currentValue ?? '');
  };

  const handleSaveCell = async (task: Task) => {
    if (!editingCell) return;
    const { field } = editingCell;

    const updates: { id: string } & Record<string, any> = { id: task.id };
    if (field === 'storyPoints') {
      updates.storyPoints = editValue === '' ? null : Number(editValue);
    } else if (field === 'timeEstimateMinutes') {
      updates.timeEstimateMinutes = editValue === '' ? null : Number(editValue) * 60;
    } else {
      updates[field] = editValue;
    }

    await updateTaskMutation.mutateAsync(updates);
    setEditingCell(null);
  };

  // Calculate Formula Columns
  const calculateDaysRemaining = (dueDate?: string) => {
    if (!dueDate) return '-';
    const diff = new Date(dueDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d left` : days === 0 ? 'Due today' : `${Math.abs(days)}d overdue`;
  };

  // Summaries
  const totalStoryPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const totalEstHours = tasks.reduce((sum, t) => sum + ((t.timeEstimateMinutes || 0) / 60), 0);
  const totalSpentHours = tasks.reduce((sum, t) => sum + ((t.timeSpentMinutes || 0) / 60), 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-canvas)] select-none text-xs transition-colors">
      {/* Mobile/Narrow Screen Helper Banner */}
      <div className="md:hidden px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium flex items-center justify-between">
        <span>💡 Swipe horizontally to view formula columns & edit cells</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          {/* Table Header */}
          <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] sticky top-0 z-10 text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2.5 px-3 border-r border-[var(--border-subtle)] w-20">Key</th>
              <th className="py-2.5 px-3 border-r border-[var(--border-subtle)] min-w-[220px]">Task Title</th>
              <th className="py-2.5 px-3 border-r border-[var(--border-subtle)] w-28">Type</th>
              <th className="py-2.5 px-3 border-r border-[var(--border-subtle)] w-36">Status</th>
              <th className="py-2.5 px-3 border-r border-[var(--border-subtle)] w-28">Priority</th>
              <th className="py-2.5 px-3 border-r border-[var(--border-subtle)] w-28">Story Pts</th>
              <th className="py-2.5 px-3 border-r border-[var(--border-subtle)] w-32">
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <Calculator className="w-3 h-3" />
                  <span>Formula: Left</span>
                </span>
              </th>
              <th className="py-2.5 px-3 border-r border-[var(--border-subtle)] w-28">Est. Hours</th>
              <th className="py-2.5 px-3 border-r border-[var(--border-subtle)] w-28">Logged Hours</th>
              <th className="py-2.5 px-3 w-32">Assignees</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {tasks.map((task) => {
              const isEditing = (field: string) =>
                editingCell?.taskId === task.id && editingCell?.field === field;

              return (
                <tr
                  key={task.id}
                  className="hover:bg-[var(--bg-hover)] transition-colors group text-[var(--text-primary)]"
                >
                  {/* Key */}
                  <td className="py-2 px-3 border-r border-[var(--border-subtle)] font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                    <button
                      onClick={() => setActiveTaskId(task.id)}
                      className="hover:underline"
                    >
                      {task.key}
                    </button>
                  </td>

                  {/* Title (Inline Editable) */}
                  <td className="py-2 px-3 border-r border-[var(--border-subtle)] font-semibold">
                    {isEditing('title') ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveCell(task)}
                          onBlur={() => handleSaveCell(task)}
                          className="bg-[var(--bg-input)] border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-[var(--text-primary)] outline-none w-full"
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => handleCellClick(task, 'title', task.title)}
                        className="cursor-pointer truncate hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        {task.title}
                      </div>
                    )}
                  </td>

                  {/* Issue Type */}
                  <td className="py-2 px-3 border-r border-[var(--border-subtle)]">
                    <IssueTypeBadge type={task.issueType} />
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-2 px-3 border-r border-[var(--border-subtle)]">
                    <select
                      value={task.statusId}
                      onChange={(e) => updateTaskMutation.mutate({ id: task.id, statusId: e.target.value })}
                      className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded px-1.5 py-0.5 text-xs text-[var(--text-primary)] outline-none cursor-pointer w-full font-medium"
                    >
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Priority Dropdown */}
                  <td className="py-2 px-3 border-r border-[var(--border-subtle)]">
                    <select
                      value={task.priority}
                      onChange={(e) => updateTaskMutation.mutate({ id: task.id, priority: e.target.value as Priority })}
                      className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded px-1.5 py-0.5 text-xs text-[var(--text-primary)] outline-none cursor-pointer w-full font-medium"
                    >
                      <option value="URGENT">🔴 Urgent</option>
                      <option value="HIGH">🟠 High</option>
                      <option value="MEDIUM">🟡 Medium</option>
                      <option value="LOW">⚪ Low</option>
                    </select>
                  </td>

                  {/* Story Points (Inline Editable) */}
                  <td className="py-2 px-3 border-r border-[var(--border-subtle)] font-mono">
                    {isEditing('storyPoints') ? (
                      <input
                        type="number"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveCell(task)}
                        onBlur={() => handleSaveCell(task)}
                        className="bg-[var(--bg-input)] border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-[var(--text-primary)] outline-none w-16"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellClick(task, 'storyPoints', task.storyPoints)}
                        className="cursor-pointer hover:bg-[var(--bg-hover)] px-1 py-0.5 rounded font-bold"
                      >
                        {task.storyPoints ?? '-'}
                      </div>
                    )}
                  </td>

                  {/* Calculated Formula: Days Remaining */}
                  <td className="py-2 px-3 border-r border-[var(--border-subtle)] font-mono font-bold">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] ${
                        calculateDaysRemaining(task.dueDate).includes('overdue')
                          ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {calculateDaysRemaining(task.dueDate)}
                    </span>
                  </td>

                  {/* Estimated Hours */}
                  <td className="py-2 px-3 border-r border-[var(--border-subtle)] font-mono">
                    {Math.round((task.timeEstimateMinutes || 0) / 60)}h
                  </td>

                  {/* Logged Hours */}
                  <td className="py-2 px-3 border-r border-[var(--border-subtle)] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {Math.round((task.timeSpentMinutes || 0) / 60)}h
                  </td>

                  {/* Assignees */}
                  <td className="py-2 px-3">
                    <div className="flex items-center -space-x-1.5">
                      {(task.assignees || []).map((a) => (
                        <Avatar key={a.id} name={a.name} avatarUrl={a.avatarUrl} size="sm" />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Table Summary Footer */}
          <tfoot className="bg-[var(--bg-elevated)] border-t-2 border-[var(--border-default)] font-bold text-[11px] sticky bottom-0 text-[var(--text-primary)]">
            <tr>
              <td className="py-2.5 px-3 border-r border-[var(--border-subtle)] font-mono">Total ({tasks.length})</td>
              <td className="py-2.5 px-3 border-r border-[var(--border-subtle)]">-</td>
              <td className="py-2.5 px-3 border-r border-[var(--border-subtle)]">-</td>
              <td className="py-2.5 px-3 border-r border-[var(--border-subtle)]">-</td>
              <td className="py-2.5 px-3 border-r border-[var(--border-subtle)]">-</td>
              <td className="py-2.5 px-3 border-r border-[var(--border-subtle)] font-mono text-indigo-600 dark:text-indigo-400">
                {totalStoryPoints} pts
              </td>
              <td className="py-2.5 px-3 border-r border-[var(--border-subtle)]">-</td>
              <td className="py-2.5 px-3 border-r border-[var(--border-subtle)] font-mono">{totalEstHours}h</td>
              <td className="py-2.5 px-3 border-r border-[var(--border-subtle)] font-mono text-emerald-600 dark:text-emerald-400">{totalSpentHours}h</td>
              <td className="py-2.5 px-3">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
