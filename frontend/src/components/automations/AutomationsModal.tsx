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
  Sliders,
  MessageSquare,
  Bell,
  RefreshCw,
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
  const [triggerStatusId, setTriggerStatusId] = useState('');
  const [conditionField, setConditionField] = useState('priority');
  const [conditionOperator, setConditionOperator] = useState('EQUALS');
  const [conditionValue, setConditionValue] = useState('HIGH');
  
  const [actionType, setActionType] = useState<'SET_STATUS' | 'SET_PRIORITY' | 'POST_COMMENT' | 'SEND_NOTIFICATION'>('SET_STATUS');
  const [actionTargetStatusId, setActionTargetStatusId] = useState('');
  const [actionTargetPriority, setActionTargetPriority] = useState('URGENT');
  const [actionMessage, setActionMessage] = useState('Automated task transition completed.');
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isAutomationsOpen || !activeProjectId) return null;

  const statuses = project?.statuses || [];

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    let actionConfig: any = {};
    if (actionType === 'SET_STATUS') {
      const chosenStatus = statuses.find((s) => s.id === (actionTargetStatusId || statuses[0]?.id));
      actionConfig = { statusId: chosenStatus?.id, statusName: chosenStatus?.name };
    } else if (actionType === 'SET_PRIORITY') {
      actionConfig = { priority: actionTargetPriority };
    } else if (actionType === 'POST_COMMENT' || actionType === 'SEND_NOTIFICATION') {
      actionConfig = { message: actionMessage };
    }

    try {
      await apiClient.post('/automations', {
        projectId: activeProjectId,
        name: ruleName.trim(),
        trigger: {
          type: triggerType,
          config: triggerType === 'STATUS_CHANGED' ? { toStatusId: triggerStatusId || undefined } : {},
        },
        conditions: [
          { field: conditionField, operator: conditionOperator, value: conditionValue },
        ],
        actions: [
          {
            type: actionType,
            config: actionConfig,
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
      <div className="w-full max-w-3xl bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 max-h-[85vh] flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Workflow Automation Engine</h3>
              <p className="text-[var(--text-secondary)] text-xs">
                Trigger automated status transitions, SLA checks, and notifications
              </p>
            </div>
          </div>
          <button
            onClick={() => setAutomationsOpen(false)}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Test Result Toast */}
        {testResult && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{testResult}</span>
          </div>
        )}

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-[var(--text-primary)]">Active Rules ({rules.length})</span>
          <button
            onClick={() => setIsCreatingRule(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Automation Rule</span>
          </button>
        </div>

        {/* Rule Builder Form */}
        {isCreatingRule && (
          <form onSubmit={handleCreateRule} className="p-4 bg-[var(--bg-elevated)] border border-indigo-500/40 rounded-2xl space-y-4 text-xs animate-in fade-in">
            <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Configure Rule Pipeline (When → If → Then)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Rule Name *</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Auto-Transition Resolved Code Review to Done"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Trigger */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">1. When (Trigger)</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  <option value="STATUS_CHANGED">Status Changed</option>
                  <option value="TASK_CREATED">Task Created</option>
                  <option value="PRIORITY_CHANGED">Priority Changed</option>
                  <option value="ASSIGNEE_ADDED">Assignee Added</option>
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">2. If (Condition)</label>
                <select
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  <option value="URGENT">Priority == URGENT</option>
                  <option value="HIGH">Priority == HIGH</option>
                  <option value="MEDIUM">Priority == MEDIUM</option>
                  <option value="LOW">Priority == LOW</option>
                </select>
              </div>

              {/* Action Type */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">3. Then (Action)</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  <option value="SET_STATUS">Set Task Status</option>
                  <option value="SET_PRIORITY">Set Priority</option>
                  <option value="POST_COMMENT">Post Bot Comment</option>
                  <option value="SEND_NOTIFICATION">Send Notification</option>
                </select>
              </div>
            </div>

            {/* Action Param Inputs */}
            {actionType === 'SET_STATUS' && (
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Target Status</label>
                <select
                  value={actionTargetStatusId}
                  onChange={(e) => setActionTargetStatusId(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none cursor-pointer font-semibold"
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {actionType === 'SET_PRIORITY' && (
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Target Priority</label>
                <select
                  value={actionTargetPriority}
                  onChange={(e) => setActionTargetPriority(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  <option value="URGENT">🔴 Urgent</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="LOW">⚪ Low</option>
                </select>
              </div>
            )}

            {(actionType === 'POST_COMMENT' || actionType === 'SEND_NOTIFICATION') && (
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Message</label>
                <input
                  type="text"
                  value={actionMessage}
                  onChange={(e) => setActionMessage(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setIsCreatingRule(false)}
                className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold"
              >
                Create Automation Rule
              </button>
            </div>
          </form>
        )}

        {/* Rules List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {rules.length > 0 ? (
            rules.map((rule) => {
              const rawRule: any = rule;
              let trigger: any = rawRule.trigger || {};
              let conditions: any[] = rawRule.conditions || [];
              let actions: any[] = rawRule.actions || [];

              if (typeof rawRule.triggerJson === 'string') {
                try { trigger = JSON.parse(rawRule.triggerJson); } catch (e) {}
              }
              if (typeof rawRule.conditionsJson === 'string') {
                try { conditions = JSON.parse(rawRule.conditionsJson); } catch (e) {}
              }
              if (typeof rawRule.actionsJson === 'string') {
                try { actions = JSON.parse(rawRule.actionsJson); } catch (e) {}
              }

              return (
                <div
                  key={rule.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    rule.isEnabled
                      ? 'bg-[var(--bg-card)] border-[var(--border-default)] shadow-sm'
                      : 'bg-[var(--bg-elevated)]/40 border-[var(--border-subtle)] opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${rule.isEnabled ? 'text-purple-500' : 'text-[var(--text-muted)]'}`} />
                      <h4 className="font-bold text-xs text-[var(--text-primary)]">{rule.name}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestRule(rule.id)}
                        className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                        title="Execute test run on a sample task"
                      >
                        <Play className="w-3 h-3 text-indigo-500 fill-current" />
                        <span>Test Run</span>
                      </button>

                      {/* Toggle Enabled Switch */}
                      <button
                        onClick={() => handleToggleRule(rule)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                          rule.isEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            rule.isEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 text-[var(--text-muted)] hover:text-rose-500"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Pipeline Visual Flow Chips */}
                  <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold">
                      When: {trigger.type || 'STATUS_CHANGED'}
                    </span>
                    <ArrowRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-semibold">
                      If: {conditions[0]?.field || 'priority'} {conditions[0]?.operator || '=='} {conditions[0]?.value || 'HIGH'}
                    </span>
                    <ArrowRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold">
                      Then: {actions[0]?.type === 'SET_STATUS' ? `Set Status → ${actions[0]?.config?.statusName || 'Done'}` : actions[0]?.type || 'Post Comment'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mt-2 font-mono">
                    <span>Executions: {rule.executionCount}</span>
                    <span>Last run: {rule.lastExecutedAt ? new Date(rule.lastExecutedAt).toLocaleTimeString() : 'Never'}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-[var(--text-muted)] italic text-center py-6">No automation rules configured yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
