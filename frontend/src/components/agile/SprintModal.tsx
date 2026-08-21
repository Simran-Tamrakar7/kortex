import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useProject, useSprints } from '../../api/queries';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { X, Play, CheckCircle2, Plus } from 'lucide-react';

export const SprintModal: React.FC = () => {
  const { isSprintModalOpen, setSprintModalOpen, sprintModalData, activeProjectId } = useAppStore();
  const queryClient = useQueryClient();

  const { data: sprints = [] } = useSprints(activeProjectId);

  const mode = sprintModalData?.mode || 'create';
  const sprint = sprintModalData?.sprint;

  const [name, setName] = useState(sprint?.name || `Sprint ${sprints.length + 1}`);
  const [goal, setGoal] = useState(sprint?.goal || '');
  const [startDate, setStartDate] = useState(
    sprint?.startDate ? sprint.startDate.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    sprint?.endDate
      ? sprint.endDate.split('T')[0]
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [rolloverSprintId, setRolloverSprintId] = useState<string>('');

  if (!isSprintModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'create') {
        await apiClient.post('/sprints', {
          projectId: activeProjectId,
          name,
          goal,
          startDate,
          endDate,
        });
      } else if (mode === 'start') {
        await apiClient.put(`/sprints/${sprint.id}/start`, {
          startDate,
          endDate,
          goal,
        });
      } else if (mode === 'complete') {
        await apiClient.put(`/sprints/${sprint.id}/complete`, {
          rolloverTargetSprintId: rolloverSprintId || null,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['sprints', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', activeProjectId] });
      setSprintModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to process sprint action');
    }
  };

  const otherSprints = sprints.filter((s) => s.id !== sprint?.id && s.status !== 'COMPLETED');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-md bg-[#131b2a] border border-[#233352] rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {mode === 'complete' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : mode === 'start' ? (
              <Play className="w-4 h-4 text-indigo-400 fill-current" />
            ) : (
              <Plus className="w-4 h-4 text-indigo-400" />
            )}
            <h3 className="text-sm font-semibold text-slate-100">
              {mode === 'complete'
                ? `Complete ${sprint?.name}`
                : mode === 'start'
                ? `Start ${sprint?.name}`
                : 'Create Sprint'}
            </h3>
          </div>
          <button
            onClick={() => setSprintModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode !== 'complete' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Sprint Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Sprint Goal</label>
                <textarea
                  rows={2}
                  placeholder="What is the team committing to deliver in this sprint?"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">End Date (Duration)</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-[#101726] rounded-xl border border-slate-800 space-y-1">
                <p className="text-slate-200 font-medium">Sprint Summary</p>
                <p className="text-slate-400">
                  {sprint?.completedTaskCount || 0} completed tasks will be closed in this sprint report.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Move Incomplete Issues To:
                </label>
                <select
                  value={rolloverSprintId}
                  onChange={(e) => setRolloverSprintId(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
                >
                  <option value="">📦 Product Backlog</option>
                  {otherSprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      📋 {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setSprintModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 rounded-lg font-medium text-white shadow ${
                mode === 'complete'
                  ? 'bg-indigo-600 hover:bg-indigo-500'
                  : mode === 'start'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {mode === 'complete' ? 'Complete Sprint' : mode === 'start' ? 'Start Sprint' : 'Create Sprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
