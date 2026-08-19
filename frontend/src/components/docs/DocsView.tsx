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
} from 'lucide-react';

export const DocsView: React.FC = () => {
  const { activeWorkspaceId } = useAuthStore();
  const { activeProjectId } = useAppStore();
  const queryClient = useQueryClient();

  const { data: docs = [], isLoading } = useDocs(activeWorkspaceId || undefined, activeProjectId);

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

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
        content: '# Untitled Document\n\nStart drafting your product spec, runbook, or meeting notes...',
      });
      queryClient.invalidateQueries({ queryKey: ['docs'] });
      setSelectedDocId(res.data.id);
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

  return (
    <div className="flex-1 flex overflow-hidden bg-[#090e18] select-none text-xs">
      {/* Left sidebar: Docs list */}
      <div className="w-64 border-r border-[#1e293b] bg-[#0c121e] flex flex-col justify-between shrink-0">
        <div className="p-3 border-b border-[#1e293b] flex items-center justify-between">
          <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Workspace Docs ({docs.length})</span>
          </span>
          <button
            onClick={handleCreateDoc}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
            title="Create New Doc"
          >
            <Plus className="w-3.5 h-3.5" />
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
                className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-amber-500/15 text-amber-300 font-semibold border-l-2 border-amber-500'
                    : 'text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{doc.title}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(doc.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Canvas: Doc Editor */}
      {selectedDocId ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0e1626]">
          {/* Doc Toolbar */}
          <div className="h-12 px-6 border-b border-[#1e293b] flex items-center justify-between bg-[#131d31]/80">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">Doc Title:</span>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="bg-transparent font-bold text-sm text-slate-100 outline-none border-b border-transparent focus:border-indigo-500 px-1"
              />
            </div>

            <div className="flex items-center gap-2">
              {savedBadge && (
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </span>
              )}
              <button
                onClick={handleSaveDoc}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Document'}</span>
              </button>
              <button
                onClick={() => handleDeleteDoc(selectedDocId)}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg"
                title="Delete Document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Doc Editor Textarea */}
          <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full">
            <textarea
              rows={24}
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              className="w-full h-full bg-transparent text-slate-200 outline-none resize-none font-mono text-xs leading-relaxed"
              placeholder="Write your markdown content here..."
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2">
          <BookOpen className="w-8 h-8 text-slate-600" />
          <p>No document selected. Create or select a document to start writing.</p>
        </div>
      )}
    </div>
  );
};
