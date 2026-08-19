import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { useDocs } from '../../api/queries';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  BookOpen,
  FolderGit2,
  Check,
  Eye,
  Edit3,
  Bold,
  Italic,
  List,
  Heading1,
  Heading2,
  Code,
  Table as TableIcon,
  CheckSquare,
  Sparkles,
  Link,
  Share2,
} from 'lucide-react';

export const DocsView: React.FC = () => {
  const { activeWorkspaceId } = useAuthStore();
  const { activeProjectId, setActiveTaskId } = useAppStore();
  const queryClient = useQueryClient();

  const { data: docs = [], isLoading } = useDocs(activeWorkspaceId || undefined, activeProjectId);

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);
  const [mode, setMode] = useState<'preview' | 'edit' | 'split'>('preview');

  const activeDoc = docs.find((d) => d.id === selectedDocId) || docs[0];

  useEffect(() => {
    if (activeDoc) {
      setSelectedDocId(activeDoc.id);
      setDocTitle(activeDoc.title);
      setDocContent(activeDoc.content);
    }
  }, [activeDoc?.id]);

  const handleCreateDoc = async () => {
    if (!activeWorkspaceId) return;
    try {
      const res = await apiClient.post('/docs', {
        workspaceId: activeWorkspaceId,
        projectId: activeProjectId,
        title: 'Untitled Document',
        content: `# Untitled Document\n\n## Overview\nStart drafting your product spec, runbook, or meeting notes...\n\n### Key Items\n- [x] Initial design specs\n- [ ] Database schema review\n- [ ] Deploy to staging\n\n\`\`\`typescript\n// Sample code block\nexport const status = "Ready";\n\`\`\``,
      });
      queryClient.invalidateQueries({ queryKey: ['docs'] });
      setSelectedDocId(res.data.id);
      setMode('edit');
    } catch (e) {
      alert('Failed to create doc');
    }
  };

  const handleSaveDoc = async () => {
    if (!selectedDocId) return;
    setIsSaving(true);
    try {
      await apiClient.put(`/docs/${selectedDocId}`, {
        title: docTitle,
        content: docContent,
      });
      queryClient.invalidateQueries({ queryKey: ['docs'] });
      setSavedBadge(true);
      setTimeout(() => setSavedBadge(false), 2000);
    } catch (e) {
      alert('Failed to save doc');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (confirm('Delete this document?')) {
      await apiClient.delete(`/docs/${id}`);
      queryClient.invalidateQueries({ queryKey: ['docs'] });
      setSelectedDocId(null);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    setDocContent((prev) => `${prev}\n${prefix}Text${suffix}`);
  };

  // Custom high-performance Markdown renderer
  const renderMarkdown = (content: string) => {
    if (!content) return null;

    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre
              key={`code-${index}`}
              className="p-3.5 my-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl font-mono text-xs overflow-x-auto text-indigo-600 dark:text-indigo-300 leading-relaxed"
            >
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="text-xl font-bold text-[var(--text-primary)] mt-5 mb-2 pb-1 border-b border-[var(--border-subtle)]">
            {line.replace('# ', '')}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-base font-bold text-[var(--text-primary)] mt-4 mb-2 text-indigo-600 dark:text-indigo-400">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-sm font-bold text-[var(--text-primary)] mt-3 mb-1.5">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('> ')) {
        // Blockquotes
        elements.push(
          <blockquote key={index} className="border-l-4 border-indigo-500 pl-3 py-1 my-2 italic text-[var(--text-secondary)] bg-[var(--bg-elevated)]/50 rounded-r-lg">
            {line.replace('> ', '')}
          </blockquote>
        );
      } else if (line.startsWith('- [x] ') || line.startsWith('- [ ] ')) {
        // Task checkboxes
        const isChecked = line.startsWith('- [x] ');
        const text = line.replace(/- \[[ x]\] /, '');
        elements.push(
          <div key={index} className="flex items-center gap-2 my-1 text-xs">
            <input
              type="checkbox"
              checked={isChecked}
              readOnly
              className="rounded border-[var(--border-default)] bg-[var(--bg-input)] text-indigo-600 focus:ring-0"
            />
            <span className={isChecked ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}>
              {text}
            </span>
          </div>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Bullet lists
        elements.push(
          <li key={index} className="ml-4 list-disc text-xs text-[var(--text-primary)] my-0.5">
            {parseInlineMarkdown(line.replace(/^[-*] /, ''))}
          </li>
        );
      } else if (/^\d+\. /.test(line)) {
        // Numbered lists
        elements.push(
          <li key={index} className="ml-4 list-decimal text-xs text-[var(--text-primary)] my-0.5">
            {parseInlineMarkdown(line.replace(/^\d+\. /, ''))}
          </li>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={index} className="h-2" />);
      } else {
        // Normal paragraph with inline formatting
        elements.push(
          <p key={index} className="text-xs text-[var(--text-secondary)] leading-relaxed my-1">
            {parseInlineMarkdown(line)}
          </p>
        );
      }
    });

    return elements;
  };

  const parseInlineMarkdown = (text: string): React.ReactNode => {
    // Bold: **text**
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-[var(--text-primary)] font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="bg-[var(--bg-input)] text-indigo-600 dark:text-indigo-300 px-1 py-0.5 rounded font-mono text-[11px] border border-[var(--border-subtle)]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[var(--bg-canvas)] select-none text-xs transition-colors">
      {/* Left sidebar: Workspace Docs list */}
      <div className="w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-col justify-between shrink-0">
        <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)]">
          <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span>Workspace Docs ({docs.length})</span>
          </span>
          <button
            onClick={handleCreateDoc}
            className="p-1 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Create New Doc"
          >
            <Plus className="w-4 h-4 text-indigo-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {docs.map((doc) => {
            const isSelected = doc.id === selectedDocId;
            return (
              <button
                key={doc.id}
                onClick={() => {
                  setSelectedDocId(doc.id);
                  setDocTitle(doc.title);
                  setDocContent(doc.content);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-500/30'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{doc.title}</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                  {new Date(doc.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Canvas: Doc Editor & Parsed Viewer */}
      {selectedDocId ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-surface)]">
          {/* Doc Toolbar */}
          <div className="h-12 px-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)] shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[var(--text-muted)] font-bold text-xs uppercase">Title:</span>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="bg-transparent font-bold text-sm text-[var(--text-primary)] outline-none border-b border-transparent focus:border-indigo-500 px-1 truncate max-w-sm"
              />
            </div>

            {/* Mode Switcher & Actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 bg-[var(--bg-input)] border border-[var(--border-default)] p-0.5 rounded-lg">
                <button
                  onClick={() => setMode('preview')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    mode === 'preview' ? 'bg-indigo-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => setMode('edit')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    mode === 'edit' ? 'bg-indigo-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Raw</span>
                </button>
                <button
                  onClick={() => setMode('split')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    mode === 'split' ? 'bg-indigo-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>Split</span>
                </button>
              </div>

              {savedBadge && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </span>
              )}

              <button
                onClick={handleSaveDoc}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={() => handleDeleteDoc(selectedDocId)}
                className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                title="Delete Document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Format Ribbon in Edit/Split Mode */}
          {mode !== 'preview' && (
            <div className="px-6 py-1.5 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] flex items-center gap-2 text-xs">
              <button
                onClick={() => insertFormatting('**', '**')}
                className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold"
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertFormatting('*', '*')}
                className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] italic"
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertFormatting('# ')}
                className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold"
                title="Heading 1"
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertFormatting('## ')}
                className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold"
                title="Heading 2"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertFormatting('- ')}
                className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="Bullet List"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertFormatting('- [ ] ')}
                className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="Task Checkbox"
              >
                <CheckSquare className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertFormatting('```typescript\n', '\n```')}
                className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="Code Block"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Doc Content Viewer / Editor Container */}
          <div className="flex-1 flex overflow-hidden">
            {/* Raw Markdown Editor Pane */}
            {(mode === 'edit' || mode === 'split') && (
              <div className={`p-6 overflow-y-auto ${mode === 'split' ? 'w-1/2 border-r border-[var(--border-subtle)]' : 'w-full max-w-4xl mx-auto'}`}>
                <textarea
                  rows={24}
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="w-full h-full bg-transparent text-[var(--text-primary)] outline-none resize-none font-mono text-xs leading-relaxed"
                  placeholder="Write your markdown content here..."
                />
              </div>
            )}

            {/* Parsed Rich Markdown Preview Pane */}
            {(mode === 'preview' || mode === 'split') && (
              <div className={`p-8 overflow-y-auto ${mode === 'split' ? 'w-1/2 bg-[var(--bg-canvas)]' : 'w-full max-w-4xl mx-auto'}`}>
                <div className="prose max-w-none space-y-1">
                  {renderMarkdown(docContent)}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] space-y-3">
          <BookOpen className="w-10 h-10 text-amber-500/50" />
          <p className="font-semibold text-xs">No document selected. Create or select a document to start reading.</p>
        </div>
      )}
    </div>
  );
};
