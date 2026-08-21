import React, { useState, useRef } from 'react';
import { Task } from '@kortex/shared';
import { useAppStore } from '../../store/useAppStore';
import { useProject } from '../../api/queries';
import { IssueTypeBadge } from '../common/IssueTypeBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import {
  GitFork,
  Zap,
  Bookmark,
  CheckSquare,
  Plus,
  Minus,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  ChevronRight,
  ChevronDown,
  Folder,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  tasks: Task[];
}

export const MindMapView: React.FC<Props> = ({ tasks }) => {
  const { activeProjectId, setActiveTaskId } = useAppStore();
  const { data: project } = useProject(activeProjectId);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
  });

  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const toggleNode = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const handleZoomIn = () => setScale((s) => Math.min(2.0, Number((s + 0.15).toFixed(2))));
  const handleZoomOut = () => setScale((s) => Math.max(0.4, Number((s - 0.15).toFixed(2))));
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 40, y: 40 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, [data-interactive="true"]')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Group Hierarchy:
  // Level 1: Epics + Unassigned Bucket
  // Level 2: Stories/Tasks belonging to Epic
  // Level 3: Subtasks belonging to Story/Task
  const epics = tasks.filter((t) => t.issueType === 'EPIC');
  const allNonEpics = tasks.filter((t) => t.issueType !== 'EPIC');

  // Stories / Top-level tasks for an epic (not a subtask)
  const getStoriesForEpic = (epicId: string) => {
    return allNonEpics.filter((t) => t.epicId === epicId && !t.parentId);
  };

  // Subtasks for a story/task
  const getSubtasksForTask = (parentTaskId: string) => {
    return allNonEpics.filter((t) => t.parentId === parentTaskId);
  };

  // Tasks with no epic link (Unassigned bucket)
  const standaloneStories = allNonEpics.filter((t) => !t.epicId && !t.parentId);

  const isRootExpanded = expandedNodes['root'] ?? true;
  const isUnassignedExpanded = expandedNodes['unassigned'] ?? true;

  return (
    <div
      className="flex-1 overflow-hidden bg-[var(--bg-canvas)] relative select-none cursor-grab active:cursor-grabbing transition-colors"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Floating Canvas Controls (Pan/Zoom toolbar) */}
      <div className="absolute top-4 right-4 z-20 bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-default)] rounded-xl shadow-lg p-1.5 flex items-center gap-1.5 text-xs text-[var(--text-primary)]">
        <button
          onClick={handleZoomIn}
          className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title="Zoom In (+15%)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="font-mono text-xs font-bold px-1 min-w-[42px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={handleZoomOut}
          className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title="Zoom Out (-15%)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-[var(--border-subtle)] mx-0.5" />
        <button
          onClick={handleResetZoom}
          className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 font-medium text-xs"
          title="Reset Canvas Position"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Transform Container with Pan & Zoom */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
        className="min-w-max p-12 flex items-start gap-16"
      >
        {/* Level 0: Project Root Node */}
        <div className="relative flex flex-col items-center">
          <div
            data-interactive="true"
            className="p-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl shadow-2xl border border-indigo-400/40 text-white flex items-center gap-3.5 min-w-[220px]"
          >
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center font-bold text-white shadow-inner">
              <Layers className="w-5 h-5 text-indigo-100" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-200">
                Project Root
              </span>
              <h3 className="font-bold text-sm truncate">{project?.name || 'Project Roadmap'}</h3>
              <p className="text-xs text-indigo-200 font-mono mt-0.5">
                {epics.length} Epics • {tasks.length} Total Issues
              </p>
            </div>
            <button
              onClick={(e) => toggleNode('root', e)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              {isRootExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Level 1: Epics & Unassigned Nodes */}
        {isRootExpanded && (
          <div className="flex flex-col gap-10 relative border-l-2 border-indigo-500/40 pl-10">
            {/* Epics List */}
            {epics.map((epic) => {
              const isEpicExpanded = expandedNodes[epic.id] ?? true;
              const childStories = getStoriesForEpic(epic.id);

              return (
                <div key={epic.id} className="flex items-start gap-10 relative">
                  {/* Connector Line to Root */}
                  <div className="absolute -left-10 top-6 w-10 h-0.5 bg-indigo-500/40" />

                  {/* Level 1 Node: Epic */}
                  <div
                    data-interactive="true"
                    onClick={() => setActiveTaskId(epic.id)}
                    className="p-3.5 bg-[var(--bg-card)] border border-purple-300 dark:border-purple-800/80 hover:border-purple-500 rounded-2xl shadow-md cursor-pointer flex items-center gap-3 w-72 justify-between transition-all group shrink-0"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-700/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="font-mono text-xs text-purple-600 dark:text-purple-400 font-bold">
                          {epic.key}
                        </span>
                        <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">
                          {epic.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] font-bold">
                        {childStories.length}
                      </span>
                      {childStories.length > 0 && (
                        <button
                          onClick={(e) => toggleNode(epic.id, e)}
                          className="p-1 rounded-md bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                        >
                          {isEpicExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Level 2: Stories & Tasks under Epic */}
                  {isEpicExpanded && childStories.length > 0 && (
                    <div className="flex flex-col gap-6 relative border-l-2 border-purple-500/40 pl-10">
                      {childStories.map((story) => {
                        const isStoryExpanded = expandedNodes[story.id] ?? true;
                        const subtasks = getSubtasksForTask(story.id);

                        return (
                          <div key={story.id} className="flex items-start gap-10 relative">
                            {/* Connector Line to Epic */}
                            <div className="absolute -left-10 top-5 w-10 h-0.5 bg-purple-500/40" />

                            {/* Level 2 Node: Story / Task */}
                            <div
                              data-interactive="true"
                              onClick={() => setActiveTaskId(story.id)}
                              className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-indigo-500 rounded-xl shadow-sm cursor-pointer flex items-center justify-between gap-3 w-64 transition-all group shrink-0"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <IssueTypeBadge type={story.issueType} showLabel={false} />
                                <div className="truncate">
                                  <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                                    {story.key}
                                  </span>
                                  <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                                    {story.title}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {subtasks.length > 0 && (
                                  <button
                                    onClick={(e) => toggleNode(story.id, e)}
                                    className="p-1 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                                  >
                                    {isStoryExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Level 3: Subtasks under Story/Task */}
                            {isStoryExpanded && subtasks.length > 0 && (
                              <div className="flex flex-col gap-3 relative border-l-2 border-blue-500/40 pl-8">
                                {subtasks.map((st) => (
                                  <div key={st.id} className="flex items-center gap-2 relative">
                                    <div className="absolute -left-8 w-8 h-0.5 bg-blue-500/40" />
                                    <div
                                      data-interactive="true"
                                      onClick={() => setActiveTaskId(st.id)}
                                      className="p-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-emerald-500 rounded-lg shadow-sm cursor-pointer flex items-center gap-2 w-52 text-xs transition-colors"
                                    >
                                      <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      <span className="font-mono text-xs text-indigo-500 font-bold shrink-0">
                                        {st.key}
                                      </span>
                                      <span className="truncate text-xs font-medium text-[var(--text-primary)]">
                                        {st.title}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Standalone / Unassigned Tasks Bucket */}
            {standaloneStories.length > 0 && (
              <div className="flex items-start gap-10 relative">
                <div className="absolute -left-10 top-5 w-10 h-0.5 bg-indigo-500/40" />
                <div
                  data-interactive="true"
                  className="p-3.5 bg-[var(--bg-card)] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-md w-72 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Folder className="w-5 h-5 text-slate-400" />
                    <div>
                      <h4 className="font-bold text-xs text-[var(--text-primary)]">
                        Unassigned / Standalone Tasks
                      </h4>
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        {standaloneStories.length} items without epic
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => toggleNode('unassigned', e)}
                    className="p-1 rounded-md bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                  >
                    {isUnassignedExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  </button>
                </div>

                {/* Standalone Child Tasks */}
                {isUnassignedExpanded && (
                  <div className="flex flex-col gap-3 relative border-l-2 border-slate-400/40 pl-8">
                    {standaloneStories.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 relative">
                        <div className="absolute -left-8 w-8 h-0.5 bg-slate-400/40" />
                        <div
                          data-interactive="true"
                          onClick={() => setActiveTaskId(task.id)}
                          className="p-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-indigo-400 rounded-xl shadow-sm cursor-pointer flex items-center gap-2 w-56 text-xs transition-colors"
                        >
                          <IssueTypeBadge type={task.issueType} showLabel={false} />
                          <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                            {task.key}
                          </span>
                          <span className="truncate font-medium text-[var(--text-primary)]">
                            {task.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
