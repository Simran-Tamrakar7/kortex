import React from 'react';
import { Task } from '@kortex/shared';
import { useAppStore } from '../../store/useAppStore';
import { Avatar } from '../common/Avatar';
import { IssueTypeBadge } from '../common/IssueTypeBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Briefcase,
} from 'lucide-react';

interface Props {
  tasks: Task[];
}

export const WorkloadView: React.FC<Props> = ({ tasks }) => {
  const { setActiveTaskId } = useAppStore();

  // Aggregate workload per user
  const userWorkloadMap: Record<
    string,
    {
      user: { id: string; name: string; avatarUrl?: string; email?: string };
      tasks: Task[];
      totalPoints: number;
      totalEstimatedHours: number;
      completedHours: number;
    }
  > = {};

  const unassignedTasks: Task[] = [];

  tasks.forEach((task) => {
    const hours = (task.timeEstimateMinutes || 240) / 60; // default 4h if unestimated
    const points = task.storyPoints || 0;

    if (!task.assignees || task.assignees.length === 0) {
      unassignedTasks.push(task);
    } else {
      task.assignees.forEach((assignee) => {
        if (!userWorkloadMap[assignee.id]) {
          userWorkloadMap[assignee.id] = {
            user: assignee,
            tasks: [],
            totalPoints: 0,
            totalEstimatedHours: 0,
            completedHours: 0,
          };
        }
        userWorkloadMap[assignee.id].tasks.push(task);
        userWorkloadMap[assignee.id].totalPoints += points;
        userWorkloadMap[assignee.id].totalEstimatedHours += hours;
        if (task.status?.category === 'DONE') {
          userWorkloadMap[assignee.id].completedHours += hours;
        }
      });
    }
  });

  const weeklyCapacity = 40; // 40 hours per week standard

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#090e18] select-none text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-sm text-slate-200">Team Capacity & Workload Allocation</span>
        </div>
        <span className="text-slate-400">Standard Weekly Baseline: 40 hrs / developer</span>
      </div>

      {/* User Workload Cards */}
      <div className="space-y-3">
        {Object.values(userWorkloadMap).map(({ user, tasks: userTasks, totalPoints, totalEstimatedHours, completedHours }) => {
          const allocationPct = Math.round((totalEstimatedHours / weeklyCapacity) * 100);
          const isOverloaded = allocationPct > 100;

          return (
            <div
              key={user.id}
              className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 shadow-md space-y-3"
            >
              {/* Header: User Info & Capacity Bar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />
                  <div>
                    <h4 className="font-semibold text-sm text-slate-100">{user.name}</h4>
                    <p className="text-slate-400 text-xs">{user.email || 'Developer'}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4">
                  <div className="text-right font-mono">
                    <span className="text-slate-400 text-xs">Story Points: </span>
                    <span className="font-bold text-slate-200">{totalPoints} pts</span>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-slate-400 text-xs">Assigned Hours: </span>
                    <span className={`font-bold ${isOverloaded ? 'text-rose-400' : 'text-slate-200'}`}>
                      {Math.round(totalEstimatedHours * 10) / 10}h / {weeklyCapacity}h
                    </span>
                  </div>

                  {isOverloaded ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/40">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{allocationPct}% (Over Capacity)</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{allocationPct}% Capacity</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isOverloaded
                      ? 'bg-rose-500'
                      : allocationPct > 80
                      ? 'bg-amber-500'
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, allocationPct)}%` }}
                />
              </div>

              {/* Task list for this user */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                {userTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setActiveTaskId(task.id)}
                    className="p-2 bg-[#141e30] border border-[#202e48] hover:border-slate-500 rounded-lg cursor-pointer flex items-center justify-between transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <IssueTypeBadge type={task.issueType} showLabel={false} />
                      <span className="text-slate-200 font-medium truncate">{task.title}</span>
                    </div>
                    <span className="font-mono text-slate-400 font-semibold shrink-0">
                      {task.storyPoints ? `${task.storyPoints}p` : task.key}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Unassigned tasks container if any */}
        {unassignedTasks.length > 0 && (
          <div className="bg-[#0f172a] border border-dashed border-slate-700 rounded-xl p-4">
            <h4 className="font-semibold text-xs text-amber-400 mb-2">
              ⚠️ Unassigned Tasks ({unassignedTasks.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {unassignedTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setActiveTaskId(task.id)}
                  className="p-2 bg-[#141e30] border border-[#202e48] rounded-lg cursor-pointer flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300 truncate">{task.title}</span>
                  <span className="font-mono text-slate-500">{task.key}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
