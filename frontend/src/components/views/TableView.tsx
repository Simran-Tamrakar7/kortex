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
    <div className="flex-1 flex flex-col overflow-hidden bg-[#090e18] select-none text-xs">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          {/* Table Header */}
          <thead className="bg-[#101726] border-b border-[#1e293b] sticky top-0 z-10 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2.5 px-3 border-r border-[#1e293b] w-20">Key</th>
              <th className="py-2.5 px-3 border-r border-[#1e293b] min-w-[220px]">Task Title</th>
              <th className="py-2.5 px-3 border-r border-[#1e293b] w-28">Type</th>
              <th className="py-2.5 px-3 border-r border-[#1e293b] w-36">Status</th>
              <th className="py-2.5 px-3 border-r border-[#1e293b] w-28">Priority</th>
              <th className="py-2.5 px-3 border-r border-[#1e293b] w-28">Story Pts</th>
              <th className="py-2.5 px-3 border-r border-[#1e293b] w-32">
                <span className="flex items-center gap-1 text-indigo-400">
                  <Calculator className="w-3 h-3" />
                  <span>Formula: Left</span>
                </span>
              </th>
              <th className="py-2.5 px-3 border-r border-[#1e293b] w-28">Est. Hours</th>
              <th className="py-2.5 px-3 border-r border-[#1e293b] w-28">Logged Hours</th>
              <th className="py-2.5 px-3 w-32">Assignees</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#1e293b]/60">
            {tasks.map((task) => {
              const isEditing = (field: string) =>
                editingCell?.taskId === task.id && editingCell?.field === field;

              return (
                <tr
                  key={task.id}
                  className="hover:bg-[#131d31]/80 transition-colors group text-slate-200"
                >
                  {/* Key */}
                  <td
                    onClick={() => setActiveTaskId(task.id)}
                    className="py-2 px-3 border-r border-[#1e293b]/60 font-mono text-[11px] font-semibold text-slate-400 cursor-pointer group-hover:text-indigo-300"
                  >
                    {task.key}
                  </td>

                  {/* Title */}
                  <td
                    onClick={() => setActiveTaskId(task.id)}
                    className="py-2 px-3 border-r border-[#1e293b]/60 font-medium cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{task.title}</span>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-2 px-3 border-r border-[#1e293b]/60">
                    <IssueTypeBadge type={task.issueType} />
                  </td>

                  {/* Status */}
                  <td className="py-2 px-3 border-r border-[#1e293b]/60">
                    <select
                      value={task.statusId}
                      onChange={(e) =>
                        updateTaskMutation.mutate({ id: task.id, statusId: e.target.value })
                      }
                      className="bg-transparent text-xs outline-none cursor-pointer"
                    >
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#131b2a] text-slate-200">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Priority */}
                  <td className="py-2 px-3 border-r border-[#1e293b]/60">
                    <select
                      value={task.priority}
                      onChange={(e) =>
                        updateTaskMutation.mutate({ id: task.id, priority: e.target.value })
                      }
                      className="bg-transparent text-xs outline-none cursor-pointer"
                    >
                      <option value="URGENT" className="bg-[#131b2a] text-red-400">Urgent</option>
                      <option value="HIGH" className="bg-[#131b2a] text-orange-400">High</option>
                      <option value="MEDIUM" className="bg-[#131b2a] text-yellow-400">Medium</option>
                      <option value="LOW" className="bg-[#131b2a] text-slate-400">Low</option>
                    </select>
                  </td>

                  {/* Story Points */}
                  <td
                    onDoubleClick={() => handleCellClick(task, 'storyPoints', task.storyPoints)}
                    className="py-2 px-3 border-r border-[#1e293b]/60 font-mono"
                  >
                    {isEditing('storyPoints') ? (
                      <input
                        type="number"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSaveCell(task)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveCell(task)}
                        className="w-16 bg-[#0b0f17] border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-slate-100"
                      />
                    ) : (
                      <span>{task.storyPoints ?? '-'}</span>
                    )}
                  </td>

                  {/* Formula: Days Remaining */}
                  <td className="py-2 px-3 border-r border-[#1e293b]/60 font-mono text-[11px] text-indigo-300">
                    {calculateDaysRemaining(task.dueDate)}
                  </td>

                  {/* Estimated Hours */}
                  <td className="py-2 px-3 border-r border-[#1e293b]/60 font-mono">
                    {task.timeEstimateMinutes ? `${task.timeEstimateMinutes / 60}h` : '-'}
                  </td>

                  {/* Logged Hours */}
                  <td className="py-2 px-3 border-r border-[#1e293b]/60 font-mono">
                    {task.timeSpentMinutes ? `${Math.round((task.timeSpentMinutes / 60) * 10) / 10}h` : '0h'}
                  </td>

                  {/* Assignees */}
                  <td className="py-2 px-3">
                    <div className="flex items-center -space-x-1">
                      {task.assignees?.map((u) => (
                        <Avatar key={u.id} name={u.name} avatarUrl={u.avatarUrl} size="xs" />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Table Summary Footer */}
          <tfoot className="bg-[#101726] border-t-2 border-[#1e293b] font-semibold text-[11px] text-slate-300">
            <tr>
              <td className="py-2.5 px-3 border-r border-[#1e293b]">Total</td>
              <td className="py-2.5 px-3 border-r border-[#1e293b]">{tasks.length} tasks</td>
              <td className="py-2.5 px-3 border-r border-[#1e293b]">-</td>
              <td className="py-2.5 px-3 border-r border-[#1e293b]">-</td>
              <td className="py-2.5 px-3 border-r border-[#1e293b]">-</td>
              <td className="py-2.5 px-3 border-r border-[#1e293b] font-mono text-indigo-300">
                {totalStoryPoints} pts
              </td>
              <td className="py-2.5 px-3 border-r border-[#1e293b]">-</td>
              <td className="py-2.5 px-3 border-r border-[#1e293b] font-mono">{totalEstHours}h</td>
              <td className="py-2.5 px-3 border-r border-[#1e293b] font-mono">{Math.round(totalSpentHours * 10) / 10}h</td>
              <td className="py-2.5 px-3">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
