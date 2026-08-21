import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useProject } from '../../api/queries';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  X,
  Workflow,
  Plus,
  Trash2,
  Check,
  Shield,
  Layers,
  Save,
} from 'lucide-react';

export const ProjectSettingsModal: React.FC = () => {
  const { isProjectSettingsOpen, setProjectSettingsOpen, activeProjectId } = useAppStore();
  const queryClient = useQueryClient();
  const { data: project } = useProject(activeProjectId);

  const [activeTab, setActiveTab] = useState<'workflow' | 'customfields' | 'sla'>('workflow');
  const [statuses, setStatuses] = useState<any[]>(project?.statuses || []);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusCategory, setNewStatusCategory] = useState('TODO');
  const [newStatusColor, setNewStatusColor] = useState('#3b82f6');

  // Custom Field Form
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('TEXT');

  // SLA Form
  const [firstResponse, setFirstResponse] = useState(project?.slaConfig?.firstResponseMinutes || 60);
  const [resolution, setResolution] = useState(project?.slaConfig?.resolutionMinutes || 480);

  React.useEffect(() => {
    if (project?.statuses) setStatuses(project.statuses);
    if (project?.slaConfig) {
      setFirstResponse(project.slaConfig.firstResponseMinutes);
      setResolution(project.slaConfig.resolutionMinutes);
    }
  }, [project]);

  if (!isProjectSettingsOpen || !project) return null;

  const handleAddStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusName.trim()) return;

    const newStatus = {
      id: `temp-${Date.now()}`,
      name: newStatusName.trim(),
      category: newStatusCategory,
      color: newStatusColor,
      order: statuses.length,
    };

    const updated = [...statuses, newStatus];
    setStatuses(updated);
    setNewStatusName('');

    await apiClient.put(`/projects/${project.id}/statuses`, { statuses: updated });
    queryClient.invalidateQueries({ queryKey: ['project', project.id] });
    queryClient.invalidateQueries({ queryKey: ['tasks', project.id] });
  };

  const handleSaveWorkflow = async () => {
    await apiClient.put(`/projects/${project.id}/statuses`, { statuses });
    queryClient.invalidateQueries({ queryKey: ['project', project.id] });
    queryClient.invalidateQueries({ queryKey: ['tasks', project.id] });
    alert('Workflow saved successfully!');
  };

  const handleCreateCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    await apiClient.post(`/projects/${project.id}/custom-fields`, {
      name: newFieldName.trim(),
      type: newFieldType,
    });
    queryClient.invalidateQueries({ queryKey: ['project', project.id] });
    setNewFieldName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-3xl bg-[#0e1626] border border-[#233352] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div>
            <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">
              {project.key} Project Settings
            </span>
            <h3 className="text-sm font-bold text-slate-100">{project.name}</h3>
          </div>
          <button
            onClick={() => setProjectSettingsOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
              activeTab === 'workflow'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Workflow & Statuses</span>
          </button>

          <button
            onClick={() => setActiveTab('customfields')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
              activeTab === 'customfields'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Custom Fields</span>
          </button>

          {project.type === 'SERVICE_DESK' && (
            <button
              onClick={() => setActiveTab('sla')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === 'sla'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>SLA Target Matrix</span>
            </button>
          )}
        </div>

        {/* Workflow Tab */}
        {activeTab === 'workflow' && (
          <div className="flex-1 overflow-y-auto space-y-4 text-xs">
            {/* Add status form */}
            <form onSubmit={handleAddStatus} className="p-3 bg-[#131d31] rounded-xl border border-[#202e48] flex gap-2">
              <input
                type="text"
                required
                placeholder="New Status Name (e.g. Staging QA)"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                className="flex-1 bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none"
              />
              <select
                value={newStatusCategory}
                onChange={(e) => setNewStatusCategory(e.target.value)}
                className="bg-[#0b0f17] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
              <input
                type="color"
                value={newStatusColor}
                onChange={(e) => setNewStatusColor(e.target.value)}
                className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow"
              >
                Add Status
              </button>
            </form>

            {/* Existing Statuses List */}
            <div className="border border-[#202e48] rounded-xl overflow-hidden divide-y divide-[#1e293b]">
              {statuses.map((s, idx) => (
                <div key={s.id || idx} className="p-3 bg-[#101726] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-semibold text-slate-200">{s.name}</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400 font-mono">
                      {s.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">WIP Limit:</span>
                    <input
                      type="number"
                      placeholder="None"
                      value={s.wipLimit ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : Number(e.target.value);
                        setStatuses(statuses.map((st, i) => (i === idx ? { ...st, wipLimit: val } : st)));
                      }}
                      className="w-14 bg-[#0b0f17] border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveWorkflow}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Workflow Changes</span>
              </button>
            </div>
          </div>
        )}

        {/* Custom Fields Tab */}
        {activeTab === 'customfields' && (
          <div className="flex-1 overflow-y-auto space-y-4 text-xs">
            <form onSubmit={handleCreateCustomField} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Field Name (e.g. Target Release, Environment)"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="flex-1 bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none"
              />
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                className="bg-[#0b0f17] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
              >
                <option value="TEXT">Text</option>
                <option value="NUMBER">Number</option>
                <option value="DROPDOWN">Dropdown</option>
                <option value="CHECKBOX">Checkbox</option>
                <option value="DATE">Date</option>
                <option value="CURRENCY">Currency</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
              >
                Add Custom Field
              </button>
            </form>

            <div className="space-y-2">
              {(project.customFields || []).map((cf: any) => (
                <div
                  key={cf.id}
                  className="p-3 bg-[#131d31] rounded-xl border border-[#202e48] flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-200">{cf.name}</p>
                    <p className="text-xs font-mono text-indigo-400">{cf.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLA Matrix Tab */}
        {activeTab === 'sla' && (
          <div className="flex-1 overflow-y-auto space-y-4 text-xs">
            <div className="p-4 bg-[#131d31] rounded-xl border border-[#202e48] space-y-3">
              <h4 className="font-semibold text-slate-100">Service Level Agreement (SLA) Targets</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">First Response SLA (Minutes)</label>
                  <input
                    type="number"
                    value={firstResponse}
                    onChange={(e) => setFirstResponse(Number(e.target.value))}
                    className="w-full bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Resolution SLA (Minutes)</label>
                  <input
                    type="number"
                    value={resolution}
                    onChange={(e) => setResolution(Number(e.target.value))}
                    className="w-full bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
