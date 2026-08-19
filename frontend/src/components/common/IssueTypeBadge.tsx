import React from 'react';
import { IssueType } from '@kortex/shared';
import { Zap, Bookmark, CheckSquare, GitCommit, AlertTriangle } from 'lucide-react';

interface Props {
  type: IssueType;
  showLabel?: boolean;
  className?: string;
}

export const IssueTypeBadge: React.FC<Props> = ({ type, showLabel = true, className = '' }) => {
  switch (type) {
    case 'EPIC':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 ${className}`}>
          <Zap className="w-3.5 h-3.5" />
          {showLabel && 'Epic'}
        </span>
      );
    case 'STORY':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${className}`}>
          <Bookmark className="w-3.5 h-3.5" />
          {showLabel && 'Story'}
        </span>
      );
    case 'BUG':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          {showLabel && 'Bug'}
        </span>
      );
    case 'SUBTASK':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 ${className}`}>
          <GitCommit className="w-3.5 h-3.5" />
          {showLabel && 'Subtask'}
        </span>
      );
    case 'TASK':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 ${className}`}>
          <CheckSquare className="w-3.5 h-3.5" />
          {showLabel && 'Task'}
        </span>
      );
  }
};
