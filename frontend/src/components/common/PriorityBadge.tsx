import React from 'react';
import { Priority } from '@kortex/shared';
import { AlertOctagon, ArrowUp, Equal, ArrowDown } from 'lucide-react';

interface Props {
  priority: Priority;
  showLabel?: boolean;
  className?: string;
}

export const PriorityBadge: React.FC<Props> = ({ priority, showLabel = true, className = '' }) => {
  switch (priority) {
    case 'URGENT':
      return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold rounded bg-red-500/15 text-red-400 border border-red-500/30 ${className}`}>
          <AlertOctagon className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          {showLabel && 'Urgent'}
        </span>
      );
    case 'HIGH':
      return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 ${className}`}>
          <ArrowUp className="w-3.5 h-3.5" />
          {showLabel && 'High'}
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 ${className}`}>
          <Equal className="w-3.5 h-3.5" />
          {showLabel && 'Medium'}
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-normal rounded bg-slate-500/15 text-slate-400 border border-slate-500/30 ${className}`}>
          <ArrowDown className="w-3.5 h-3.5" />
          {showLabel && 'Low'}
        </span>
      );
  }
};
