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
    <div className="flex-1 overflow-auto p-8 bg-[#070b12] flex items-center justify-start select-none">
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
                {/* Connector line */}
                <div className="absolute -left-8 top-1/2 w-8 h-0.5 bg-indigo-500/30" />

                {/* Epic Node Card */}
                <div
                  onClick={() => setActiveTaskId(epic.id)}
                  className="p-3 bg-[#131d31] border border-purple-500/50 hover:border-purple-400 rounded-xl shadow-lg cursor-pointer flex items-center gap-2.5 transition-all hover:scale-[1.02] text-xs w-64 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono font-semibold text-purple-400">{epic.key}</span>
                    <p className="font-medium text-slate-100 truncate">{epic.title}</p>
                  </div>
                  {childTasks.length > 0 && (
                    <button
                      onClick={(e) => toggleNode(epic.id, e)}
                      className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {/* Level 2: Child tasks of Epic */}
                {isExpanded && childTasks.length > 0 && (
                  <div className="flex flex-col gap-3 relative border-l-2 border-purple-500/30 pl-8">
                    {childTasks.map((child) => (
                      <div key={child.id} className="flex items-center gap-3 relative">
                        <div className="absolute -left-8 top-1/2 w-8 h-0.5 bg-purple-500/30" />
                        <div
                          onClick={() => setActiveTaskId(child.id)}
                          className="p-2.5 bg-[#141e30] border border-[#233555] hover:border-slate-400 rounded-lg shadow cursor-pointer flex items-center gap-2 transition-all hover:scale-[1.02] text-xs w-56"
                        >
                          <IssueTypeBadge type={child.issueType} showLabel={false} />
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">{child.key}</span>
                          <span className="text-slate-200 truncate flex-1 font-medium">{child.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Standalone Tasks if any */}
          {standaloneTasks.length > 0 && (
            <div className="flex items-center gap-8 relative">
              <div className="absolute -left-8 top-1/2 w-8 h-0.5 bg-indigo-500/30" />
              <div className="p-3 bg-[#131d31] border border-blue-500/40 rounded-xl shadow-lg text-xs w-64">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Independent Tasks</span>
                  <span className="text-[10px] font-mono text-slate-400">({standaloneTasks.length})</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
