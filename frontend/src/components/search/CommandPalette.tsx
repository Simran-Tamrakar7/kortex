import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiClient } from '../../api/client';
import { IssueTypeBadge } from '../common/IssueTypeBadge';
import {
  Search,
  CheckSquare,
  FileText,
  FolderGit2,
  Plus,
  Play,
  Columns3,
  List,
  Layers,
  BarChart2,
  Calendar,
  Sun,
  Moon,
  Zap,
  BookOpen,
  X,
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setActiveTaskId,
    setActiveView,
    setActiveMainSection,
    setCreateTaskOpen,
    setAutomationsOpen,
    setGuideOpen,
    toggleTheme,
    theme,
  } = useAppStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    tasks: any[];
    docs: any[];
    projects: any[];
  }>({ tasks: [], docs: [], projects: [] });

  // Listen to Cmd+K / Ctrl+K & C shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (
        e.key.toLowerCase() === 'c' &&
        !['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())
      ) {
        if (!isCommandPaletteOpen) {
          e.preventDefault();
          setCreateTaskOpen(true);
        }
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen, setCreateTaskOpen]);

  // Live search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ tasks: [], docs: [], projects: [] });
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (e) {}
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] transition-colors">
        {/* Search input header */}
        <div className="p-3 border-b border-[var(--border-subtle)] flex items-center gap-3 bg-[var(--bg-elevated)]">
          <Search className="w-4 h-4 text-indigo-500 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a task name, doc, or command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none font-sans"
          />
          <kbd className="bg-[var(--bg-input)] text-[var(--text-muted)] text-[10px] px-1.5 py-0.5 rounded font-mono border border-[var(--border-default)]">
            ESC
          </kbd>
        </div>

        {/* Results / Commands List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Quick Actions */}
          {!query && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Quick Actions & Views
              </div>
              <button
                onClick={() => {
                  setCommandPaletteOpen(false);
                  setCreateTaskOpen(true);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-semibold">Create New Issue</span>
                </div>
                <kbd className="text-[10px] font-mono text-[var(--text-muted)]">C</kbd>
              </button>

              <button
                onClick={() => {
                  setActiveView('BOARD');
                  setCommandPaletteOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2 transition-colors"
              >
                <Columns3 className="w-3.5 h-3.5 text-blue-500" />
                <span>Go to Kanban Board</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('BACKLOG');
                  setCommandPaletteOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                <span>Go to Sprint Backlog</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('GANTT');
                  setCommandPaletteOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2 transition-colors"
              >
                <BarChart2 className="w-3.5 h-3.5 text-purple-500 rotate-90" />
                <span>Go to Timeline / Gantt</span>
              </button>

              <button
                onClick={() => {
                  setGuideOpen(true);
                  setCommandPaletteOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Open Platform Documentation & User Guide</span>
              </button>

              <button
                onClick={() => {
                  toggleTheme();
                  setCommandPaletteOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                <span>Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
              </button>
            </div>
          )}

          {/* Search Results */}
          {results.tasks.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Tasks ({results.tasks.length})
              </div>
              {results.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    setActiveTaskId(task.id);
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[var(--bg-hover)] flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <IssueTypeBadge type={task.issueType} showLabel={false} />
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{task.key}</span>
                    <span className="truncate text-[var(--text-primary)] font-medium">{task.title}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--text-muted)]">{task.project?.name}</span>
                </button>
              ))}
            </div>
          )}

          {results.docs.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Docs ({results.docs.length})
              </div>
              {results.docs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setActiveMainSection('DOCS');
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[var(--bg-hover)] flex items-center gap-2 text-xs transition-colors text-[var(--text-primary)] font-medium"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span className="truncate">{doc.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
