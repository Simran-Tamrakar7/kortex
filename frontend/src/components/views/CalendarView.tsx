import React, { useState } from 'react';
import { Task } from '@kortex/shared';
import { useAppStore } from '../../store/useAppStore';
import { IssueTypeBadge } from '../common/IssueTypeBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface Props {
  tasks: Task[];
}

export const CalendarView: React.FC<Props> = ({ tasks }) => {
  const { setActiveTaskId, setCreateTaskOpen } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate days in month
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const getTasksForDay = (day: number) => {
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const totalGridCells = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-canvas)] select-none text-xs transition-colors">
      {/* Calendar Toolbar */}
      <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] flex items-center justify-between text-xs bg-[var(--bg-sidebar)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5 border border-[var(--border-default)]">
            <button
              onClick={prevMonth}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={goToday}
              className="px-2.5 py-0.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="font-bold text-sm text-[var(--text-primary)]">
            {monthNames[month]} {year}
          </span>
        </div>

        <button
          onClick={() => setCreateTaskOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Event / Task</span>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-bold text-[10px] uppercase text-center py-2">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar Month Grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto divide-x divide-y divide-[var(--border-subtle)] bg-[var(--bg-canvas)]">
        {Array.from({ length: totalGridCells }).map((_, idx) => {
          const dayNumber = idx - startingDayOfWeek + 1;
          const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
          const isToday =
            isCurrentMonth &&
            dayNumber === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear();

          const dayTasks = isCurrentMonth ? getTasksForDay(dayNumber) : [];

          return (
            <div
              key={idx}
              className={`p-2 min-h-[90px] flex flex-col justify-between transition-colors ${
                !isCurrentMonth
                  ? 'bg-[var(--bg-sidebar)]/30 opacity-40'
                  : 'hover:bg-[var(--bg-hover)]/60'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    isToday
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isCurrentMonth
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {isCurrentMonth ? dayNumber : ''}
                </span>

                {isCurrentMonth && (
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {dayTasks.length > 0 ? `${dayTasks.length} tasks` : ''}
                  </span>
                )}
              </div>

              {/* Tasks for this day */}
              <div className="space-y-1 mt-1 overflow-y-auto max-h-[80px]">
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setActiveTaskId(t.id)}
                    className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-indigo-400 cursor-pointer text-[11px] truncate flex items-center gap-1 shadow-sm"
                  >
                    <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{t.key}</span>
                    <span className="truncate font-medium text-[var(--text-primary)]">{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
