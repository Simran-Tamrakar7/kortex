import React from 'react';
import { Status } from '@kortex/shared';

interface Props {
  status?: Status;
  name?: string;
  color?: string;
  className?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, name, color, className = '' }) => {
  const statusName = status?.name || name || 'To Do';
  const statusColor = status?.color || color || '#64748b';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border transition-all ${className}`}
      style={{
        backgroundColor: `${statusColor}18`,
        color: statusColor,
        borderColor: `${statusColor}40`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
      {statusName}
    </span>
  );
};
