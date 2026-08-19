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
    <div className="flex-1 flex flex-col overflow-hidden bg-[#090e18] select-none">
      {/* Calendar Toolbar */}
      <div className="px-4 py-2.5 border-b border-[#1e293b] flex items-center justify-between text-xs bg-[#0c121e]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#131d31] rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={prevMonth}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={goToday}
              className="px-2.5 py-0.5 text-xs text-slate-300 hover:text-white"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="font-semibold text-sm text-slate-200">
            {monthNames[month]} {year}
          </span>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[#1e293b] bg-[#101726] text-center py-2 text-xs font-semibold text-slate-400">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Calendar Days Grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto divide-x divide-y divide-[#1e293b]/60">
        {Array.from({ length: totalGridCells }).map((_, index) => {
          const dayNumber = index - startingDayOfWeek + 1;
          const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
          const isToday =
            isValidDay &&
            new Date().toDateString() === new Date(year, month, dayNumber).toDateString();
          const dayTasks = isValidDay ? getTasksForDay(dayNumber) : [];

          return (
            <div
              key={index}
              className={`p-2 min-h-[90px] flex flex-col justify-between transition-colors ${
                !isValidDay
                  ? 'bg-slate-950/40 text-slate-700'
                  : isToday
                  ? 'bg-indigo-950/20'
                  : 'bg-[#0f172a]/70 hover:bg-[#131d31]'
              }`}
            >
              {isValidDay && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center'
                          : 'text-slate-400'
                      }`}
                    >
                      {dayNumber}
                    </span>
                    <button
                      onClick={() =>
                        setCreateTaskOpen(true, {
                          /* defaults */
                        })
                      }
                      className="opacity-0 hover:opacity-100 p-0.5 hover:bg-slate-700 rounded text-slate-400"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setActiveTaskId(task.id)}
                        className="p-1 rounded bg-[#162238] border border-[#233555] hover:border-indigo-400 text-[11px] cursor-pointer shadow-sm truncate transition-colors"
                      >
                        <span className="font-mono text-[10px] text-indigo-400 mr-1 font-semibold">
                          {task.key}
                        </span>
                        <span className="text-slate-200">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
