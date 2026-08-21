import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { usePresenceStore } from '../../store/usePresenceStore';
import { useTasks, useProject } from '../../api/queries';
import { socketService } from '../../api/socket';
import { SOCKET_EVENTS } from '@kortex/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useUrlFilterSync } from '../../lib/useUrlFilterSync';
import { sortTasksByParam } from '../../lib/urlFilters';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ViewTabs } from './ViewTabs';

// Views
import { OverviewView } from '../views/OverviewView';
import { ListView } from '../views/ListView';
import { KanbanView } from '../views/KanbanView';
import { BacklogView } from '../views/BacklogView';
import { GanttView } from '../views/GanttView';
import { CalendarView } from '../views/CalendarView';
import { WorkloadView } from '../views/WorkloadView';
import { MindMapView } from '../views/MindMapView';
import { TableView } from '../views/TableView';

// Sections
import { DocsView } from '../docs/DocsView';
import { DashboardView } from '../dashboards/DashboardView';

// Modals
import { AuthModal } from '../auth/AuthModal';
import { TaskDetailModal } from '../tasks/TaskDetailModal';
import { TaskCreateModal } from '../tasks/TaskCreateModal';
import { BulkActionBar } from '../tasks/BulkActionBar';
import { SprintReportsModal } from '../agile/SprintReportsModal';
import { SprintModal } from '../agile/SprintModal';
import { TimeTrackingModal } from '../time/TimeTrackingModal';
import { AutomationsModal } from '../automations/AutomationsModal';
import { CommandPalette } from '../search/CommandPalette';
import { OrgSettingsModal } from '../settings/OrgSettingsModal';
import { ProjectSettingsModal } from '../settings/ProjectSettingsModal';
import { PlatformGuideModal } from '../docs/PlatformGuideModal';
import { ToastManager } from '../common/ToastManager';

export const AppLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const {
    activeProjectId,
    setActiveProjectId,
    activeView,
    activeMainSection,
    filters,
  } = useAppStore();

  const { setOnlineUsers, setTyping } = usePresenceStore();
  const queryClient = useQueryClient();

  useUrlFilterSync();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Project data & Tasks — string sprintId filters server/mock; null = backlog handled client-side
  const { data: project } = useProject(activeProjectId);
  const sprintParam =
    typeof filters.sprintId === 'string' && filters.sprintId ? filters.sprintId : undefined;
  const { data: rawTasks = [] } = useTasks(activeProjectId, {
    sprintId: sprintParam,
    search: filters.search,
    statusId: filters.statusIds[0],
    priority: filters.priorities[0],
    issueType: filters.issueTypes[0],
  });

  // Filter tasks in client (My Tasks + backlog-only when sprintId === null)
  const filteredTasks = sortTasksByParam(
    rawTasks.filter((task) => {
      if (filters.sprintId === null && task.sprintId) return false;
      if (filters.onlyMyTasks && user) {
        const isAssigned = task.assignees?.some((a) => a.id === user.id);
        const isReporter = task.reporterId === user.id;
        if (!isAssigned && !isReporter) return false;
      }
      return true;
    }),
    filters.sort
  );

  // Setup WebSocket room and event listeners
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (activeProjectId) {
      socketService.joinProject(activeProjectId);
      socketService.updatePresence({
        userId: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        currentLocation: { projectId: activeProjectId, view: activeView },
      });
    }

    const handleTaskUpdated = (task: any) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.projectId] });
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      queryClient.invalidateQueries({ queryKey: ['sprints', task.projectId] });
    };

    const handlePresenceSync = (users: any[]) => {
      setOnlineUsers(users);
    };

    const handleUserTyping = (data: any) => {
      setTyping(data);
    };

    socketService.on(SOCKET_EVENTS.TASK_CREATED, handleTaskUpdated);
    socketService.on(SOCKET_EVENTS.TASK_UPDATED, handleTaskUpdated);
    socketService.on(SOCKET_EVENTS.TASK_DELETED, handleTaskUpdated);
    socketService.on(SOCKET_EVENTS.SPRINT_UPDATED, handleTaskUpdated);
    socketService.on(SOCKET_EVENTS.PRESENCE_SYNC, handlePresenceSync);
    socketService.on(SOCKET_EVENTS.USER_TYPING, handleUserTyping);

    return () => {
      if (activeProjectId) {
        socketService.leaveProject(activeProjectId);
      }
      socketService.off(SOCKET_EVENTS.TASK_CREATED);
      socketService.off(SOCKET_EVENTS.TASK_UPDATED);
      socketService.off(SOCKET_EVENTS.TASK_DELETED);
      socketService.off(SOCKET_EVENTS.SPRINT_UPDATED);
      socketService.off(SOCKET_EVENTS.PRESENCE_SYNC);
      socketService.off(SOCKET_EVENTS.USER_TYPING);
    };
  }, [isAuthenticated, activeProjectId, activeView, user, queryClient, setOnlineUsers, setTyping]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#0b0f17] flex items-center justify-center text-slate-400 select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 animate-pulse" />
          <span className="text-xs font-medium">Booting Kortex Work Management Engine...</span>
        </div>
      </div>
    );
  }

  // Direct dashboard entry mode (auth modal disabled for open preview)
  // if (!isAuthenticated) {
  //   return <AuthModal />;
  // }

  return (
    <div className="h-screen w-screen bg-[#0b0f17] text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Top Navigation Header */}
      <Header />

      {/* Main Container: Sidebar + Workspace Canvas */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        {/* Dynamic Center Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeMainSection === 'PROJECT' && (
            <>
              <ViewTabs totalTaskCount={filteredTasks.length} />

              {activeView === 'OVERVIEW' && <OverviewView tasks={filteredTasks} />}
              {activeView === 'LIST' && <ListView tasks={filteredTasks} />}
              {activeView === 'BOARD' && <KanbanView tasks={filteredTasks} />}
              {activeView === 'BACKLOG' && <BacklogView tasks={filteredTasks} />}
              {activeView === 'GANTT' && <GanttView tasks={filteredTasks} />}
              {activeView === 'CALENDAR' && <CalendarView tasks={filteredTasks} />}
              {activeView === 'WORKLOAD' && <WorkloadView tasks={filteredTasks} />}
              {activeView === 'MINDMAP' && <MindMapView tasks={filteredTasks} />}
              {activeView === 'TABLE' && <TableView tasks={filteredTasks} />}
            </>
          )}

          {activeMainSection === 'DOCS' && <DocsView />}
          {activeMainSection === 'DASHBOARDS' && <DashboardView />}
        </main>
      </div>

      {/* Modals & Drawers */}
      <TaskDetailModal />
      <TaskCreateModal />
      <BulkActionBar />
      <SprintReportsModal />
      <SprintModal />
      <TimeTrackingModal />
      <AutomationsModal />
      <CommandPalette />
      <OrgSettingsModal />
      <ProjectSettingsModal />
      <PlatformGuideModal />
      <ToastManager />
    </div>
  );
};
