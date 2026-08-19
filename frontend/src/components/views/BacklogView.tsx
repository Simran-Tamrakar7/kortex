import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, Sprint } from '@kortex/shared';
import { useAppStore } from '../../store/useAppStore';
import { useSprints, useProject, useUpdateTaskMutation, useCreateTaskMutation } from '../../api/queries';
import { IssueTypeBadge } from '../common/IssueTypeBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Avatar } from '../common/Avatar';
import {
  Play,
  CheckCircle2,
  BarChart3,
  Calendar,
  Plus,
  ChevronDown,
  ChevronRight,
  Zap,
  MoreHorizontal,
  Bookmark,
} from 'lucide-react';

interface Props {
  tasks: Task[];
}

export const BacklogView: React.FC<Props> = ({ tasks }) => {
  const {
    activeProjectId,
    setActiveTaskId,
    setSprintModalOpen,
    setSprintReportOpen,
    setCreateTaskOpen,
  } = useAppStore();

  const { data: project } = useProject(activeProjectId);
  const { data: sprints = [] } = useSprints(activeProjectId);
  const updateTaskMutation = useUpdateTaskMutation();
  const createTaskMutation = useCreateTaskMutation();

  const [collapsedContainers, setCollapsedContainers] = useState<Record<string, boolean>>({});
  const [quickAddSprintId, setQuickAddSprintId] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  const toggleContainer = (id: string) => {
    setCollapsedContainers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const targetSprintId = destination.droppableId === 'backlog' ? null : destination.droppableId;
    updateTaskMutation.mutate({
      id: draggableId,
      sprintId: targetSprintId,
      order: destination.index,
    });
  };

  const handleQuickAdd = async (sprintId: string | null) => {
    if (!quickAddTitle.trim() || !activeProjectId) return;
    await createTaskMutation.mutateAsync({
      projectId: activeProjectId,
      sprintId: sprintId || undefined,
      title: quickAddTitle.trim(),
      issueType: 'STORY',
      priority: 'MEDIUM',
      storyPoints: 3,
    });
    setQuickAddTitle('');
    setQuickAddSprintId(null);
  };

  // Group tasks by sprint
  const sprintTasksMap: Record<string, Task[]> = {};
  sprints.forEach((s) => {
    sprintTasksMap[s.id] = [];
  });
  const backlogTasks: Task[] = [];

  tasks.forEach((t) => {
    if (t.sprintId && sprintTasksMap[t.sprintId]) {
      sprintTasksMap[t.sprintId].push(t);
    } else {
      backlogTasks.push(t);
    }
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 select-none bg-[var(--bg-canvas)] transition-colors">
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Sprints list */}
        {sprints.map((sprint) => {
          const sprintTasks = sprintTasksMap[sprint.id] || [];
          const isCollapsed = collapsedContainers[sprint.id] ?? false;
          const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
          const completedPoints = sprintTasks
            .filter((t) => t.status?.category === 'DONE')
            .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

          return (
            <div
              key={sprint.id}
              className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-sm transition-colors"
            >
              {/* Sprint Header */}
              <div className="px-4 py-3 bg-[var(--bg-elevated)] flex items-center justify-between flex-wrap gap-2 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2.5">
                  <button onClick={() => toggleContainer(sprint.id)} className="text-[var(--text-muted)]">
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[var(--text-primary)]">{sprint.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          sprint.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : sprint.status === 'COMPLETED'
                            ? 'bg-slate-200 dark:bg-slate-700/50 text-[var(--text-secondary)]'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {sprint.status}
                      </span>
                    </div>
                    {sprint.goal && <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Goal: {sprint.goal}</p>}
                  </div>
                </div>

                {/* Sprint Metrics & Action Buttons */}
                <div className="flex items-center gap-3">
                  {/* Story Points summary */}
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold border border-[var(--border-subtle)]">
                      {totalPoints} pts
                    </span>
                    {sprint.status === 'ACTIVE' && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800">
                        {completedPoints} done
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {sprint.status === 'PLANNING' && (
                    <button
                      onClick={() => setSprintModalOpen(true, { mode: 'start', sprint })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Sprint</span>
                    </button>
                  )}

                  {sprint.status === 'ACTIVE' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSprintReportOpen(true, sprint.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-indigo-600 dark:text-indigo-300 border border-[var(--border-default)] text-xs font-semibold transition-colors shadow-sm"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Burndown Report</span>
                      </button>
                      <button
                        onClick={() => setSprintModalOpen(true, { mode: 'complete', sprint })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete Sprint</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Droppable Task Container for Sprint */}
              {!isCollapsed && (
                <Droppable droppableId={sprint.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2 space-y-1.5 min-h-[50px] divide-y divide-[var(--border-subtle)] ${
                        snapshot.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      {sprintTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => setActiveTaskId(task.id)}
                              className={`flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface)] border hover:border-indigo-400 dark:hover:border-slate-600 transition-all cursor-pointer text-xs shadow-sm ${
                                dragSnapshot.isDragging
                                  ? 'border-indigo-500 shadow-xl bg-[var(--bg-elevated)] ring-2 ring-indigo-500/20'
                                  : 'border-[var(--border-subtle)]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
                                <IssueTypeBadge type={task.issueType} showLabel={false} />
                                <span className="font-mono text-[var(--text-muted)] font-bold">{task.key}</span>
                                <span className="font-semibold text-[var(--text-primary)] truncate">{task.title}</span>
                                {task.epic && (
                                  <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                                    {task.epic.key}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <StatusBadge status={task.status} />
                                <PriorityBadge priority={task.priority} showLabel={false} />
                                {task.storyPoints !== null && (
                                  <span className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-mono text-[11px] font-bold border border-[var(--border-subtle)]">
                                    {task.storyPoints} pts
                                  </span>
                                )}
                                <div className="flex items-center -space-x-1">
                                  {task.assignees?.map((u) => (
                                    <Avatar key={u.id} name={u.name} avatarUrl={u.avatarUrl} size="xs" />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* Quick add in sprint */}
                      {quickAddSprintId === sprint.id ? (
                        <div className="p-2 flex items-center gap-2 bg-[var(--bg-elevated)] rounded-xl border border-indigo-500/50">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Add story or task to this sprint..."
                            value={quickAddTitle}
                            onChange={(e) => setQuickAddTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleQuickAdd(sprint.id);
                              if (e.key === 'Escape') setQuickAddSprintId(null);
                            }}
                            className="flex-1 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-primary)] outline-none"
                          />
                          <button
                            onClick={() => handleQuickAdd(sprint.id)}
                            className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-semibold"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setQuickAddSprintId(null)}
                            className="px-2 py-1 text-[var(--text-muted)] text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setQuickAddSprintId(sprint.id)}
                          className="w-full text-left p-2 text-[var(--text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-[var(--bg-hover)] rounded-lg flex items-center gap-1.5 transition-colors font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Issue to {sprint.name}</span>
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          );
        })}

        {/* Backlog Container */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-sm transition-colors">
          <div className="px-4 py-3 bg-[var(--bg-elevated)] flex items-center justify-between border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-[var(--text-primary)]">📦 Backlog Grooming</span>
              <span className="text-xs text-[var(--text-secondary)]">({backlogTasks.length} unassigned issues)</span>
            </div>

            <div className="font-mono text-xs text-[var(--text-primary)] font-bold">
              {backlogTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)} pts total
            </div>
          </div>

          <Droppable droppableId="backlog">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`p-2 space-y-1.5 min-h-[80px] ${snapshot.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}
              >
                {backlogTasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        onClick={() => setActiveTaskId(task.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface)] border hover:border-indigo-400 dark:hover:border-slate-600 transition-all cursor-pointer text-xs shadow-sm ${
                          dragSnapshot.isDragging ? 'border-indigo-500 shadow-xl bg-[var(--bg-elevated)] ring-2 ring-indigo-500/20' : 'border-[var(--border-subtle)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
                          <IssueTypeBadge type={task.issueType} showLabel={false} />
                          <span className="font-mono text-[var(--text-muted)] font-bold">{task.key}</span>
                          <span className="font-semibold text-[var(--text-primary)] truncate">{task.title}</span>
                          {task.epic && (
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                              {task.epic.key}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <StatusBadge status={task.status} />
                          <PriorityBadge priority={task.priority} showLabel={false} />
                          {task.storyPoints !== null && (
                            <span className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-mono text-[11px] font-bold border border-[var(--border-subtle)]">
                              {task.storyPoints} pts
                            </span>
                          )}
                          <div className="flex items-center -space-x-1">
                            {task.assignees?.map((u) => (
                              <Avatar key={u.id} name={u.name} avatarUrl={u.avatarUrl} size="xs" />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {/* Quick add to backlog */}
                {quickAddSprintId === 'backlog' ? (
                  <div className="p-2 flex items-center gap-2 bg-[var(--bg-elevated)] rounded-xl border border-indigo-500/50">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Add task to backlog..."
                      value={quickAddTitle}
                      onChange={(e) => setQuickAddTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAdd(null);
                        if (e.key === 'Escape') setQuickAddSprintId(null);
                      }}
                      className="flex-1 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-primary)] outline-none"
                    />
                    <button
                      onClick={() => handleQuickAdd(null)}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-semibold"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setQuickAddSprintId(null)}
                      className="px-2 py-1 text-[var(--text-muted)] text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setQuickAddSprintId('backlog')}
                    className="w-full text-left p-2 text-[var(--text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-[var(--bg-hover)] rounded-lg flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Issue in Backlog</span>
                  </button>
                )}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
};
