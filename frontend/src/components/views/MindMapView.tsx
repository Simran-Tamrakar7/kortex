import React, { useState } from 'react';
import { Task } from '@kortex/shared';
import { useAppStore } from '../../store/useAppStore';
import { useProject } from '../../api/queries';
import { IssueTypeBadge } from '../common/IssueTypeBadge';
import {
  GitFork,
  Zap,
  Bookmark,
  CheckSquare,
  Plus,
  Minus,
  Layers,
} from 'lucide-react';

interface Props {
  tasks: Task[];
}

export const MindMapView: React.FC<Props> = ({ tasks }) => {
  const { activeProjectId, setActiveTaskId } = useAppStore();
  const { data: project } = useProject(activeProjectId);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ root: true });

  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  // Group epics and child tasks
  const epics = tasks.filter((t) => t.issueType === 'EPIC');
  const standaloneTasks = tasks.filter((t) => t.issueType !== 'EPIC' && !t.epicId);

  const getChildTasks = (epicId: string) => {
    return tasks.filter((t) => t.epicId === epicId);
  };

  return (
    <div className="flex-1 overflow-auto p-8 bg-[var(--bg-canvas)] flex items-center justify-start select-none transition-colors">
      <div className="min-w-max flex items-center gap-12">
        {/* Root Project Node */}
        <div className="relative flex flex-col items-center">
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl shadow-2xl border border-indigo-400/40 text-white flex items-center gap-3">
            <Layers className="w-6 h-6 text-indigo-200" />
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold opacity-75">Project Root</span>
              <h3 className="font-bold text-sm">{project?.name || 'Project Mind Map'}</h3>
            </div>
          </div>
        </div>

        {/* Level 1: Epics and Standalone Branches */}
        <div className="flex flex-col gap-8 relative border-l-2 border-indigo-500/30 pl-8">
          {epics.map((epic) => {
            const isExpanded = expandedNodes[epic.id] ?? true;
            const childTasks = getChildTasks(epic.id);

            return (
              <div key={epic.id} className="flex items-center gap-8 relative">
                {/* Connector Line to Root */}
                <div className="absolute -left-8 w-8 h-0.5 bg-indigo-500/30" />

                {/* Epic Node */}
                <div
                  onClick={() => setActiveTaskId(epic.id)}
                  className="p-3 bg-[var(--bg-card)] border border-purple-300 dark:border-purple-800 rounded-xl shadow-md hover:border-purple-500 cursor-pointer flex items-center gap-3 w-64 justify-between transition-all group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Zap className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="font-bold text-xs text-[var(--text-primary)] truncate">{epic.title}</span>
                  </div>
                  {childTasks.length > 0 && (
                    <button
                      onClick={(e) => toggleNode(epic.id, e)}
                      className="p-1 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0"
                    >
                      {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {/* Level 2: Child tasks belonging to Epic */}
                {isExpanded && childTasks.length > 0 && (
                  <div className="flex flex-col gap-3 relative border-l-2 border-purple-500/30 pl-8">
                    {childTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 relative">
                        <div className="absolute -left-8 w-8 h-0.5 bg-purple-500/30" />
                        <div
                          onClick={() => setActiveTaskId(task.id)}
                          className="p-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-indigo-400 rounded-xl shadow-sm cursor-pointer flex items-center gap-2 w-56 text-xs transition-colors"
                        >
                          <IssueTypeBadge type={task.issueType} showLabel={false} />
                          <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{task.key}</span>
                          <span className="truncate font-medium text-[var(--text-primary)]">{task.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Standalone Tasks Branch */}
          {standaloneTasks.length > 0 && (
            <div className="flex items-start gap-8 relative">
              <div className="absolute -left-8 top-5 w-8 h-0.5 bg-indigo-500/30" />
              <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-md w-64">
                <span className="font-bold text-xs text-[var(--text-secondary)]">General Tasks ({standaloneTasks.length})</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
