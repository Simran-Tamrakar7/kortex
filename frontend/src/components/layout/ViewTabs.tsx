import React, { useState } from 'react';
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
  Flame,
  Clock,
  UserX,
  CheckCircle2,
  Zap,
  Bug,
  Bookmark,
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

  const [activePreset, setActivePreset] = useState<string | null>(null);

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

  const presets = [
    {
      id: 'high-priority',
      label: 'High Priority',
      icon: <Flame className="w-3 h-3 text-rose-500" />,
      apply: () => {
        resetFilters();
        setFilter('priorities', ['URGENT', 'HIGH'] as Priority[]);
        setActivePreset('high-priority');
      },
    },
    {
      id: 'my-tasks',
      label: 'My Tasks',
      icon: <UserCheck className="w-3 h-3 text-indigo-500" />,
      apply: () => {
        resetFilters();
        setFilter('onlyMyTasks', true);
        setActivePreset('my-tasks');
      },
    },
    {
      id: 'bugs',
      label: 'Bugs Only',
      icon: <Bug className="w-3 h-3 text-amber-500" />,
      apply: () => {
        resetFilters();
        setFilter('issueTypes', ['BUG'] as IssueType[]);
        setActivePreset('bugs');
      },
    },
    {
      id: 'epics',
      label: 'Epics',
      icon: <Zap className="w-3 h-3 text-purple-500" />,
      apply: () => {
        resetFilters();
        setFilter('issueTypes', ['EPIC'] as IssueType[]);
        setActivePreset('epics');
      },
    },
  ];

  const hasActiveFilters =
    filters.search ||
    filters.onlyMyTasks ||
    filters.priorities.length > 0 ||
    filters.issueTypes.length > 0 ||
    filters.statusIds.length > 0 ||
    filters.sprintId !== undefined;

  const handleClear = () => {
    resetFilters();
    setActivePreset(null);
  };

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

      {/* Bottom row: Filter Toolbar with Saved Filter Presets */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-1.5 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick search inside current view */}
          <input
            type="text"
            placeholder="Filter tasks..."
            value={filters.search}
            onChange={(e) => {
              setFilter('search', e.target.value);
              setActivePreset(null);
            }}
            className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md px-2.5 py-1 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-indigo-500 outline-none w-40 shadow-sm"
          />

          {/* Quick Saved Filter Pills */}
          <div className="flex items-center gap-1.5">
            {presets.map((preset) => {
              const isSelected = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={preset.apply}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {preset.icon}
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>

          {/* Priority Dropdown Filter */}
          <select
            value={filters.priorities[0] || ''}
            onChange={(e) => {
              setFilter('priorities', e.target.value ? ([e.target.value] as Priority[]) : []);
              setActivePreset(null);
            }}
            className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md px-2 py-1 text-xs text-[var(--text-primary)] outline-none cursor-pointer shadow-sm"
          >
            <option value="">Priority</option>
            <option value="URGENT">🔴 Urgent</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">⚪ Low</option>
          </select>

          {/* Issue Type Dropdown Filter */}
          <select
            value={filters.issueTypes[0] || ''}
            onChange={(e) => {
              setFilter('issueTypes', e.target.value ? ([e.target.value] as IssueType[]) : []);
              setActivePreset(null);
            }}
            className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md px-2 py-1 text-xs text-[var(--text-primary)] outline-none cursor-pointer shadow-sm"
          >
            <option value="">Type</option>
            <option value="EPIC">⚡ Epic</option>
            <option value="STORY">🔖 Story</option>
            <option value="TASK">☑️ Task</option>
            <option value="BUG">⚠️ Bug</option>
          </select>

          {/* Clear Filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-600 font-semibold px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Task Count indicator */}
        <span className="text-[11px] text-[var(--text-muted)] font-mono font-medium">
          {totalTaskCount} items
        </span>
      </div>
    </div>
  );
};
