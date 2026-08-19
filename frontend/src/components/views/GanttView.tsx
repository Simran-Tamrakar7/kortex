import React, { useState } from 'react';
import { Task } from '@kortex/shared';
import { useAppStore } from '../../store/useAppStore';
import { useUpdateTaskMutation } from '../../api/queries';
import { IssueTypeBadge } from '../common/IssueTypeBadge';
import { Avatar } from '../common/Avatar';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';

interface Props {
  tasks: Task[];
}

export const GanttView: React.FC<Props> = ({ tasks }) => {
  const { setActiveTaskId } = useAppStore();
  const updateTaskMutation = useUpdateTaskMutation();

  const [zoomMode, setZoomMode] = useState<'days' | 'weeks' | 'months'>('days');
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [currentOffsetDays, setCurrentOffsetDays] = useState(0);

  // Determine date bounds
  const now = new Date();
  const baseStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + currentOffsetDays * 24 * 60 * 60 * 1000);
  const totalDays = zoomMode === 'days' ? 21 : zoomMode === 'weeks' ? 42 : 90;
  const dayWidth = zoomMode === 'days' ? 48 : zoomMode === 'weeks' ? 28 : 14;

  const daysArray = Array.from({ length: totalDays }).map((_, i) => {
    return new Date(baseStartDate.getTime() + i * 24 * 60 * 60 * 1000);
  });

  const getTaskBarCoords = (task: Task) => {
    const start = task.startDate ? new Date(task.startDate) : new Date(task.createdAt);
    const due = task.dueDate ? new Date(task.dueDate) : new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);

    const diffStartMs = start.getTime() - baseStartDate.getTime();
    const diffDaysStart = diffStartMs / (1000 * 60 * 60 * 24);

    const durationDays = Math.max(1, (due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const x = Math.max(0, diffDaysStart * dayWidth);
    const width = Math.max(30, durationDays * dayWidth);

    return { x, width, start, due };
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-canvas)] select-none text-xs transition-colors">
      {/* Mobile/Narrow Screen Helper Banner */}
      <div className="md:hidden px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium flex items-center justify-between">
        <span>💡 Swipe horizontally to scroll timeline bars & dependencies</span>
      </div>

      {/* Gantt Top Toolbar */}
      <div className="px-4 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between text-xs bg-[var(--bg-sidebar)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5 border border-[var(--border-default)]">
            <button
              onClick={() => setCurrentOffsetDays((d) => d - 7)}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded"
              title="Previous Range"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentOffsetDays(0)}
              className="px-2 py-0.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentOffsetDays((d) => d + 7)}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded"
              title="Next Range"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom switcher */}
          <div className="flex items-center gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5 border border-[var(--border-default)]">
            <button
              onClick={() => setZoomMode('days')}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                zoomMode === 'days' ? 'bg-indigo-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Days
            </button>
            <button
              onClick={() => setZoomMode('weeks')}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                zoomMode === 'weeks' ? 'bg-indigo-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Weeks
            </button>
            <button
              onClick={() => setZoomMode('months')}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                zoomMode === 'months' ? 'bg-indigo-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Months
            </button>
          </div>

          {/* Critical Path Toggle */}
          <button
            onClick={() => setShowCriticalPath(!showCriticalPath)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
              showCriticalPath
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                : 'bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-secondary)]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Critical Path</span>
          </button>
        </div>
      </div>

      {/* Main Gantt Split: Left Task Tree List, Right SVG Timeline Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Task Labels Column */}
        <div className="w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-col shrink-0">
          <div className="h-10 px-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-center font-bold text-[var(--text-secondary)] text-[10px] uppercase tracking-wider">
            Task Name ({tasks.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setActiveTaskId(task.id)}
                className="h-10 px-3 flex items-center justify-between hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <IssueTypeBadge type={task.issueType} showLabel={false} />
                  <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{task.key}</span>
                  <span className="truncate text-xs font-medium text-[var(--text-primary)]">{task.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Scrollable Timeline Canvas */}
        <div className="flex-1 overflow-x-auto overflow-y-auto relative bg-[var(--bg-canvas)]">
          <div style={{ width: `${totalDays * dayWidth}px` }} className="relative min-h-full">
            {/* Timeline Header Days Bar */}
            <div className="h-10 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex sticky top-0 z-10">
              {daysArray.map((date, idx) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <div
                    key={idx}
                    style={{ width: `${dayWidth}px` }}
                    className={`h-full border-r border-[var(--border-subtle)] flex flex-col items-center justify-center text-[10px] shrink-0 ${
                      isToday
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                        : isWeekend
                        ? 'bg-[var(--bg-sidebar)]/50 text-[var(--text-muted)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="font-bold">{date.getDate()}</span>
                    <span className="text-[9px] uppercase">{date.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                  </div>
                );
              })}
            </div>

            {/* Timeline Grid Rows with Task Bars */}
            <div className="relative">
              {tasks.map((task, idx) => {
                const { x, width } = getTaskBarCoords(task);
                const isUrgent = task.priority === 'URGENT';
                const isDone = task.status?.category === 'DONE';

                return (
                  <div
                    key={task.id}
                    className="h-10 border-b border-[var(--border-subtle)] relative flex items-center hover:bg-[var(--bg-hover)] transition-colors group"
                  >
                    {/* Background day column grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {daysArray.map((_, dIdx) => (
                        <div
                          key={dIdx}
                          style={{ width: `${dayWidth}px` }}
                          className="h-full border-r border-[var(--border-subtle)]/40 shrink-0"
                        />
                      ))}
                    </div>

                    {/* Draggable/Interactive Task Bar */}
                    <div
                      onClick={() => setActiveTaskId(task.id)}
                      style={{ transform: `translateX(${x}px)`, width: `${width}px` }}
                      className={`absolute h-6 rounded-lg px-2 flex items-center justify-between text-[11px] font-semibold cursor-pointer shadow-sm hover:shadow-md transition-all z-0 ${
                        isDone
                          ? 'bg-emerald-500/90 text-white'
                          : isUrgent && showCriticalPath
                          ? 'bg-rose-500 text-white ring-2 ring-rose-400'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      <span className="truncate">{task.title}</span>
                      <span className="text-[9px] font-mono opacity-80">{task.key}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
