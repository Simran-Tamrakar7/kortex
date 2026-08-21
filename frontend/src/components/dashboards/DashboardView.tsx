import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { useDashboardAnalytics } from '../../api/queries';
import { Avatar } from '../common/Avatar';
import { PriorityBadge } from '../common/PriorityBadge';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Activity,
  Layers,
  TrendingUp,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { organization } = useAuthStore();
  const { activeProjectId, setActiveTaskId, theme } = useAppStore();
  const { data: analytics, isLoading } = useDashboardAnalytics(activeProjectId, organization?.id);

  const summary = analytics?.summary || {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueCount: 0,
    totalHoursLogged: 0,
    billableHoursLogged: 0,
  };

  const statusBreakdown = analytics?.statusBreakdown || [];
  const priorityBreakdown = analytics?.priorityBreakdown || [];
  const overdueTasks = analytics?.overdueTasks || [];
  const recentActivity = analytics?.recentActivity || [];

  const tooltipBg = theme === 'dark' ? '#0f172a' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#334155' : '#cbd5e1';
  const tooltipText = theme === 'dark' ? '#f8fafc' : '#0f172a';

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[var(--bg-canvas)] select-none text-xs transition-colors">
      {/* Top Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <span>Executive & Agile Workload Dashboard</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-xs mt-0.5">
            Real-time delivery KPIs, team capacity utilization, and incident metrics.
          </p>
        </div>
      </div>

      {/* Top 4 KPI metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1">
            <span className="text-xs font-semibold">Total Work Items</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--text-primary)]">{summary.totalTasks}</p>
          <span className="text-xs text-[var(--text-muted)] font-medium">{summary.completedTasks} completed</span>
        </div>

        <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1">
            <span className="text-xs font-semibold">In Progress Velocity</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{summary.inProgressTasks}</p>
          <span className="text-xs text-[var(--text-muted)] font-medium">Active development</span>
        </div>

        <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1">
            <span className="text-xs font-semibold">Overdue Deadlines</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">{summary.overdueCount}</p>
          <span className="text-xs text-[var(--text-muted)] font-medium">Requires attention</span>
        </div>

        <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1">
            <span className="text-xs font-semibold">Logged Work Hours</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{summary.totalHoursLogged}h</p>
          <span className="text-xs text-[var(--text-muted)] font-medium">{summary.billableHoursLogged}h billable</span>
        </div>
      </div>

      {/* Grid of Chart Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Distribution Pie */}
        <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] shadow-sm space-y-3">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            <span>Tasks by Workflow Status</span>
          </h3>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: tooltipText,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Bar */}
        <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] shadow-sm space-y-3">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Tasks by Priority Level</span>
          </h3>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: tooltipText,
                  }}
                />
                <Bar dataKey="value" name="Task Count" radius={[4, 4, 0, 0]}>
                  {priorityBreakdown.map((entry: any, idx: number) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Row: Overdue Tasks & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overdue tasks list */}
        <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] shadow-sm space-y-3">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Overdue Tasks</span>
            </span>
            <span className="font-mono text-rose-500 text-xs font-bold">{overdueTasks.length} total</span>
          </h3>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {overdueTasks.length ? (
              overdueTasks.map((t: any) => (
                <div
                  key={t.id}
                  onClick={() => setActiveTaskId(t.id)}
                  className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-rose-500/20 hover:border-rose-500 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-mono text-rose-500 font-bold text-xs">{t.key}</span>
                    <span className="text-[var(--text-primary)] font-medium truncate">{t.title}</span>
                  </div>
                  <span className="text-xs text-rose-500 font-mono shrink-0">
                    {new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-[var(--text-muted)]">🎉 No overdue tasks!</div>
            )}
          </div>
        </div>

        {/* Recent Activity Audit Feed */}
        <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] shadow-sm space-y-3">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            <span>Audit & Activity Stream</span>
          </h3>

          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {recentActivity.map((log: any) => (
              <div key={log.id} className="flex items-start gap-2.5 py-1 text-[var(--text-secondary)]">
                <Avatar name={log.user?.name} avatarUrl={log.user?.avatarUrl} size="xs" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-[var(--text-primary)] mr-1">{log.user?.name || 'User'}:</span>
                  <span className="text-[var(--text-secondary)]">{log.action}</span>
                  {log.task && (
                    <span
                      onClick={() => setActiveTaskId(log.task.id)}
                      className="ml-1 font-mono text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-bold"
                    >
                      ({log.task.key})
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--text-muted)] shrink-0 font-mono">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
