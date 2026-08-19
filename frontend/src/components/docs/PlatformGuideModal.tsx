import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  BookOpen,
  X,
  Search,
  Layers,
  Columns3,
  List,
  BarChart2,
  Calendar,
  Users,
  GitFork,
  Table as TableIcon,
  Zap,
  Clock,
  Shield,
  FileText,
  Command,
  Sun,
  Type,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const PlatformGuideModal: React.FC = () => {
  const { isGuideOpen, setGuideOpen, setCreateTaskOpen, setCommandPaletteOpen, toggleTheme } = useAppStore();
  const [activeTopic, setActiveTopic] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isGuideOpen) return null;

  const topics = [
    { id: 'overview', title: '1. Platform Overview & Hierarchy', icon: <Layers className="w-4 h-4 text-indigo-500" /> },
    { id: 'views', title: '2. The 8 Switchable Views', icon: <Columns3 className="w-4 h-4 text-blue-500" /> },
    { id: 'scrum', title: '3. Agile, Scrum & Sprints', icon: <Zap className="w-4 h-4 text-amber-500" /> },
    { id: 'sla', title: '4. Service Desk & SLA Engine', icon: <Shield className="w-4 h-4 text-rose-500" /> },
    { id: 'automations', title: '5. Workflow Automations', icon: <Sparkles className="w-4 h-4 text-purple-500" /> },
    { id: 'realtime', title: '6. Live WebSockets & Presence', icon: <Users className="w-4 h-4 text-emerald-500" /> },
    { id: 'timetracking', title: '7. Time Tracking & Timesheets', icon: <Clock className="w-4 h-4 text-cyan-500" /> },
    { id: 'shortcuts', title: '8. Command Palette & Shortcuts', icon: <Command className="w-4 h-4 text-slate-400" /> },
    { id: 'typography', title: '9. Themes & Typography Customizer', icon: <Type className="w-4 h-4 text-indigo-400" /> },
  ];

  const filteredTopics = topics.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-4xl h-[88vh] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="h-14 px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Kortex Documentation & User Guide</h3>
              <p className="text-[11px] text-[var(--text-secondary)]">Complete platform manual, shortcuts, and architecture guide</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setGuideOpen(false)}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Menu */}
          <div className="w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex flex-col p-3 space-y-3 shrink-0">
            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search guide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-indigo-500"
              />
            </div>

            {/* Chapters list */}
            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredTopics.map((topic) => {
                const isActive = activeTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setActiveTopic(topic.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    {topic.icon}
                    <span className="truncate">{topic.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick action card */}
            <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5 text-xs">
              <span className="font-bold text-[var(--text-primary)]">Need quick help?</span>
              <p className="text-[11px] text-[var(--text-secondary)]">Press <kbd className="font-mono bg-[var(--bg-input)] px-1 rounded border border-[var(--border-default)]">⌘K</kbd> to search anywhere.</p>
            </div>
          </div>

          {/* Right Reader Canvas */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 text-xs leading-relaxed text-[var(--text-secondary)]">
            {/* Topic 1: Overview */}
            {activeTopic === 'overview' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 font-mono">Chapter 1</span>
                  <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Platform Overview & Hierarchy</h2>
                </div>

                <p>
                  <strong>Kortex</strong> combines the deep engineering rigor of <strong>Jira</strong> (Scrum, Kanban, Sprints, Backlogs, Story Points, Velocity, Burndown Charts, and Custom Workflows) with the flexible multi-view hierarchy of <strong>ClickUp</strong> (Spaces, Folders, Custom Fields, Docs, Automations, and Real-Time Presence).
                </p>

                <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-3">
                  <h4 className="font-bold text-[var(--text-primary)] text-sm">Hierarchy Tree Architecture:</h4>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-indigo-500 shrink-0">1. Organization:</span>
                      <span>Top-level tenant (`Acme Global Innovations`) holding multi-workspace billing, users, roles, and global API tokens.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-indigo-500 shrink-0">2. Spaces (Workspaces):</span>
                      <span>High-level functional divisions (e.g. `Engineering & Product`, `Operations & IT Support`).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-indigo-500 shrink-0">3. Folders:</span>
                      <span>Optional groupings inside spaces (e.g. `Platform Core`, `Growth & Marketing`).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-indigo-500 shrink-0">4. Projects / Lists:</span>
                      <span>Agile software scrum boards (`KOR`), continuous Kanban boards, or IT Service Desks (`ITS`).</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Topic 2: 8 Views */}
            {activeTopic === 'views' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 font-mono">Chapter 2</span>
                  <h2 className="text-xl font-extrabold text-[var(--text-primary)]">The 8 Switchable Project Views</h2>
                </div>

                <p>Every project in Kortex can be viewed through 8 switchable perspectives:</p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1">
                    <h5 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <List className="w-3.5 h-3.5 text-blue-500" /> List View
                    </h5>
                    <p className="text-[11px]">Group by Status, Assignee, or Priority with fast inline task addition and bulk checkboxes.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1">
                    <h5 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Columns3 className="w-3.5 h-3.5 text-indigo-500" /> Kanban Board
                    </h5>
                    <p className="text-[11px]">Drag-and-drop card columns with swimlanes (Assignee/Epic/Priority) and WIP limits.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1">
                    <h5 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" /> Sprint Backlog
                    </h5>
                    <p className="text-[11px]">Jira-style grooming container with active sprint, planned sprints, story point rollups, and rollover.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1">
                    <h5 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-rose-500 rotate-90" /> Timeline / Gantt
                    </h5>
                    <p className="text-[11px]">Interactive SVG timeline bars, drag-to-reschedule, dependency link bezier curves, and Critical Path.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1">
                    <h5 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Calendar Schedule
                    </h5>
                    <p className="text-[11px]">Month & Week scheduling grid with due date task mapping and quick-scheduling.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1">
                    <h5 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-500" /> Workload Capacity
                    </h5>
                    <p className="text-[11px]">Team capacity utilization matrix against a 40h standard baseline with over-allocation warnings.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1">
                    <h5 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <GitFork className="w-3.5 h-3.5 text-purple-500" /> Mind Map Visualizer
                    </h5>
                    <p className="text-[11px]">Radial/tree hierarchy node graph breaking down Project $\rightarrow$ Epics $\rightarrow$ Stories $\rightarrow$ Tasks.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1">
                    <h5 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <TableIcon className="w-3.5 h-3.5 text-teal-500" /> Spreadsheet Table
                    </h5>
                    <p className="text-[11px]">Dense formula spreadsheet view with inline editing, days remaining calculation, and point rollups.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Topic 3: Scrum */}
            {activeTopic === 'scrum' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 font-mono">Chapter 3</span>
                  <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Agile, Scrum & Sprints</h2>
                </div>

                <p>
                  Kortex includes a complete Scrum lifecycle engine matching industry best practices:
                </p>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2">
                    <h4 className="font-bold text-[var(--text-primary)]">1. Sprint Lifecycle & Rollover</h4>
                    <p className="text-xs">
                      Create planning sprints with goals and start dates. When completing a sprint, uncompleted issues can be rolled over to the next active sprint or returned to the backlog.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2">
                    <h4 className="font-bold text-[var(--text-primary)]">2. Burndown & Velocity Charts</h4>
                    <p className="text-xs">
                      Click <strong>Burndown Report</strong> on any active or completed sprint to inspect the ideal vs actual remaining story point curve rendered with Recharts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Topic 4: SLA */}
            {activeTopic === 'sla' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 font-mono">Chapter 4</span>
                  <h2 className="text-xl font-extrabold text-[var(--text-primary)]">IT Service Desk & SLA Engine</h2>
                </div>

                <p>
                  For IT Service Desk projects (`ITS`), Kortex calculates first response and resolution time targets.
                </p>

                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2">
                  <h4 className="font-bold text-[var(--text-primary)]">Automated Breach Detection:</h4>
                  <p className="text-xs">
                    If an urgent ticket is not resolved within the target SLA threshold, a pulsing red <span className="text-rose-500 font-bold">SLA Breached</span> badge is highlighted on the board, list, and task detail drawer.
                  </p>
                </div>
              </div>
            )}

            {/* Topic 5: Automations */}
            {activeTopic === 'automations' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 font-mono">Chapter 5</span>
                  <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Workflow Automation Engine</h2>
                </div>

                <p>
                  Automate repetitive status changes, notifications, and bot comments using a visual <strong>Trigger $\rightarrow$ Condition $\rightarrow$ Action</strong> pipeline.
                </p>

                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2 font-mono text-xs">
                  <div className="text-purple-400 font-bold">WHEN: STATUS_CHANGED (to 'Done')</div>
                  <div className="text-amber-400 font-bold">IF: Priority == 'HIGH'</div>
                  <div className="text-emerald-400 font-bold">THEN: POST_COMMENT ("🎉 High priority issue resolved!")</div>
                </div>
              </div>
            )}

            {/* Topic 6: Realtime */}
            {activeTopic === 'realtime' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 font-mono">Chapter 6</span>
                  <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Live WebSockets & Presence</h2>
                </div>

                <p>
                  Every card move, comment, checklist toggle, and status change is broadcast via <strong>Socket.io</strong>.
                </p>

                <ul className="list-disc list-inside space-y-1.5 text-xs">
                  <li><strong>Presence Badges</strong>: Live pulsing green indicators show which teammates are active.</li>
                  <li><strong>Typing Indicators</strong>: See who is drafting comments in real time.</li>
                  <li><strong>Threaded Discussions</strong>: Comment replies with emoji reactions (`🔥`, `🚀`, `👍`, `❤️`).</li>
                </ul>
              </div>
            )}

            {/* Topic 7: Time Tracking */}
            {activeTopic === 'timetracking' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500 font-mono">Chapter 7</span>
                  <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Time Tracking & Timesheets</h2>
                </div>

                <p>
                  Track developer effort and billable client hours with both a live floating stopwatch and manual work logs.
                </p>

                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2">
                  <h4 className="font-bold text-[var(--text-primary)]">How to Track Time:</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Click <strong>Track Time</strong> on any task drawer to launch the live stopwatch timer in the top header.</li>
                    <li>Click <strong>Timesheet & Logs</strong> in the sidebar to view total hours and billable logs.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Topic 8: Shortcuts */}
            {activeTopic === 'shortcuts' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Chapter 8</span>
                  <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Command Palette & Keyboard Shortcuts</h2>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[var(--text-primary)]">Open Command Palette & Global Search</span>
                      <p className="text-[11px] text-[var(--text-secondary)]">Search tasks, docs, projects, or trigger quick actions</p>
                    </div>
                    <kbd className="font-mono text-xs bg-[var(--bg-input)] px-2 py-1 rounded border border-[var(--border-default)] font-bold text-[var(--text-primary)]">
                      ⌘K / Ctrl+K
                    </kbd>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[var(--text-primary)]">Quick Create Issue</span>
                      <p className="text-[11px] text-[var(--text-secondary)]">Instant issue creation dialog</p>
                    </div>
                    <kbd className="font-mono text-xs bg-[var(--bg-input)] px-2 py-1 rounded border border-[var(--border-default)] font-bold text-[var(--text-primary)]">
                      C
                    </kbd>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[var(--text-primary)]">Close Open Modal / Drawer</span>
                      <p className="text-[11px] text-[var(--text-secondary)]">Dismiss active dialog</p>
                    </div>
                    <kbd className="font-mono text-xs bg-[var(--bg-input)] px-2 py-1 rounded border border-[var(--border-default)] font-bold text-[var(--text-primary)]">
                      Esc
                    </kbd>
                  </div>
                </div>
              </div>
            )}

            {/* Topic 9: Typography & Themes */}
            {activeTopic === 'typography' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">Chapter 9</span>
                  <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Themes & Typography Customization</h2>
                </div>

                <p>
                  Customize the visual identity, readability, and density of Kortex to fit your personal workflow:
                </p>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2">
                    <h4 className="font-bold text-[var(--text-primary)]">1. Instant Header Typography Flyout (`T` Icon)</h4>
                    <p className="text-xs">
                      Click the <strong>`T`</strong> icon in the top navigation to instantly switch between 6 Google font families (Inter, Plus Jakarta Sans, Outfit, Roboto, JetBrains Mono, Fira Code) and adjust base pixel sizes (11px to 20px).
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2">
                    <h4 className="font-bold text-[var(--text-primary)]">2. Light & Dark Themes</h4>
                    <p className="text-xs">
                      Toggle the Sun/Moon icon for instant high-contrast daytime mode or midnight Linear dark mode.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
