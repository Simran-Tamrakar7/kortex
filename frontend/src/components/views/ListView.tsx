import React, { useState } from 'react';
import { Task, Status, Priority } from '@kortex/shared';
import { useAppStore } from '../../store/useAppStore';
import { useProject, useCreateTaskMutation, useUpdateTaskMutation } from '../../api/queries';
import { IssueTypeBadge } from '../common/IssueTypeBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Avatar } from '../common/Avatar';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Calendar,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface Props {
  tasks: Task[];
}

export const ListView: React.FC<Props> = ({ tasks }) => {
  const {
    activeProjectId,
    setActiveTaskId,
    selectedTaskIds,
    toggleSelectTask,
    setSelectedTaskIds,
  } = useAppStore();

  const { data: project } = useProject(activeProjectId);
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [quickAddTitle, setQuickAddTitle] = useState<Record<string, string>>({});
  const [activeQuickAddStatusId, setActiveQuickAddStatusId] = useState<string | null>(null);

  const statuses = project?.statuses || [];

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleQuickAdd = async (statusId: string) => {
    const title = quickAddTitle[statusId];
    if (!title || !activeProjectId) return;

    await createTaskMutation.mutateAsync({
      projectId: activeProjectId,
      statusId,
      title,
      issueType: 'TASK',
      priority: 'MEDIUM',
    });

    setQuickAddTitle((prev) => ({ ...prev, [statusId]: '' }));
    setActiveQuickAddStatusId(null);
  };

  // Group tasks by status
  const groupedTasks: Record<string, Task[]> = {};
  statuses.forEach((s) => {
    groupedTasks[s.id] = [];
  });

  tasks.forEach((t) => {
    if (groupedTasks[t.statusId]) {
      groupedTasks[t.statusId].push(t);
    } else {
      if (!groupedTasks['other']) groupedTasks['other'] = [];
      groupedTasks['other'].push(t);
    }
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 select-none bg-[var(--bg-canvas)] transition-colors">
      {statuses.map((status) => {
        const groupTasks = groupedTasks[status.id] || [];
        const isCollapsed = collapsedGroups[status.id] ?? false;

        return (
          <div key={status.id} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-sm transition-colors">
            {/* Group Header */}
            <div
              onClick={() => toggleGroup(status.id)}
              className="px-3 py-2 bg-[var(--bg-elevated)] flex items-center justify-between cursor-pointer hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border-subtle)]"
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                )}
                <StatusBadge status={status} />
                <span className="text-xs text-[var(--text-secondary)] font-bold">({groupTasks.length})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveQuickAddStatusId(status.id);
                  }}
                  className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Add Task to Status"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Task Rows Table */}
            {!isCollapsed && (
              <div className="divide-y divide-[var(--border-subtle)]">
                {groupTasks.length > 0 ? (
                  groupTasks.map((task) => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        onClick={() => setActiveTaskId(task.id)}
                        className={`flex items-center justify-between px-3 py-2.5 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer text-xs ${
                          isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        {/* Left: Checkbox, Key, Type, Title */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleSelectTask(task.id)}
                            className="rounded border-[var(--border-default)] bg-[var(--bg-input)] text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                          <IssueTypeBadge type={task.issueType} showLabel={false} />
                          <span className="font-mono text-xs text-[var(--text-muted)] shrink-0 font-bold">
                            {task.key}
                          </span>
                          <span className="font-semibold text-[var(--text-primary)] truncate hover:text-indigo-600 dark:hover:text-indigo-400">
                            {task.title}
                          </span>

                          {/* Epic Tag if attached */}
                          {task.epic && (
                            <span className="shrink-0 px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
                              {task.epic.key}
                            </span>
                          )}

                          {/* Labels */}
                          {task.labels?.map((label) => (
                            <span
                              key={label}
                              className="hidden sm:inline-block shrink-0 px-1.5 py-0.2 text-xs rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                            >
                              {label}
                            </span>
                          ))}
                        </div>

                        {/* Right: SLA, Story Points, Due Date, Comments, Assignees, Priority */}
                        <div className="flex items-center gap-3 shrink-0">
                          {/* SLA Breach Pill */}
                          {task.slaBreached && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 text-xs font-bold border border-rose-500/30 animate-pulse">
                              <AlertCircle className="w-3 h-3" />
                              <span>SLA Breached</span>
                            </span>
                          )}

                          {/* Story Points badge */}
                          {task.storyPoints !== undefined && task.storyPoints !== null && (
                            <span className="px-1.5 py-0.5 bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded font-mono text-xs font-bold border border-[var(--border-subtle)]">
                              {task.storyPoints} pts
                            </span>
                          )}

                          {/* Due Date */}
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-[var(--text-secondary)] text-xs font-medium">
                              <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
                              <span>{new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            </span>
                          )}

                          {/* Comments count */}
                          {(task.commentsCount || 0) > 0 && (
                            <span className="flex items-center gap-1 text-[var(--text-secondary)] text-xs">
                              <MessageSquare className="w-3 h-3 text-[var(--text-muted)]" />
                              <span>{task.commentsCount}</span>
                            </span>
                          )}

                          {/* Priority Badge */}
                          <PriorityBadge priority={task.priority} showLabel={false} />

                          {/* Assignees */}
                          <div className="flex items-center -space-x-1.5 w-12 justify-end">
                            {task.assignees?.length ? (
                              task.assignees.map((u) => (
                                <Avatar key={u.id} name={u.name} avatarUrl={u.avatarUrl} size="xs" />
                              ))
                            ) : (
                              <span className="w-5 h-5 rounded-full border border-dashed border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] text-xs">
                                -
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-[var(--text-muted)]">No tasks in this status</div>
                )}

                {/* Quick Add Row */}
                {activeQuickAddStatusId === status.id ? (
                  <div className="p-2 bg-[var(--bg-elevated)] flex items-center gap-2 border-t border-[var(--border-subtle)]">
                    <input
                      type="text"
                      autoFocus
                      placeholder="What needs to be done? Press Enter to save"
                      value={quickAddTitle[status.id] || ''}
                      onChange={(e) => setQuickAddTitle({ ...quickAddTitle, [status.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAdd(status.id);
                        if (e.key === 'Escape') setActiveQuickAddStatusId(null);
                      }}
                      className="flex-1 bg-[var(--bg-input)] border border-indigo-500/60 rounded px-2.5 py-1 text-xs text-[var(--text-primary)] outline-none"
                    />
                    <button
                      onClick={() => handleQuickAdd(status.id)}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-500 font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setActiveQuickAddStatusId(null)}
                      className="px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveQuickAddStatusId(status.id)}
                    className="w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-[var(--bg-hover)] flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
