import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiClient } from '../../api/client';
import { IssueTypeBadge } from '../common/IssueTypeBadge';
import { useFocusTrap } from '../../lib/useFocusTrap';
import {
  Search,
  FileText,
  Plus,
  Columns3,
  Layers,
  BarChart2,
  Sun,
  Moon,
  BookOpen,
} from 'lucide-react';

type ActionItem = {
  id: string;
  label: React.ReactNode;
  run: () => void;
  kbd?: string;
};

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setActiveTaskId,
    setActiveView,
    setActiveMainSection,
    setCreateTaskOpen,
    setGuideOpen,
    toggleTheme,
    theme,
  } = useAppStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ tasks: any[]; docs: any[]; projects: any[] }>({
    tasks: [],
    docs: [],
    projects: [],
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const close = useCallback(() => {
    setCommandPaletteOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, [setCommandPaletteOpen]);

  const panelRef = useFocusTrap(isCommandPaletteOpen, close);

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen, setCreateTaskOpen]);

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

  const items: ActionItem[] = useMemo(() => {
    if (!query.trim()) {
      return [
        {
          id: 'create',
          kbd: 'C',
          label: (
            <span className="flex items-center gap-2 font-semibold">
              <Plus className="w-3.5 h-3.5 text-indigo-500" /> Create New Issue
            </span>
          ),
          run: () => {
            close();
            setCreateTaskOpen(true);
          },
        },
        {
          id: 'board',
          label: (
            <span className="flex items-center gap-2">
              <Columns3 className="w-3.5 h-3.5 text-blue-500" /> Go to Kanban Board
            </span>
          ),
          run: () => {
            setActiveView('BOARD');
            close();
          },
        },
        {
          id: 'backlog',
          label: (
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-emerald-500" /> Go to Sprint Backlog
            </span>
          ),
          run: () => {
            setActiveView('BACKLOG');
            close();
          },
        },
        {
          id: 'gantt',
          label: (
            <span className="flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-purple-500 rotate-90" /> Go to Timeline / Gantt
            </span>
          ),
          run: () => {
            setActiveView('GANTT');
            close();
          },
        },
        {
          id: 'guide',
          label: (
            <span className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Open Platform Documentation & User Guide
            </span>
          ),
          run: () => {
            setGuideOpen(true);
            close();
          },
        },
        {
          id: 'theme',
          label: (
            <span className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
              )}
              Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </span>
          ),
          run: () => {
            toggleTheme();
            close();
          },
        },
      ];
    }
    const out: ActionItem[] = [];
    for (const task of results.tasks) {
      out.push({
        id: `task-${task.id}`,
        label: (
          <span className="flex items-center gap-2 truncate">
            <IssueTypeBadge type={task.issueType} showLabel={false} />
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{task.key}</span>
            <span className="truncate font-medium">{task.title}</span>
          </span>
        ),
        run: () => {
          setActiveTaskId(task.id);
          close();
        },
      });
    }
    for (const doc of results.docs) {
      out.push({
        id: `doc-${doc.id}`,
        label: (
          <span className="flex items-center gap-2 truncate">
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span className="truncate font-medium">{doc.title}</span>
          </span>
        ),
        run: () => {
          setActiveMainSection('DOCS');
          close();
        },
      });
    }
    return out;
  }, [
    query,
    results,
    close,
    setCreateTaskOpen,
    setActiveView,
    setGuideOpen,
    toggleTheme,
    theme,
    setActiveTaskId,
    setActiveMainSection,
  ]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, items.length]);

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[activeIndex]?.run();
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        tabIndex={-1}
        className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] transition-colors outline-none"
        onKeyDown={onListKeyDown}
      >
        <div className="p-3 border-b border-[var(--border-subtle)] flex items-center gap-3 bg-[var(--bg-elevated)]">
          <Search className="w-4 h-4 text-indigo-500 shrink-0" aria-hidden />
          <input
            type="text"
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-activedescendant={items[activeIndex] ? `cmd-${items[activeIndex].id}` : undefined}
            aria-autocomplete="list"
            placeholder="Type a task name, doc, or command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none font-sans"
          />
          <kbd className="bg-[var(--bg-input)] text-[var(--text-muted)] text-xs px-1.5 py-0.5 rounded font-mono border border-[var(--border-default)]">
            ESC
          </kbd>
        </div>

        <div
          id="command-palette-list"
          role="listbox"
          aria-label="Commands and search results"
          className="flex-1 overflow-y-auto p-2 space-y-1 text-xs"
        >
          {!query && (
            <div className="px-2 py-1 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Quick Actions & Views
            </div>
          )}
          {items.map((item, idx) => (
            <button
              key={item.id}
              id={`cmd-${item.id}`}
              role="option"
              aria-selected={idx === activeIndex}
              onClick={item.run}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors ${
                idx === activeIndex
                  ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {item.label}
              {item.kbd && <kbd className="text-xs font-mono text-[var(--text-muted)]">{item.kbd}</kbd>}
            </button>
          ))}
          {query.trim() && items.length === 0 && (
            <p className="px-2 py-4 text-center text-[var(--text-muted)]">No results</p>
          )}
        </div>
      </div>
    </div>
  );
};
