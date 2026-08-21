import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTimeEntries, useTasks } from '../../api/queries';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '../common/Avatar';
import {
  Clock,
  Plus,
  Trash2,
  X,
  Calendar,
  DollarSign,
  Briefcase,
  FileSpreadsheet,
} from 'lucide-react';

export const TimeTrackingModal: React.FC = () => {
  const { isTimeModalOpen, setTimeModalOpen, activeProjectId } = useAppStore();
  const queryClient = useQueryClient();

  const { data: timeData, isLoading } = useTimeEntries(activeProjectId || undefined);
  const { data: tasks = [] } = useTasks(activeProjectId);

  const [isAddingTime, setIsAddingTime] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [durationHours, setDurationHours] = useState('1');
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(true);

  if (!isTimeModalOpen) return null;

  const rawTimeData: any = timeData;
  const entries: any[] = Array.isArray(rawTimeData) ? rawTimeData : rawTimeData?.entries || [];
  const totalMinutes = entries.reduce((acc: number, e: any) => acc + (e.durationMinutes || 0), 0);
  const billableMinutes = entries.filter((e: any) => e.billable).reduce((acc: number, e: any) => acc + (e.durationMinutes || 0), 0);
  const summary = rawTimeData?.summary || {
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    billableHours: Math.round((billableMinutes / 60) * 10) / 10,
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !durationHours) return;

    try {
      await apiClient.post('/time-entries', {
        taskId: selectedTaskId,
        durationMinutes: Math.round(Number(durationHours) * 60),
        description,
        billable: isBillable,
      });

      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });

      setIsAddingTime(false);
      setDescription('');
      setSelectedTaskId('');
    } catch (e) {
      alert('Failed to log time');
    }
  };

  const handleDeleteTime = async (id: string) => {
    if (confirm('Delete this time entry?')) {
      await apiClient.delete(`/time-entries/${id}`);
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', activeProjectId] });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-3xl bg-[#0e1626] border border-[#233352] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Timesheet & Work Logs</h3>
              <p className="text-slate-400 text-xs">Track billable client hours and developer effort</p>
            </div>
          </div>
          <button
            onClick={() => setTimeModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-[#131d31] rounded-xl border border-[#202e48]">
            <span className="text-xs text-slate-400">Total Hours Logged</span>
            <p className="text-xl font-bold font-mono text-slate-100 mt-0.5">{summary.totalHours} hrs</p>
          </div>

          <div className="p-3 bg-[#131d31] rounded-xl border border-[#202e48]">
            <span className="text-xs text-slate-400">Billable Hours</span>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{summary.billableHours} hrs</p>
          </div>

          <div className="p-3 bg-[#131d31] rounded-xl border border-[#202e48] flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Log Action</span>
              <p className="text-xs text-slate-300 mt-0.5">Add work effort</p>
            </div>
            <button
              onClick={() => setIsAddingTime(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow"
            >
              + Log Time
            </button>
          </div>
        </div>

        {/* Add Time Form Modal */}
        {isAddingTime && (
          <form onSubmit={handleLogTime} className="p-4 bg-[#131d31] rounded-xl border border-indigo-500/50 space-y-3 text-xs">
            <h4 className="font-semibold text-slate-200">Manual Time Entry</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Select Task *</label>
                <select
                  required
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                >
                  <option value="">Choose task...</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.key}: {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Duration (Hours) *</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  required
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="billableCheck"
                  checked={isBillable}
                  onChange={(e) => setIsBillable(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                />
                <label htmlFor="billableCheck" className="text-slate-300 cursor-pointer">
                  Billable Hour
                </label>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Description / Notes</label>
              <input
                type="text"
                placeholder="What did you work on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingTime(false)}
                className="px-3 py-1 text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium"
              >
                Save Entry
              </button>
            </div>
          </form>
        )}

        {/* Entries Table */}
        <div className="flex-1 overflow-y-auto border border-[#202e48] rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#131d31] text-slate-400 font-semibold uppercase text-xs tracking-wider border-b border-[#202e48]">
              <tr>
                <th className="p-2.5">User</th>
                <th className="p-2.5">Task</th>
                <th className="p-2.5">Duration</th>
                <th className="p-2.5">Billable</th>
                <th className="p-2.5">Notes</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {entries.map((entry: any) => (
                <tr key={entry.id} className="hover:bg-[#131d31]/50 text-slate-200">
                  <td className="p-2.5">
                    <div className="flex items-center gap-2">
                      <Avatar name={entry.user?.name} avatarUrl={entry.user?.avatarUrl} size="xs" />
                      <span>{entry.user?.name}</span>
                    </div>
                  </td>
                  <td className="p-2.5">
                    <span className="font-mono text-indigo-400 font-semibold mr-1.5">{entry.task?.key}</span>
                    <span className="text-slate-300 truncate max-w-[160px] inline-block align-bottom">
                      {entry.task?.title}
                    </span>
                  </td>
                  <td className="p-2.5 font-mono font-semibold">
                    {Math.round((entry.durationMinutes / 60) * 10) / 10}h
                  </td>
                  <td className="p-2.5">
                    {entry.billable ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-xs">
                        Billable
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-xs">
                        Non-billable
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-400 truncate max-w-[200px]">{entry.description || '-'}</td>
                  <td className="p-2.5 text-slate-500 text-xs">
                    {new Date(entry.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-2.5 text-right">
                    <button
                      onClick={() => handleDeleteTime(entry.id)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
