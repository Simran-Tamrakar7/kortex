import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, Status } from '@kortex/shared';
import { useAppStore } from '../../store/useAppStore';
import { useProject, useUpdateTaskMutation, useCreateTaskMutation } from '../../api/queries';
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
} from 'lucide-react';

interface Props {
  tasks: Task[];
}

export const KanbanView: React.FC<Props> = ({ tasks }) => {
  const { activeProjectId, setActiveTaskId } = useAppStore();
  const { data: project } = useProject(activeProjectId);
  const updateTaskMutation = useUpdateTaskMutation();
  const createTaskMutation = useCreateTaskMutation();

  const [swimlaneBy, setSwimlaneBy] = useState<'none' | 'assignee' | 'epic' | 'priority'>('none');
  const [quickAddStatusId, setQuickAddStatusId] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  const statuses = project?.statuses || [];

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const targetStatusId = destination.droppableId;
    updateTaskMutation.mutate({
      id: draggableId,
      statusId: targetStatusId,
      order: destination.index,
    });
  };

  const handleQuickAdd = async (statusId: string) => {
    if (!quickAddTitle.trim() || !activeProjectId) return;
    await createTaskMutation.mutateAsync({
      projectId: activeProjectId,
      statusId,
      title: quickAddTitle.trim(),
      issueType: 'TASK',
      priority: 'MEDIUM',
    });
    setQuickAddTitle('');
    setQuickAddStatusId(null);
  };

  const getTasksForColumn = (statusId: string) => {
    return tasks.filter((t) => t.statusId === statusId).sort((a, b) => a.order - b.order);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none bg-[var(--bg-canvas)] transition-colors">
      {/* Kanban Header controls (Swimlane switcher) */}
      <div className="px-4 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between text-xs bg-[var(--bg-sidebar)]">
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-secondary)] font-semibold">Swimlanes:</span>
          <select
            value={swimlaneBy}
            onChange={(e) => setSwimlaneBy(e.target.value as any)}
            className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded px-2 py-0.5 text-xs text-[var(--text-primary)] outline-none cursor-pointer shadow-sm"
          >
            <option value="none">None (Standard)</option>
            <option value="assignee">Group by Assignee</option>
            <option value="epic">Group by Epic</option>
            <option value="priority">Group by Priority</option>
          </select>
        </div>
      </div>

      {/* Board Columns Canvas */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-4 flex gap-3.5 items-start">
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
                <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)] rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                    <span className="font-bold text-xs text-[var(--text-primary)]">{status.name}</span>
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        isWipExceeded
                          ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                          : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                      }`}
                    >
                      {columnTasks.length}
                      {status.wipLimit ? ` / ${status.wipLimit}` : ''}
                    </span>
                  </div>

                  <button
                    onClick={() => setQuickAddStatusId(status.id)}
                    className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    title="Add task to column"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* WIP Exceeded Warning Strip */}
                {isWipExceeded && (
                  <div className="px-3 py-1 bg-rose-500/10 border-b border-rose-500/20 text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
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
                      {columnTasks.map((task, index) => (
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
                              {/* Epic label if attached */}
                              {task.epic && (
                                <div className="mb-1.5">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                                    ⚡ {task.epic.key}: {task.epic.title}
                                  </span>
                                </div>
                              )}

                              {/* Task Title */}
                              <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2 mb-2.5">
                                {task.title}
                              </p>

                              {/* Labels */}
                              {task.labels && task.labels.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2.5">
                                  {task.labels.map((l) => (
                                    <span
                                      key={l}
                                      className="px-1.5 py-0.2 rounded text-[10px] bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                                    >
                                      {l}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Card Footer: Key, Type, Priority, Points, Assignees */}
                              <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <IssueTypeBadge type={task.issueType} showLabel={false} />
                                  <span className="font-mono text-[var(--text-muted)] font-bold text-[10px]">
                                    {task.key}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {task.storyPoints !== null && task.storyPoints !== undefined && (
                                    <span className="px-1.5 py-0.2 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-mono text-[10px] font-bold border border-[var(--border-subtle)]">
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
                      ))}
                      {provided.placeholder}

                      {/* Quick Add Form in Column */}
                      {quickAddStatusId === status.id && (
                        <div className="p-2.5 bg-[var(--bg-elevated)] rounded-xl border border-indigo-500/50 shadow-md">
                          <textarea
                            autoFocus
                            rows={2}
                            placeholder="Task title..."
                            value={quickAddTitle}
                            onChange={(e) => setQuickAddTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleQuickAdd(status.id);
                              }
                              if (e.key === 'Escape') setQuickAddStatusId(null);
                            }}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg p-2 text-xs text-[var(--text-primary)] outline-none resize-none"
                          />
                          <div className="flex justify-end gap-1.5 mt-2">
                            <button
                              onClick={() => setQuickAddStatusId(null)}
                              className="px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleQuickAdd(status.id)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow"
                            >
                              Add
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
