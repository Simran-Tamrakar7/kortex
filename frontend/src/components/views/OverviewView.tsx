import React, { useState } from 'react';
import { Task, Sprint } from '@kortex/shared';
import { useAppStore } from '../../store/useAppStore';
import { useProject, useSprints, useDocs, useSprintReport } from '../../api/queries';
import { Avatar } from '../common/Avatar';
import {
  Sparkles,
  Layers,
  FileText,
  Bookmark,
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  BarChart3,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Clock,
  Zap,
  MoreHorizontal,
  Bot,
  Share2,
  FolderGit2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface Props {
  tasks: Task[];
}

export const OverviewView: React.FC<Props> = ({ tasks }) => {
  const {
    activeProjectId,
    setActiveView,
    setActiveTaskId,
    setSprintModalOpen,
    setActiveMainSection,
    setAutomationsOpen,
  } = useAppStore();

  const { data: project } = useProject(activeProjectId);
  const { data: sprints = [] } = useSprints(activeProjectId);
  const { data: docs = [] } = useDocs(undefined, activeProjectId);

  const activeSprint = sprints.find((s) => s.status === 'ACTIVE') || sprints[0];
  const { data: reportData } = useSprintReport(activeSprint?.id || null);

  const [bookmarks, setBookmarks] = useState([
    { id: 'b_1', title: 'Live Production App', url: 'https://kortexpm.vercel.app', icon: '🚀' },
    { id: 'b_2', title: 'GitHub Repository', url: 'https://github.com', icon: '🐙' },
    { id: 'b_3', title: 'API Documentation & Endpoints', url: 'http://localhost:4000/api', icon: '🔌' },
  ]);
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [newBookmarkUrl, setNewBookmarkUrl] = useState('');
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookmarkTitle.trim() || !newBookmarkUrl.trim()) return;
    setBookmarks((prev) => [
      ...prev,
      { id: `b_${Date.now()}`, title: newBookmarkTitle.trim(), url: newBookmarkUrl.trim(), icon: '🔗' },
    ]);
    setNewBookmarkTitle('');
    setNewBookmarkUrl('');
    setIsAddingBookmark(false);
  };

  // Group tasks by sprint
  const sprintStats = sprints.map((sprint) => {
    const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
    const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedTasks = sprintTasks.filter((t) => t.status?.category === 'DONE');
    const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const percent = sprintTasks.length ? Math.round((completedTasks.length / sprintTasks.length) * 100) : 0;

    return {
      sprint,
      taskCount: sprintTasks.length,
      completedCount: completedTasks.length,
      totalPoints,
      completedPoints,
      percent,
    };
  });

  const backlogTasks = tasks.filter((t) => !t.sprintId);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none bg-[var(--bg-canvas)] transition-colors">
      {/* Top Banner & Quick Hub Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium mb-1">
            <span>Product Development</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Kortex Platform</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[var(--text-primary)] font-bold">{project?.name || 'Kortex'} ({project?.key || 'DEV'})</span>
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span>{project?.name || 'Kortex Platform'} Hub & Sprints Overview</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
              ClickUp 3.0 + Jira Engine
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutomationsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] shadow-sm transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-purple-500" />
            <span>Automate</span>
          </button>
          <button
            onClick={() => setSprintModalOpen(true, { mode: 'create', sprint: null })}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sprint</span>
          </button>
        </div>
      </div>

      {/* 3 Top Cards: Recent Sprints, Docs & Wiki, Bookmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Recent Sprints & Activity */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Sprint Milestones ({sprints.length})</span>
            </span>
            <button
              onClick={() => setActiveView('BACKLOG')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-0.5"
            >
              <span>View Backlog</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-44 pr-1">
            {sprints.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveView('BOARD')}
                className="w-full text-left p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-xs">{s.status === 'ACTIVE' ? '🚀' : s.status === 'COMPLETED' ? '✅' : '📋'}</span>
                  <div className="truncate">
                    <p className="font-bold text-xs text-[var(--text-primary)] truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {s.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{s.goal || 'No goal set'}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${
                    s.status === 'ACTIVE'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : s.status === 'COMPLETED'
                      ? 'bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)]'
                      : 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  }`}
                >
                  {s.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Card 2: Docs & Wiki Quick Access */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Project Docs & Wiki ({docs.length})</span>
            </span>
            <button
              onClick={() => setActiveMainSection('DOCS')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-0.5"
            >
              <span>Open Docs</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-44 pr-1">
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setActiveMainSection('DOCS')}
                className="w-full text-left p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-xs">📝</span>
                  <div className="truncate">
                    <p className="font-bold text-xs text-[var(--text-primary)] truncate group-hover:text-amber-500">
                      {doc.title}
                    </p>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      Updated {new Date(doc.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-amber-500 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Card 3: Bookmarks & Links */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-emerald-500" />
              <span>Project Bookmarks ({bookmarks.length})</span>
            </span>
            <button
              onClick={() => setIsAddingBookmark(!isAddingBookmark)}
              className="p-1 hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg"
              title="Add Bookmark"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAddingBookmark ? (
            <form onSubmit={handleAddBookmark} className="space-y-2 p-2 bg-[var(--bg-elevated)] rounded-xl border border-indigo-500/40">
              <input
                type="text"
                required
                placeholder="Bookmark Title (e.g. Design Specs)"
                value={newBookmarkTitle}
                onChange={(e) => setNewBookmarkTitle(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-primary)] outline-none"
              />
              <input
                type="url"
                required
                placeholder="https://..."
                value={newBookmarkUrl}
                onChange={(e) => setNewBookmarkUrl(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-primary)] outline-none"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingBookmark(false)}
                  className="px-2 py-0.5 text-xs text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                >
                  Add
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto max-h-44 pr-1">
              {bookmarks.map((bm) => (
                <a
                  key={bm.id}
                  href={bm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] flex items-center justify-between transition-colors group text-xs text-[var(--text-primary)]"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span>{bm.icon}</span>
                    <span className="font-semibold truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {bm.title}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-indigo-500 shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ClickUp 3.0 Sprints Progress Matrix Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-[var(--bg-elevated)]/60 border-b border-[var(--border-subtle)] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-xs text-[var(--text-primary)]">Sprints Progress & Velocity Matrix</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
            <span>Total Tracked Tasks: {tasks.length}</span>
            <span>•</span>
            <span>Total Points: {tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)} pts</span>
          </div>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] font-bold uppercase text-xs tracking-wider border-b border-[var(--border-subtle)]">
              <tr>
                <th className="p-3.5">Sprint Name</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 min-w-[200px]">Progress & Resolution</th>
                <th className="p-3.5">Story Points</th>
                <th className="p-3.5">Start Date</th>
                <th className="p-3.5">End Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {sprintStats.map(({ sprint, taskCount, completedCount, totalPoints, completedPoints, percent }) => (
                <tr key={sprint.id} className="hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors">
                  {/* Name */}
                  <td className="p-3.5 font-bold">
                    <div className="flex items-center gap-2">
                      <span>{sprint.status === 'ACTIVE' ? '🚀' : sprint.status === 'COMPLETED' ? '✅' : '📋'}</span>
                      <div>
                        <span className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer" onClick={() => setActiveView('BACKLOG')}>
                          {sprint.name}
                        </span>
                        {sprint.goal && <p className="text-xs text-[var(--text-muted)] font-normal truncate max-w-xs">{sprint.goal}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="p-3.5">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        sprint.status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          : sprint.status === 'COMPLETED'
                          ? 'bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)]'
                          : 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                      }`}
                    >
                      {sprint.status}
                    </span>
                  </td>

                  {/* Animated Progress Bar */}
                  <td className="p-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-[var(--text-primary)]">
                          {completedCount}/{taskCount} tasks ({percent}%)
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          {completedPoints}/{totalPoints} pts
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--bg-input)] overflow-hidden border border-[var(--border-subtle)]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percent === 100
                              ? 'bg-emerald-500'
                              : percent > 50
                              ? 'bg-indigo-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Points */}
                  <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {totalPoints} pts
                  </td>

                  {/* Dates */}
                  <td className="p-3.5 text-[var(--text-secondary)] font-mono text-xs">
                    {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '-'}
                  </td>
                  <td className="p-3.5 text-[var(--text-secondary)] font-mono text-xs">
                    {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Active'}
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setActiveView('BACKLOG')}
                      className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Groom Sprint
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid: Current Sprint Burndown Curve & Team Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Current Sprint Burndown Curve */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <div>
                <h4 className="font-bold text-xs text-[var(--text-primary)]">
                  Live Sprint Burndown ({activeSprint?.name})
                </h4>
                <p className="text-xs text-[var(--text-muted)]">Ideal Story Point Burndown vs Actual Remaining</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Sprint On Track
            </span>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData?.burndown || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ideal"
                  name="Ideal Guideline"
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Remaining"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Resources & Story Allocation */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <div>
                <h4 className="font-bold text-xs text-[var(--text-primary)]">Team Capacity & Allocation</h4>
                <p className="text-xs text-[var(--text-muted)]">Workload balance across product engineers</p>
              </div>
            </div>
            <button
              onClick={() => setActiveView('WORKLOAD')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-0.5"
            >
              <span>Workload Matrix</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { name: 'Alex Rivera', role: 'Product Lead', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', points: 18, tasks: 5, load: 'Optimal (85%)' },
              { name: 'Jordan Smith', role: 'Frontend Architect', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', points: 15, tasks: 4, load: 'Optimal (75%)' },
              { name: 'Maya Lin', role: 'Fullstack Dev', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', points: 12, tasks: 3, load: 'Available (60%)' },
              { name: 'Devon Vance', role: 'DevOps Lead', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', points: 8, tasks: 2, load: 'Available (40%)' },
            ].map((member) => (
              <div key={member.name} className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Avatar name={member.name} avatarUrl={member.avatar} size="sm" />
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">{member.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{member.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{member.points} pts</span>
                    <p className="text-xs text-[var(--text-muted)]">{member.tasks} issues</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    {member.load}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
