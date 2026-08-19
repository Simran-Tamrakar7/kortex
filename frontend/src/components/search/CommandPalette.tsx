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
      <div className="w-full max-w-xl bg-[#0e1626] border border-[#233352] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search input header */}
        <div className="p-3 border-b border-[#1e293b] flex items-center gap-3 bg-[#131d31]">
          <Search className="w-4 h-4 text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a task name, doc, or command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          <kbd className="bg-[#0b0f17] text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-mono border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results / Commands List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Quick Actions */}
          {!query && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Quick Actions & Views
              </div>
              <button
                onClick={() => {
                  setCommandPaletteOpen(false);
                  setCreateTaskOpen(true);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-slate-300 hover:bg-slate-800/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Create New Issue</span>
                </div>
                <kbd className="text-[10px] font-mono text-slate-500">C</kbd>
              </button>

              <button
                onClick={() => {
                  setActiveView('BOARD');
                  setCommandPaletteOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-slate-300 hover:bg-slate-800/60 flex items-center gap-2"
              >
                <Columns3 className="w-3.5 h-3.5 text-blue-400" />
                <span>Go to Kanban Board</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('BACKLOG');
                  setCommandPaletteOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-slate-300 hover:bg-slate-800/60 flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Go to Sprint Backlog</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('GANTT');
                  setCommandPaletteOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-slate-300 hover:bg-slate-800/60 flex items-center gap-2"
              >
                <BarChart2 className="w-3.5 h-3.5 text-amber-400 rotate-90" />
                <span>Go to Timeline / Gantt</span>
              </button>

              <button
                onClick={() => {
                  setAutomationsOpen(true);
                  setCommandPaletteOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-slate-300 hover:bg-slate-800/60 flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>Open Workflow Automations</span>
              </button>

              <button
                onClick={() => {
                  setGuideOpen(true);
                  setCommandPaletteOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Open Platform Documentation & User Guide</span>
              </button>

              <button
                onClick={() => {
                  toggleTheme();
                  setCommandPaletteOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
              >
                <Sun className="w-3.5 h-3.5 text-yellow-400" />
                <span>Toggle Light / Dark Theme</span>
              </button>
            </div>
          )}

          {/* Search Result Tasks */}
          {results.tasks.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Tasks ({results.tasks.length})
              </div>
              {results.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => {
                    setActiveTaskId(task.id);
                    setCommandPaletteOpen(false);
                  }}
                  className="px-2.5 py-2 rounded-lg hover:bg-[#141e30] cursor-pointer flex items-center justify-between text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <IssueTypeBadge type={task.issueType} showLabel={false} />
                    <span className="font-mono text-indigo-400 text-[11px] font-semibold">
                      {task.key}
                    </span>
                    <span className="truncate">{task.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {task.project?.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Search Result Docs */}
          {results.docs.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Docs & Wiki ({results.docs.length})
              </div>
              {results.docs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setActiveMainSection('DOCS');
                    setCommandPaletteOpen(false);
                  }}
                  className="px-2.5 py-2 rounded-lg hover:bg-[#141e30] cursor-pointer flex items-center gap-2 text-slate-200"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span className="truncate">{doc.title}</span>
                </div>
              ))}
            </div>
          )}

          {query && !results.tasks.length && !results.docs.length && (
            <div className="py-6 text-center text-slate-500">
              No results found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
