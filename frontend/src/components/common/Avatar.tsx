import React from 'react';

interface Props {
  name?: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isOnline?: boolean;
  className?: string;
  showTooltip?: boolean;
}

export const Avatar: React.FC<Props> = ({
  name = 'User',
  avatarUrl,
  size = 'md',
  isOnline = false,
  className = '',
  showTooltip = true,
}) => {
  const sizeMap = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-7 h-7 text-xs',
    lg: 'w-9 h-9 text-sm',
  };

  const dotSizeMap = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${sizeMap[size]} ${className}`}
      title={showTooltip ? name : undefined}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full rounded-full object-cover border border-slate-700/50"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-medium flex items-center justify-center border border-indigo-400/40">
          {getInitials(name)}
        </div>
      )}
      {isOnline && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full bg-emerald-500 border-2 border-[#0b0f17] presence-active ${dotSizeMap[size]}`}
        />
      )}
    </div>
  );
};
