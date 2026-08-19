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
    <div className="flex-1 flex flex-col overflow-hidden bg-[#090e18] select-none">
      {/* Gantt Top Toolbar */}
      <div className="px-4 py-2 border-b border-[#1e293b] flex items-center justify-between text-xs bg-[#0c121e]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#131d31] rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setCurrentOffsetDays((d) => d - 7)}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
              title="Previous Range"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentOffsetDays(0)}
              className="px-2 py-0.5 text-xs text-slate-300 hover:text-white"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentOffsetDays((d) => d + 7)}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
              title="Next Range"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom switcher */}
          <div className="flex items-center gap-1 bg-[#131d31] rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setZoomMode('days')}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                zoomMode === 'days' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Days
            </button>
            <button
              onClick={() => setZoomMode('weeks')}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                zoomMode === 'weeks' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Weeks
            </button>
            <button
              onClick={() => setZoomMode('months')}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                zoomMode === 'months' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Months
            </button>
          </div>

          {/* Critical Path Toggle */}
          <button
            onClick={() => setShowCriticalPath(!showCriticalPath)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
              showCriticalPath
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium'
                : 'bg-[#131d31] text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Critical Path</span>
          </button>
        </div>

        <div className="text-slate-400 font-medium">
          {daysArray[0]?.toLocaleDateString([], { month: 'short', day: 'numeric' })} -{' '}
          {daysArray[daysArray.length - 1]?.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Main Gantt Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Task list table */}
        <div className="w-72 border-r border-[#1e293b] bg-[#0c121e] overflow-y-auto shrink-0 divide-y divide-[#1e293b]/60">
          {/* Left Header */}
          <div className="h-10 px-3 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-[#101726]">
            <span>Task Title</span>
            <span>Key</span>
          </div>

          {/* Rows */}
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setActiveTaskId(task.id)}
              className="h-12 px-3 flex items-center justify-between hover:bg-[#152033] transition-colors cursor-pointer text-xs group"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <IssueTypeBadge type={task.issueType} showLabel={false} />
                <span className="text-slate-200 font-medium truncate group-hover:text-indigo-300">
                  {task.title}
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-400 shrink-0 font-medium">{task.key}</span>
            </div>
          ))}
        </div>

        {/* Right Canvas: Timeline & SVG Bars */}
        <div className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#090e18]">
          {/* Days Header */}
          <div className="h-10 flex border-b border-[#1e293b] bg-[#101726] sticky top-0 z-10">
            {daysArray.map((day, idx) => {
              const isToday = day.toDateString() === now.toDateString();
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <div
                  key={idx}
                  style={{ width: `${dayWidth}px` }}
                  className={`shrink-0 border-r border-[#1e293b]/60 flex flex-col items-center justify-center text-[10px] ${
                    isToday ? 'bg-indigo-950/60 font-bold text-indigo-300' : isWeekend ? 'bg-slate-900/40 text-slate-500' : 'text-slate-400'
                  }`}
                >
                  <span>{day.toLocaleDateString([], { weekday: 'narrow' })}</span>
                  <span className="font-mono">{day.getDate()}</span>
                </div>
              );
            })}
          </div>

          {/* Grid Background & SVG Task Bars */}
          <div className="relative" style={{ width: `${totalDays * dayWidth}px`, height: `${tasks.length * 48}px` }}>
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {daysArray.map((day, idx) => {
                const isToday = day.toDateString() === now.toDateString();
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                return (
                  <div
                    key={idx}
                    style={{ width: `${dayWidth}px` }}
                    className={`shrink-0 h-full border-r border-[#1e293b]/40 ${
                      isToday ? 'bg-indigo-500/5' : isWeekend ? 'bg-slate-900/20' : ''
                    }`}
                  />
                );
              })}
            </div>

            {/* Render Task Bars */}
            {tasks.map((task, index) => {
              const { x, width, start, due } = getTaskBarCoords(task);
              const isDone = task.status?.category === 'DONE';
              const isCritical = showCriticalPath && (task.priority === 'URGENT' || (task.dependencies && task.dependencies.length > 0));

              return (
                <div
                  key={task.id}
                  style={{
                    top: `${index * 48 + 8}px`,
                    left: `${x}px`,
                    width: `${width}px`,
                    height: '32px',
                  }}
                  onClick={() => setActiveTaskId(task.id)}
                  className={`absolute rounded-lg p-1.5 flex items-center justify-between text-xs cursor-pointer shadow-md transition-all group select-none ${
                    isDone
                      ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-200'
                      : isCritical
                      ? 'bg-gradient-to-r from-amber-600/70 to-orange-600/70 border border-amber-400 text-white ring-1 ring-amber-400/40'
                      : 'bg-indigo-600/70 hover:bg-indigo-500 border border-indigo-400/50 text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono text-[10px] font-bold opacity-80">{task.key}</span>
                    <span className="font-medium truncate text-[11px]">{task.title}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {task.assignees?.slice(0, 1).map((u) => (
                      <Avatar key={u.id} name={u.name} avatarUrl={u.avatarUrl} size="xs" />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
