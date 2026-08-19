import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useProject, useSprints } from '../../api/queries';
import { ViewType, Priority, IssueType } from '@kortex/shared';
import {
  List,
  Columns3,
  Layers,
  Calendar,
  BarChart2,
  Users,
  GitFork,
  Table as TableIcon,
  Filter,
  UserCheck,
  X,
  Plus,
  Play,
  RotateCcw,
} from 'lucide-react';

interface Props {
  totalTaskCount?: number;
}

export const ViewTabs: React.FC<Props> = ({ totalTaskCount = 0 }) => {
  const {
    activeProjectId,
    activeView,
    setActiveView,
    filters,
    setFilter,
    resetFilters,
    setSprintModalOpen,
  } = useAppStore();

  const { data: project } = useProject(activeProjectId);
  const { data: sprints = [] } = useSprints(activeProjectId);

  const views: { type: ViewType; label: string; icon: React.ReactNode }[] = [
    { type: 'LIST', label: 'List', icon: <List className="w-3.5 h-3.5" /> },
    { type: 'BOARD', label: 'Kanban Board', icon: <Columns3 className="w-3.5 h-3.5" /> },
    { type: 'BACKLOG', label: 'Sprint Backlog', icon: <Layers className="w-3.5 h-3.5" /> },
    { type: 'GANTT', label: 'Timeline / Gantt', icon: <BarChart2 className="w-3.5 h-3.5 rotate-90" /> },
    { type: 'CALENDAR', label: 'Calendar', icon: <Calendar className="w-3.5 h-3.5" /> },
    { type: 'WORKLOAD', label: 'Workload', icon: <Users className="w-3.5 h-3.5" /> },
    { type: 'MINDMAP', label: 'Mind Map', icon: <GitFork className="w-3.5 h-3.5" /> },
    { type: 'TABLE', label: 'Spreadsheet', icon: <TableIcon className="w-3.5 h-3.5" /> },
  ];

  const hasActiveFilters =
    filters.search ||
    filters.onlyMyTasks ||
    filters.priorities.length > 0 ||
    filters.issueTypes.length > 0 ||
    filters.statusIds.length > 0 ||
    filters.sprintId !== undefined;

  return (
    <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] px-4 pt-2.5 pb-2 shrink-0 select-none space-y-2 transition-colors">
      {/* Top row: Project Title, Key & 8 Views Tab Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {views.map((v) => {
            const isActive = activeView === v.type;
            return (
              <button
                key={v.type}
                onClick={() => setActiveView(v.type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 shadow-sm border border-indigo-500/30'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {v.icon}
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Sprint action / Quick Add */}
        <div className="flex items-center gap-2">
          {project?.type === 'SOFTWARE_SCRUM' && (
            <button
              onClick={() => setSprintModalOpen(true, { mode: 'create', projectId: project.id })}
              className="flex items-center gap-1.5 text-xs text-[var(--text-primary)] hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-[var(--border-default)] px-2.5 py-1.5 rounded-lg transition-colors font-medium shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-500" />
              <span>Create Sprint</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Filter Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-1.5 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick search inside current view */}
          <input
            type="text"
            placeholder="Filter tasks..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md px-2.5 py-1 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-indigo-500 outline-none w-44 shadow-sm"
          />

          {/* My Tasks Toggle */}
          <button
            onClick={() => setFilter('onlyMyTasks', !filters.onlyMyTasks)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors border text-xs font-semibold ${
              filters.onlyMyTasks
                ? 'bg-indigo-600/15 border-indigo-500 text-indigo-600 dark:text-indigo-300'
                : 'bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Tasks</span>
          </button>

          {/* Priority Quick Filter */}
          <select
            value={filters.priorities[0] || ''}
            onChange={(e) =>
              setFilter('priorities', e.target.value ? ([e.target.value] as Priority[]) : [])
            }
            className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md px-2 py-1 text-xs text-[var(--text-primary)] outline-none cursor-pointer shadow-sm"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">🔴 Urgent</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">⚪ Low</option>
          </select>

          {/* Issue Type Filter */}
          <select
            value={filters.issueTypes[0] || ''}
            onChange={(e) =>
              setFilter('issueTypes', e.target.value ? ([e.target.value] as IssueType[]) : [])
            }
            className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md px-2 py-1 text-xs text-[var(--text-primary)] outline-none cursor-pointer shadow-sm"
          >
            <option value="">All Types</option>
            <option value="EPIC">⚡ Epic</option>
            <option value="STORY">🔖 Story</option>
            <option value="TASK">☑️ Task</option>
            <option value="BUG">⚠️ Bug</option>
          </select>

          {/* Sprint Filter */}
          {sprints.length > 0 && (
            <select
              value={filters.sprintId === undefined ? 'all' : filters.sprintId || 'backlog'}
              onChange={(e) => {
                if (e.target.value === 'all') setFilter('sprintId', undefined);
                else if (e.target.value === 'backlog') setFilter('sprintId', null);
                else setFilter('sprintId', e.target.value);
              }}
              className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md px-2 py-1 text-xs text-[var(--text-primary)] outline-none cursor-pointer shadow-sm"
            >
              <option value="all">All Sprints & Backlog</option>
              <option value="backlog">📦 Backlog Only</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.status === 'ACTIVE' ? '🏃 Active: ' : '📋 '} {s.name}
                </option>
              ))}
            </select>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded border border-rose-200 dark:border-rose-900/50 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="text-[11px] text-[var(--text-secondary)] font-bold">
          {totalTaskCount} {totalTaskCount === 1 ? 'task' : 'tasks'}
        </div>
      </div>
    </div>
  );
};
