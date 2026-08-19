import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore, FontFamily, FontSize } from '../../store/useAppStore';
import { usePresenceStore } from '../../store/usePresenceStore';
import { useNotifications, useProject } from '../../api/queries';
import { Avatar } from '../common/Avatar';
import {
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  Play,
  Pause,
  Square,
  Settings,
  LogOut,
  Layers,
  ChevronRight,
  Type,
  Check,
  Minus,
  Sliders,
  BookOpen,
} from 'lucide-react';
import { apiClient } from '../../api/client';

export const Header: React.FC = () => {
  const { user, organization, workspaces, activeWorkspaceId, logout } = useAuthStore();
  const {
    activeProjectId,
    setCreateTaskOpen,
    setCommandPaletteOpen,
    setOrgSettingsOpen,
    setProjectSettingsOpen,
    setGuideOpen,
    timer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    tickTimer,
    theme,
    toggleTheme,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    fontSizePx,
    setFontSizePx,
  } = useAppStore();

  const { onlineUsers } = usePresenceStore();
  const { data: project } = useProject(activeProjectId);
  const { data: notifData, refetch: refetchNotifs } = useNotifications();

  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);

  const fontMenuRef = useRef<HTMLDivElement>(null);
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target as Node)) {
        setIsFontMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Timer interval tick
  useEffect(() => {
    if (timer?.isRunning) {
      const interval = setInterval(() => {
        tickTimer();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer?.isRunning, tickTimer]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/notifications/all/read');
      refetchNotifs();
    } catch (e) {}
  };

  const fonts: { id: FontFamily; label: string; preview: string }[] = [
    { id: 'inter', label: 'Inter', preview: 'Clean modern standard' },
    { id: 'jakarta', label: 'Jakarta', preview: 'Geometric curves' },
    { id: 'outfit', label: 'Outfit', preview: 'Distinctive display' },
    { id: 'roboto', label: 'Roboto', preview: 'Enterprise UI' },
    { id: 'jetbrains', label: 'JetBrains', preview: 'Code monospace' },
    { id: 'fira', label: 'Fira Code', preview: 'Tech monospace' },
  ];

  const sizePresets = [11, 12, 13, 14, 15, 16, 18];

  return (
    <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-header)] px-4 flex items-center justify-between shrink-0 z-30 select-none transition-colors">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-medium">
        <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-500" />
          {organization?.name || 'Kortex'}
        </span>
        {activeWorkspace && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-[var(--text-secondary)]">{activeWorkspace.name}</span>
          </>
        )}
        {project && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
              {project.name}
            </span>
          </>
        )}
      </div>

      {/* Middle: Search bar button */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center gap-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)] px-3 py-1.5 rounded-lg text-xs transition-all w-72 justify-between group shadow-sm"
      >
        <span className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-indigo-500 transition-colors" />
          <span>Quick search or command...</span>
        </span>
        <kbd className="bg-[var(--bg-input)] text-[var(--text-muted)] text-[10px] px-1.5 py-0.5 rounded font-mono border border-[var(--border-subtle)]">
          ⌘K
        </kbd>
      </button>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {/* Active Timer Pill if running/paused */}
        {timer && (
          <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-500/40 px-2.5 py-1 rounded-full text-xs text-indigo-700 dark:text-indigo-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="font-mono font-bold">{formatTimer(timer.elapsedSeconds)}</span>
            <span className="text-[var(--text-secondary)] max-w-[100px] truncate">{timer.taskKey}</span>
            <div className="flex items-center gap-1 ml-1">
              {timer.isRunning ? (
                <button
                  onClick={pauseTimer}
                  title="Pause timer"
                  className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded text-indigo-600 dark:text-indigo-300"
                >
                  <Pause className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  title="Resume timer"
                  className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded text-emerald-600 dark:text-emerald-400"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={stopTimer}
                title="Stop & Log timer"
                className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded text-rose-500"
              >
                <Square className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Live Presence Avatars */}
        {onlineUsers.length > 0 && (
          <div className="flex items-center -space-x-1.5 mr-1" title={`${onlineUsers.length} teammates online`}>
            {onlineUsers.slice(0, 4).map((u) => (
              <Avatar
                key={u.userId}
                name={u.name}
                avatarUrl={u.avatarUrl}
                size="sm"
                isOnline={true}
                className="border-2 border-[var(--bg-header)]"
              />
            ))}
            {onlineUsers.length > 4 && (
              <span className="w-6 h-6 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[10px] text-[var(--text-secondary)] font-semibold flex items-center justify-center">
                +{onlineUsers.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Quick Create Task Button */}
        <button
          onClick={() => setCreateTaskOpen(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create</span>
          <kbd className="bg-indigo-700 text-indigo-200 text-[9px] px-1 py-0.2 rounded font-mono ml-0.5">C</kbd>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Documentation & Help Guide */}
        <button
          onClick={() => setGuideOpen(true)}
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          title="Platform Guide & Documentation"
        >
          <BookOpen className="w-4 h-4 text-indigo-500" />
        </button>

        {/* Quick Font & Size Customizer Flyout */}
        <div className="relative" ref={fontMenuRef}>
          <button
            onClick={() => setIsFontMenuOpen(!isFontMenuOpen)}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
              isFontMenuOpen
                ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
            title="Instant Font & Size Customizer"
          >
            <Type className="w-4 h-4" />
          </button>

          {isFontMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3.5">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Typography & Scale</span>
                </span>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30">
                  {fontSizePx}px base
                </span>
              </div>

              {/* 1. Quick Font Family Buttons */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Font Family
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {fonts.map((f) => {
                    const isSelected = fontFamily === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setFontFamily(f.id)}
                        className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between text-xs ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-bold ring-1 ring-indigo-500'
                            : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-slate-400'
                        }`}
                      >
                        <span className="truncate">{f.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Quick Font Size Scaling */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Base Size Scaling
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFontSizePx(Math.max(10, fontSizePx - 1))}
                      className="w-5 h-5 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-primary)] border border-[var(--border-default)] text-xs"
                      title="Decrease font size"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setFontSizePx(Math.min(22, fontSizePx + 1))}
                      className="w-5 h-5 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-primary)] border border-[var(--border-default)] text-xs"
                      title="Increase font size"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto py-1">
                  {sizePresets.map((px) => {
                    const isSelected = fontSizePx === px;
                    return (
                      <button
                        key={px}
                        onClick={() => setFontSizePx(px)}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-mono font-bold transition-all border ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                            : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {px}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer: Open Full Settings Modal */}
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsFontMenuOpen(false);
                    setOrgSettingsOpen(true);
                  }}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" />
                  <span>More Appearance Options</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotifsOpen(!isNotifsOpen)}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notifData?.unreadCount ? (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            ) : null}
            {notifData?.unreadCount ? (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
            ) : null}
          </button>

          {isNotifsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-subtle)]">
                <span className="font-bold text-xs text-[var(--text-primary)]">Notifications</span>
                {notifData?.unreadCount ? (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-indigo-500 hover:underline"
                  >
                    Mark all read
                  </button>
                ) : null}
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifData?.notifications.length ? (
                  notifData.notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2 rounded-lg text-xs transition-colors ${
                        n.isRead
                          ? 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                          : 'bg-indigo-50 dark:bg-indigo-950/30 text-[var(--text-primary)] border-l-2 border-indigo-500'
                      }`}
                    >
                      <div className="font-semibold text-[var(--text-primary)] flex items-center justify-between">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[var(--text-secondary)] mt-0.5">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-[var(--text-muted)]">No new notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            <Avatar name={user?.name} avatarUrl={user?.avatarUrl} size="sm" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
                <p className="font-bold text-xs text-[var(--text-primary)]">{user?.name}</p>
                <p className="text-[11px] text-[var(--text-secondary)] truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setOrgSettingsOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-left"
                >
                  <Settings className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>Preferences & Settings</span>
                </button>
                {project && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setProjectSettingsOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-left"
                  >
                    <Layers className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>Project Settings ({project.key})</span>
                  </button>
                )}
              </div>
              <div className="pt-1 border-t border-[var(--border-subtle)]">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
