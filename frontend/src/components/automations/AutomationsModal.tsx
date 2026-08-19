import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAutomations, useProject, useTasks } from '../../api/queries';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  Plus,
  Trash2,
  X,
  Play,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const AutomationsModal: React.FC = () => {
  const { isAutomationsOpen, setAutomationsOpen, activeProjectId } = useAppStore();
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useAutomations(activeProjectId);
  const { data: project } = useProject(activeProjectId);
  const { data: tasks = [] } = useTasks(activeProjectId);

  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [triggerType, setTriggerType] = useState('STATUS_CHANGED');
  const [toStatusId, setToStatusId] = useState('');
  const [conditionPriority, setConditionPriority] = useState('HIGH');
  const [actionType, setActionType] = useState('POST_COMMENT');
  const [actionMessage, setActionMessage] = useState('Automation executed!');
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isAutomationsOpen || !activeProjectId) return null;

  const statuses = project?.statuses || [];

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    try {
      await apiClient.post('/automations', {
        projectId: activeProjectId,
        name: ruleName.trim(),
        trigger: {
          type: triggerType,
          config: triggerType === 'STATUS_CHANGED' ? { toStatusId: toStatusId || statuses[0]?.id } : {},
        },
        conditions: [
          { field: 'priority', operator: 'EQUALS', value: conditionPriority },
        ],
        actions: [
          {
            type: actionType,
            config: { message: actionMessage },
          },
        ],
      });

      queryClient.invalidateQueries({ queryKey: ['automations', activeProjectId] });
      setIsCreatingRule(false);
      setRuleName('');
    } catch (e) {
      alert('Failed to create rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (confirm('Delete this automation rule?')) {
      await apiClient.delete(`/automations/${id}`);
      queryClient.invalidateQueries({ queryKey: ['automations', activeProjectId] });
    }
  };

  const handleToggleRule = async (rule: any) => {
    await apiClient.put(`/automations/${rule.id}`, { isEnabled: !rule.isEnabled });
    queryClient.invalidateQueries({ queryKey: ['automations', activeProjectId] });
  };

  const handleTestRule = async (ruleId: string) => {
    if (!tasks.length) {
      alert('No tasks available to test against');
      return;
    }
    try {
      const res = await apiClient.post(`/automations/${ruleId}/test`, {
        taskId: tasks[0].id,
      });
      setTestResult(`Success: ${res.data.message} on sample task ${tasks[0].key}`);
      setTimeout(() => setTestResult(null), 4000);
      queryClient.invalidateQueries({ queryKey: ['automations', activeProjectId] });
    } catch (e: any) {
      alert(e.response?.data?.error || 'Test run failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-3xl bg-[#0e1626] border border-[#233352] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Workflow Automation Engine</h3>
              <p className="text-slate-400 text-xs">
                Trigger automated status transitions, comments, and notifications
              </p>
            </div>
          </div>
          <button
            onClick={() => setAutomationsOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Test Result Toast */}
        {testResult && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{testResult}</span>
          </div>
        )}

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-slate-300">Active Rules ({rules.length})</span>
          <button
            onClick={() => setIsCreatingRule(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Automation Rule</span>
          </button>
        </div>

        {/* Rule Builder Form */}
        {isCreatingRule && (
          <form onSubmit={handleCreateRule} className="p-4 bg-[#131d31] rounded-xl border border-indigo-500/40 space-y-3 text-xs">
            <h4 className="font-semibold text-slate-100">Configure Rule</h4>

            <div>
              <label className="block text-slate-400 mb-1">Rule Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Alert Lead on Urgent Bugs"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Trigger */}
              <div>
                <label className="block text-slate-400 mb-1">When (Trigger)</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 outline-none"
                >
                  <option value="STATUS_CHANGED">Status Changed</option>
                  <option value="TASK_CREATED">Task Created</option>
                  <option value="PRIORITY_CHANGED">Priority Changed</option>
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-slate-400 mb-1">If (Condition)</label>
                <select
                  value={conditionPriority}
                  onChange={(e) => setConditionPriority(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 outline-none"
                >
                  <option value="URGENT">Priority = Urgent</option>
                  <option value="HIGH">Priority = High</option>
                  <option value="MEDIUM">Priority = Medium</option>
                </select>
              </div>

              {/* Action */}
              <div>
                <label className="block text-slate-400 mb-1">Then (Action)</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 outline-none"
                >
                  <option value="POST_COMMENT">Post Bot Comment</option>
                  <option value="SEND_NOTIFICATION">Send Notification</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Action Message</label>
              <input
                type="text"
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingRule(false)}
                className="px-3 py-1 text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium"
              >
                Save Rule
              </button>
            </div>
          </form>
        )}

        {/* Rules List */}
        <div className="flex-1 overflow-y-auto space-y-2.5">
          {rules.map((rule: any) => (
            <div
              key={rule.id}
              className="p-4 bg-[#131d31] rounded-xl border border-[#202e48] flex items-center justify-between text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100">{rule.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Triggered {rule.executionCount || 0} times
                  </span>
                </div>

                {/* Rule visual pipeline */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                    {rule.trigger?.type}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                    Priority == {rule.conditions?.[0]?.value || 'ANY'}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    {rule.actions?.[0]?.type}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestRule(rule.id)}
                  className="px-2.5 py-1 rounded bg-[#1a263d] hover:bg-[#223352] text-indigo-300 text-xs border border-indigo-500/30 flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Test Run</span>
                </button>

                <button
                  onClick={() => handleToggleRule(rule)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    rule.isEnabled
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {rule.isEnabled ? 'Active' : 'Disabled'}
                </button>

                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
