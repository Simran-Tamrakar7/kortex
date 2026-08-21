import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { useWorkspaceTree, useSprints, useTasks } from '../../api/queries';
import {
  Layers,
  Folder,
  FolderGit2,
  Cpu,
  LifeBuoy,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  BarChart3,
  Clock,
  Zap,
  Settings,
  LayoutGrid,
  Shield,
  PanelLeftClose,
  PanelLeft,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';

export const Sidebar: React.FC = () => {
  const { organization, activeWorkspaceId, setActiveWorkspaceId } = useAuthStore();
  const {
    activeProjectId,
    setActiveProjectId,
    activeMainSection,
    setActiveMainSection,
    activeView,
    setActiveView,
    filters,
    setFilter,
    setSprintModalOpen,
    setOrgSettingsOpen,
    setTimeModalOpen,
    setAutomationsOpen,
    setGuideOpen,
  } = useAppStore();

  const queryClient = useQueryClient();
  const { data: workspaces = [] } = useWorkspaceTree(organization?.id);
  const { data: sprints = [] } = useSprints(activeProjectId);
  const { data: allTasks = [] } = useTasks(activeProjectId);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ all: true });
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectKey, setNewProjectKey] = useState('');
  const [newProjectType, setNewProjectType] = useState('SOFTWARE_SCRUM');

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !newProjectName || !newProjectKey) return;

    try {
      const res = await apiClient.post('/projects', {
        workspaceId: currentWorkspace.id,
        name: newProjectName,
        key: newProjectKey.toUpperCase(),
        type: newProjectType,
      });

      queryClient.invalidateQueries({ queryKey: ['workspace-tree'] });
      setActiveProjectId(res.data.id);
      setIsNewProjectModalOpen(false);
      setNewProjectName('');
      setNewProjectKey('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create project');
    }
  };

  if (isCollapsed) {
    return (
      <aside className="w-14 border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex flex-col items-center py-3 justify-between shrink-0 select-none z-20 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg"
            title="Expand Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow">
            {organization?.name?.[0] || 'K'}
          </div>
          <div className="w-8 h-px bg-[var(--border-subtle)]" />
          <button
            onClick={() => setActiveMainSection('PROJECT')}
            className={`p-2 rounded-lg transition-colors ${
              activeMainSection === 'PROJECT' ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
            title="Projects"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveMainSection('DOCS')}
            className={`p-2 rounded-lg transition-colors ${
              activeMainSection === 'DOCS' ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
            title="Docs Wiki"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveMainSection('DASHBOARDS')}
            className={`p-2 rounded-lg transition-colors ${
              activeMainSection === 'DASHBOARDS' ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
            title="Dashboards"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTimeModalOpen(true)}
            className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            title="Timesheet"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAutomationsOpen(true)}
            className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            title="Automations"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => setOrgSettingsOpen(true)}
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex flex-col justify-between shrink-0 select-none z-20 text-xs transition-colors">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Workspace Selector Dropdown */}
        <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
              {currentWorkspace?.name?.[0] || 'W'}
            </div>
            <select
              value={activeWorkspaceId || ''}
              onChange={(e) => setActiveWorkspaceId(e.target.value)}
              className="bg-transparent text-[var(--text-primary)] font-bold text-xs border-none outline-none cursor-pointer truncate max-w-[140px]"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Main Apps */}
          <div className="space-y-0.5">
            <button
              onClick={() => setActiveMainSection('PROJECT')}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-semibold ${
                activeMainSection === 'PROJECT'
                  ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-indigo-500" />
              <span>Work & Projects</span>
            </button>
            <button
              onClick={() => setActiveMainSection('DOCS')}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-semibold ${
                activeMainSection === 'DOCS'
                  ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-500" />
              <span>ClickUp Docs & Wiki</span>
            </button>
            <button
              onClick={() => setActiveMainSection('DASHBOARDS')}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-semibold ${
                activeMainSection === 'DASHBOARDS'
                  ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>Agile Dashboards</span>
            </button>
            <button
              onClick={() => setTimeModalOpen(true)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors font-semibold"
            >
              <Clock className="w-4 h-4 text-cyan-500" />
              <span>Timesheet & Logs</span>
            </button>
            <button
              onClick={() => setAutomationsOpen(true)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors font-semibold"
            >
              <Zap className="w-4 h-4 text-purple-500" />
              <span>Workflow Automations</span>
            </button>
          </div>

          {/* Projects Hierarchy */}
          <div>
            <div className="flex items-center justify-between px-2.5 py-1 text-[var(--text-muted)] font-bold tracking-wider text-xs uppercase">
              <span>Spaces & Projects</span>
              <button
                onClick={() => setIsNewProjectModalOpen(true)}
                className="p-0.5 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded"
                title="Create New Project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Folders & Projects inside Current Workspace */}
            <div className="mt-1 space-y-1">
              {currentWorkspace?.folders?.map((folder: any) => {
                const isOpen = openFolders[folder.id] ?? true;
                return (
                  <div key={folder.id} className="space-y-0.5">
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className="w-full flex items-center gap-1.5 px-2 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors font-semibold"
                    >
                      {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <Folder className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="truncate">{folder.name}</span>
                    </button>

                    {isOpen && (
                      <div className="pl-4 space-y-0.5">
                        {folder.projects?.map((proj: any) => {
                          const isSelected = activeProjectId === proj.id && activeMainSection === 'PROJECT';
                          return (
                            <div key={proj.id} className="space-y-0.5">
                              <button
                                onClick={() => {
                                  setActiveProjectId(proj.id);
                                  setActiveMainSection('PROJECT');
                                }}
                                className={`w-full flex items-center justify-between px-2 py-1 rounded transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 font-bold border-l-2 border-indigo-500'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  {proj.type === 'SERVICE_DESK' ? (
                                    <LifeBuoy className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  ) : (
                                    <FolderGit2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  )}
                                  <span className="truncate">{proj.name}</span>
                                </div>
                                <span className="text-xs text-[var(--text-muted)] font-mono ml-1">{proj.key}</span>
                              </button>

                              {/* ClickUp 3.0 Exact Sprint Folder Hierarchy */}
                              {isSelected && (
                                <div className="pl-3 space-y-1 pt-1 ml-1.5 border-l border-slate-700/50">
                                  {/* Sprints Folder Header */}
                                  <div className="flex items-center justify-between px-2 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)]">
                                    <div className="flex items-center gap-1.5 truncate">
                                      <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                      <span className="truncate">{proj.name} Sprints</span>
                                    </div>
                                    <span className="text-xs text-[var(--text-muted)] font-mono">
                                      {sprints.length}
                                    </span>
                                  </div>

                                  {/* Sprints List (ClickUp 3.0 Style) */}
                                  <div className="pl-2 space-y-0.5">
                                    {sprints.map((sp, idx) => {
                                      const sprintTasks = allTasks.filter((t) => t.sprintId === sp.id);
                                      const isFilterActive = filters.sprintId === sp.id;
                                      const dateLabel = sp.startDate
                                        ? `[${new Date(sp.startDate).toLocaleDateString([], { month: '2-digit', day: '2-digit' })}${sp.endDate ? ` - ${new Date(sp.endDate).toLocaleDateString([], { month: '2-digit', day: '2-digit' })}` : ''}]`
                                        : `[Sprint ${idx + 1}]`;

                                      return (
                                        <button
                                          key={sp.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveView('BOARD');
                                            setFilter('sprintId', sp.id);
                                          }}
                                          className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors group ${
                                            isFilterActive
                                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-bold border-l-2 border-emerald-500'
                                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5 truncate pr-1">
                                            {sp.status === 'ACTIVE' ? (
                                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-sm animate-pulse" />
                                            ) : sp.status === 'COMPLETED' ? (
                                              <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 shrink-0" />
                                            ) : (
                                              <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 shrink-0" />
                                            )}
                                            <span className="truncate group-hover:text-emerald-500">
                                              {sp.name.split(' — ')[0]} <span className="text-xs text-[var(--text-muted)] font-mono">{dateLabel}</span>
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1 shrink-0">
                                            {sp.status === 'ACTIVE' && (
                                              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                                                {sprintTasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length || 1}
                                              </span>
                                            )}
                                            <span className="text-xs font-mono text-[var(--text-muted)] group-hover:text-[var(--text-primary)] min-w-[14px] text-right">
                                              {sprintTasks.length || sp.totalPoints || 0}
                                            </span>
                                          </div>
                                        </button>
                                      );
                                    })}

                                    {/* Product Backlog List Item */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveView('BACKLOG');
                                        setFilter('sprintId', undefined);
                                      }}
                                      className="w-full flex items-center justify-between px-2 py-1 rounded text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors group"
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span className="truncate group-hover:text-indigo-500 font-medium">Product Backlog</span>
                                      </div>
                                      <span className="text-xs font-mono text-[var(--text-muted)]">
                                        {allTasks.filter((t) => !t.sprintId).length}
                                      </span>
                                    </button>

                                    {/* + Create Sprint Action */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSprintModalOpen(true, { mode: 'create', sprint: null });
                                      }}
                                      className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold mt-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Create Sprint</span>
                                    </button>
                                  </div>
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

              {/* Direct Projects */}
              {currentWorkspace?.projects?.map((proj: any) => {
                const isSelected = activeProjectId === proj.id && activeMainSection === 'PROJECT';
                return (
                  <div key={proj.id} className="space-y-0.5">
                    <button
                      onClick={() => {
                        setActiveProjectId(proj.id);
                        setActiveMainSection('PROJECT');
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1 rounded transition-colors ${
                        isSelected
                          ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 font-bold border-l-2 border-indigo-500'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {proj.type === 'SERVICE_DESK' ? (
                          <LifeBuoy className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Cpu className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        )}
                        <span className="truncate">{proj.name}</span>
                      </div>
                      <span className="text-xs text-[var(--text-muted)] font-mono ml-1">{proj.key}</span>
                    </button>

                    {/* Sprints Folder for Direct Project */}
                    {isSelected && (
                      <div className="pl-3 space-y-1 pt-1 ml-1.5 border-l border-slate-700/50">
                        <div className="flex items-center justify-between px-2 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)]">
                          <div className="flex items-center gap-1.5 truncate">
                            <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate">{proj.name} Sprints</span>
                          </div>
                          <span className="text-xs text-[var(--text-muted)] font-mono">{sprints.length}</span>
                        </div>

                        <div className="pl-2 space-y-0.5">
                          {sprints.map((sp, idx) => {
                            const sprintTasks = allTasks.filter((t) => t.sprintId === sp.id);
                            const isFilterActive = filters.sprintId === sp.id;
                            const dateLabel = sp.startDate
                              ? `[${new Date(sp.startDate).toLocaleDateString([], { month: '2-digit', day: '2-digit' })}${sp.endDate ? ` - ${new Date(sp.endDate).toLocaleDateString([], { month: '2-digit', day: '2-digit' })}` : ''}]`
                              : `[Sprint ${idx + 1}]`;

                            return (
                              <button
                                key={sp.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveView('BOARD');
                                  setFilter('sprintId', sp.id);
                                }}
                                className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors group ${
                                  isFilterActive
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-bold border-l-2 border-emerald-500'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate pr-1">
                                  {sp.status === 'ACTIVE' ? (
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-sm animate-pulse" />
                                  ) : sp.status === 'COMPLETED' ? (
                                    <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 shrink-0" />
                                  ) : (
                                    <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 shrink-0" />
                                  )}
                                  <span className="truncate group-hover:text-emerald-500">
                                    {sp.name.split(' — ')[0]} <span className="text-xs text-[var(--text-muted)] font-mono">{dateLabel}</span>
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {sp.status === 'ACTIVE' && (
                                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                                      {sprintTasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length || 1}
                                    </span>
                                  )}
                                  <span className="text-xs font-mono text-[var(--text-muted)] group-hover:text-[var(--text-primary)] min-w-[14px] text-right">
                                    {sprintTasks.length || sp.totalPoints || 0}
                                  </span>
                                </div>
                              </button>
                            );
                          })}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveView('BACKLOG');
                              setFilter('sprintId', undefined);
                            }}
                            className="w-full flex items-center justify-between px-2 py-1 rounded text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors group"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate group-hover:text-indigo-500 font-medium">Product Backlog</span>
                            </div>
                            <span className="text-xs font-mono text-[var(--text-muted)]">
                              {allTasks.filter((t) => !t.sprintId).length}
                            </span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSprintModalOpen(true, { mode: 'create', sprint: null });
                            }}
                            className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold mt-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Create Sprint</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Org Settings & Guide */}
      <div className="p-2 border-t border-[var(--border-subtle)] space-y-1">
        <button
          onClick={() => setGuideOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors w-full font-medium"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          <span>Platform Documentation</span>
        </button>
        <button
          onClick={() => setOrgSettingsOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors w-full font-medium"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Workspace Preferences</span>
        </button>
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Create Project</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Set up a Jira Scrum/Kanban board or Service Desk for your team.
            </p>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile Client Core"
                  value={newProjectName}
                  onChange={(e) => {
                    setNewProjectName(e.target.value);
                    if (!newProjectKey) {
                      setNewProjectKey(
                        e.target.value
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 4)
                      );
                    }
                  }}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Project Key</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. MOB"
                  value={newProjectKey}
                  onChange={(e) => setNewProjectKey(e.target.value.toUpperCase())}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-3 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Project Type</label>
                <select
                  value={newProjectType}
                  onChange={(e) => setNewProjectType(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:border-indigo-500 outline-none"
                >
                  <option value="SOFTWARE_SCRUM">Software Scrum (Sprints + Backlog + Points)</option>
                  <option value="SOFTWARE_KANBAN">Software Kanban (WIP limits + Continuous flow)</option>
                  <option value="BUSINESS">Business & Marketing (General task lists)</option>
                  <option value="SERVICE_DESK">IT Service Desk (SLA rules & Incident queues)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
