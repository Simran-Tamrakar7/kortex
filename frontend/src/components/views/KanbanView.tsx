import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, Status } from '@kortex/shared';
import { useAppStore } from '../../store/useAppStore';
import { useProject, useSprints, useUpdateTaskMutation, useCreateTaskMutation } from '../../api/queries';
import { IssueTypeBadge } from '../common/IssueTypeBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { Avatar } from '../common/Avatar';
import {
  Plus,
  AlertCircle,
  Calendar,
  MessageSquare,
  CheckSquare2,
  MoreVertical,
  CheckCircle2,
  Zap,
  Filter,
  Sparkles,
} from 'lucide-react';

interface Props {
  tasks: Task[];
}

export const KanbanView: React.FC<Props> = ({ tasks }) => {
  const { activeProjectId, setActiveTaskId, filters, setFilter } = useAppStore();
  const { data: project } = useProject(activeProjectId);
  const { data: sprints = [] } = useSprints(activeProjectId);
  const updateTaskMutation = useUpdateTaskMutation();
  const createTaskMutation = useCreateTaskMutation();

  // Sync with sidebar: undefined=all, null=backlog, string=sprint id
  const selectedSprintId =
    filters.sprintId === undefined ? 'all' : filters.sprintId === null ? 'backlog' : filters.sprintId;

  const setSelectedSprintId = (id: string) => {
    if (id === 'all') setFilter('sprintId', undefined);
    else if (id === 'backlog') setFilter('sprintId', null);
    else setFilter('sprintId', id);
  };

  const [swimlaneBy, setSwimlaneBy] = useState<'none' | 'assignee' | 'epic' | 'priority'>('none');
  const [quickAddStatusId, setQuickAddStatusId] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  const statuses = project?.statuses || [];

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const targetStatusId = destination.droppableId;
    const targetStatus = statuses.find((s) => s.id === targetStatusId);
    updateTaskMutation.mutate({
      id: draggableId,
      statusId: targetStatusId,
      ...(targetStatus
        ? {
            status: {
              id: targetStatus.id,
              name: targetStatus.name,
              category: targetStatus.category,
              color: targetStatus.color,
            },
          }
        : {}),
      order: destination.index,
    });
  };

  const handleQuickAdd = async (statusId: string) => {
    if (!quickAddTitle.trim() || !activeProjectId) return;
    const activeSprint = sprints.find((s) => s.status === 'ACTIVE');
    const sprintForCreate =
      selectedSprintId !== 'all' && selectedSprintId !== 'backlog'
        ? selectedSprintId
        : activeSprint?.id;
    await createTaskMutation.mutateAsync({
      projectId: activeProjectId,
      statusId,
      sprintId: sprintForCreate,
      title: quickAddTitle.trim(),
      issueType: 'TASK',
      priority: 'MEDIUM',
    });
    setQuickAddTitle('');
    setQuickAddStatusId(null);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedSprintId === 'all') return true;
      if (selectedSprintId === 'backlog') return !t.sprintId;
      return t.sprintId === selectedSprintId;
    });
  }, [tasks, selectedSprintId]);

  // DEV-43: one pass group+sort instead of filter per column every render
  const tasksByStatus = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filteredTasks) {
      const list = map.get(t.statusId) || [];
      list.push(t);
      map.set(t.statusId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.order - b.order);
    }
    return map;
  }, [filteredTasks]);

  const getTasksForColumn = (statusId: string) => tasksByStatus.get(statusId) || [];

  const sprintNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sprints) m.set(s.id, s.name);
    return m;
  }, [sprints]);

  const getSprintName = (sprintId?: string) => {
    if (!sprintId) return null;
    return sprintNameById.get(sprintId) || sprintId;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none bg-[var(--bg-canvas)] transition-colors">
      {/* Kanban Header controls (Sprint Filter & Swimlanes) */}
      <div className="px-4 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between text-xs bg-[var(--bg-sidebar)] flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {/* Sprint Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider">Sprint:</span>
            <select
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-primary)] outline-none cursor-pointer shadow-sm font-medium"
            >
              <option value="all">All Sprints & Backlog</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.status === 'ACTIVE' ? '🚀 ' : s.status === 'COMPLETED' ? '✅ ' : '📋 '}
                  {s.name} ({s.status})
                </option>
              ))}
              {/* Keep select valid if filter points at a sprint not in this project's list */}
              {selectedSprintId !== 'all' &&
                selectedSprintId !== 'backlog' &&
                !sprints.some((s) => s.id === selectedSprintId) && (
                  <option value={selectedSprintId}>Selected sprint</option>
                )}
              <option value="backlog">Backlog / Unassigned Sprints</option>
            </select>
          </div>

          <div className="w-px h-4 bg-[var(--border-subtle)] hidden sm:block" />

          {/* Swimlanes */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-secondary)] font-semibold text-xs">Swimlanes:</span>
            <select
              value={swimlaneBy}
              onChange={(e) => setSwimlaneBy(e.target.value as any)}
              className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)] outline-none cursor-pointer shadow-sm"
            >
              <option value="none">None (Standard Columns)</option>
              <option value="assignee">Group by Assignee</option>
              <option value="epic">Group by Epic</option>
              <option value="priority">Group by Priority</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] font-mono">
            Showing {filteredTasks.length} of {tasks.length} total issues
          </span>
        </div>
      </div>

      {/* Board Columns Canvas */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-4 flex gap-3.5 items-start touch-pan-x">
          {statuses.map((status) => {
            const columnTasks = getTasksForColumn(status.id);
            const isWipExceeded = status.wipLimit && columnTasks.length > status.wipLimit;

            return (
              <div
                key={status.id}
                className={`w-72 shrink-0 bg-[var(--bg-card)] border rounded-xl flex flex-col max-h-full shadow-sm transition-all ${
                  isWipExceeded
                    ? 'border-rose-300 dark:border-rose-800/80 ring-1 ring-rose-500/20'
                    : 'border-[var(--border-subtle)]'
                }`}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)]/50 rounded-t-xl shrink-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: status.color || '#64748b' }}
                    />
                    <span className="font-bold text-xs text-[var(--text-primary)]">{status.name}</span>
                    <span className="font-mono text-xs text-[var(--text-muted)] font-semibold px-1.5 py-0.2 rounded bg-[var(--bg-input)]">
                      {columnTasks.length}
                      {status.wipLimit ? ` / ${status.wipLimit}` : ''}
                    </span>
                  </div>

                  <button
                    onClick={() => setQuickAddStatusId(quickAddStatusId === status.id ? null : status.id)}
                    className="p-1 hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
                    title="Quick add task"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* WIP Limit Alert Banner */}
                {isWipExceeded && (
                  <div className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/80 border-b border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 shrink-0 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>WIP Limit Exceeded (+{columnTasks.length - status.wipLimit!} items)</span>
                  </div>
                )}

                {/* Droppable Card Container */}
                <Droppable droppableId={status.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto p-2 space-y-2 min-h-[140px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      {columnTasks.map((task, index) => {
                        const sprintName = getSprintName(task.sprintId);

                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                onClick={() => setActiveTaskId(task.id)}
                                className={`p-3 bg-[var(--bg-surface)] border rounded-xl hover:border-indigo-400 dark:hover:border-slate-600 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md ${
                                  dragSnapshot.isDragging
                                    ? 'border-indigo-500 shadow-2xl scale-[1.02] bg-[var(--bg-elevated)] ring-2 ring-indigo-500/20'
                                    : 'border-[var(--border-subtle)]'
                                }`}
                              >
                                {/* Sprint & Epic badges if present */}
                                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                  {task.epic && (
                                    <span className="px-1.5 py-0.2 rounded text-xs font-bold bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                                      ⚡ {task.epic.key}: {task.epic.title}
                                    </span>
                                  )}
                                  {selectedSprintId === 'all' && sprintName && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                      🏃 {sprintName.split(' — ')[0]}
                                    </span>
                                  )}
                                </div>

                                {/* Task Title */}
                                <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2 mb-2 break-words">
                                  {task.title}
                                </p>

                                {/* Labels / Tags */}
                                {task.labels && task.labels.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2.5">
                                    {task.labels.map((l) => (
                                      <span
                                        key={l}
                                        className={`px-1.5 py-0.2 rounded text-xs font-medium border ${
                                          l === 'AI' || l === 'LLM'
                                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                            : l === 'Bug' || l === 'Stability'
                                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                            : l === 'Docs' || l === 'Markdown'
                                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                                        }`}
                                      >
                                        #{l}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Card Footer: Key, Type, Priority, Points, Assignees */}
                                <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-subtle)] text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <IssueTypeBadge type={task.issueType} showLabel={false} />
                                    <span className="font-mono text-[var(--text-muted)] font-bold text-xs">
                                      {task.key}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {task.storyPoints !== null && task.storyPoints !== undefined && (
                                      <span className="px-1.5 py-0.2 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-mono text-xs font-bold border border-[var(--border-subtle)]">
                                        {task.storyPoints}
                                      </span>
                                    )}
                                    <PriorityBadge priority={task.priority} showLabel={false} />
                                    <div className="flex items-center -space-x-1">
                                      {task.assignees?.slice(0, 2).map((u) => (
                                        <Avatar key={u.id} name={u.name} avatarUrl={u.avatarUrl} size="xs" />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}

                        {/* Quick Add Form in Column */}
                        {quickAddStatusId === status.id && (
                          <div className="p-2.5 bg-[var(--bg-elevated)] rounded-xl border border-indigo-500/50 shadow-md">
                            <textarea
                              autoFocus
                              rows={2}
                              value={quickAddTitle}
                              onChange={(e) => setQuickAddTitle(e.target.value)}
                              placeholder="What needs to be done?"
                              className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg p-2 text-xs text-[var(--text-primary)] outline-none resize-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleQuickAdd(status.id);
                                }
                              }}
                            />
                            <div className="flex items-center justify-end gap-1.5 mt-2">
                              <button
                                onClick={() => setQuickAddStatusId(null)}
                                className="px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleQuickAdd(status.id)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-sm"
                              >
                                Add Task
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
        </div>
      </DragDropContext>
    </div>
  );
};
