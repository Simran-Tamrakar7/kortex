import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useSprintReport, useSprints } from '../../api/queries';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { X, TrendingDown, Award, Target, CheckCircle2, AlertCircle } from 'lucide-react';

export const SprintReportsModal: React.FC = () => {
  const { isSprintReportOpen, setSprintReportOpen, activeSprintReportId } = useAppStore();
  const { data: report, isLoading } = useSprintReport(activeSprintReportId);

  if (!isSprintReportOpen || !activeSprintReportId) return null;

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-4xl bg-[#0e1626] border border-[#233352] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div>
            <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">
              Agile Analytics & Sprint Burndown
            </span>
            <h3 className="text-base font-bold text-slate-100">
              {report?.sprint?.name || 'Sprint Report'}
            </h3>
          </div>
          <button
            onClick={() => setSprintReportOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6 text-xs pr-1">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#131d31] rounded-xl border border-[#202e48]">
              <span className="text-slate-400 text-xs">Sprint Goal</span>
              <p className="font-semibold text-slate-200 mt-1 line-clamp-1">
                {report?.sprint?.goal || 'No goal set'}
              </p>
            </div>

            <div className="p-3 bg-[#131d31] rounded-xl border border-[#202e48]">
              <span className="text-slate-400 text-xs">Story Points Committed</span>
              <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">
                {report?.summary?.totalPoints || 0} pts
              </p>
            </div>

            <div className="p-3 bg-[#131d31] rounded-xl border border-[#202e48]">
              <span className="text-slate-400 text-xs">Points Completed</span>
              <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                {report?.summary?.completedPoints || 0} pts
              </p>
            </div>

            <div className="p-3 bg-[#131d31] rounded-xl border border-[#202e48]">
              <span className="text-slate-400 text-xs">Completion Rate</span>
              <p className="text-lg font-bold font-mono text-indigo-400 mt-0.5">
                {report?.summary?.completionRate || 0}%
              </p>
            </div>
          </div>

          {/* 1. Burndown Chart */}
          <div className="p-4 bg-[#131d31] rounded-xl border border-[#202e48] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-indigo-400" />
                <span>Sprint Burndown Chart (Remaining Story Points)</span>
              </h4>
              <span className="text-xs text-slate-400">Ideal vs Actual trajectory</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report?.burndown || []} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="ideal"
                    name="Ideal Burndown"
                    stroke="#94a3b8"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Remaining"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#6366f1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Velocity Chart & Status Distribution Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Velocity */}
            <div className="p-4 bg-[#131d31] rounded-xl border border-[#202e48] space-y-3">
              <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Team Velocity Across Sprints</span>
              </h4>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report?.velocity || []} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="committed" name="Committed" fill="#475569" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Breakdown Pie */}
            <div className="p-4 bg-[#131d31] rounded-xl border border-[#202e48] space-y-3">
              <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Task Status Breakdown</span>
              </h4>

              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report?.statusBreakdown || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={45}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(report?.statusBreakdown || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
