import React, { useState } from 'react';
import { useAppStore, FontFamily, FontSize, DensityMode, AccentColor, ThemeMode } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../api/client';
import { Avatar } from '../common/Avatar';
import {
  X,
  Users,
  CreditCard,
  Key,
  Webhook,
  Plus,
  Trash2,
  Check,
  Github,
  Sun,
  Moon,
  Type,
  Palette,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const OrgSettingsModal: React.FC = () => {
  const {
    isOrgSettingsOpen,
    setOrgSettingsOpen,
    activeProjectId,
    theme,
    setTheme,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    density,
    setDensity,
    accentColor,
    setAccentColor,
  } = useAppStore();

  const { organization, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'members' | 'appearance' | 'billing' | 'apikeys' | 'integrations'>('appearance');
  const [members, setMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  // GitHub simulator
  const [ghCommitMsg, setGhCommitMsg] = useState('feat: complete SVG curves Fixes #KOR-10');
  const [ghAction, setGhAction] = useState('merged');
  const [ghResult, setGhResult] = useState<string | null>(null);

  // Fetch org members & api keys
  React.useEffect(() => {
    if (isOrgSettingsOpen && organization) {
      apiClient.get(`/orgs/${organization.id}`).then((res) => {
        setMembers(res.data.members || []);
      });
      apiClient.get('/auth/api-keys').then((res) => {
        setApiKeys(res.data || []);
      });
    }
  }, [isOrgSettingsOpen, organization]);

  if (!isOrgSettingsOpen || !organization) return null;

  const fontOptions: { id: FontFamily; label: string; preview: string; fontClass: string }[] = [
    { id: 'inter', label: 'Inter', preview: 'Modern & crisp UI typeface', fontClass: 'font-family-inter' },
    { id: 'jakarta', label: 'Plus Jakarta Sans', preview: 'Clean geometric curves', fontClass: 'font-family-jakarta' },
    { id: 'outfit', label: 'Outfit', preview: 'Distinctive contemporary display', fontClass: 'font-family-outfit' },
    { id: 'roboto', label: 'Roboto', preview: 'Balanced enterprise standard', fontClass: 'font-family-roboto' },
    { id: 'jetbrains', label: 'JetBrains Mono', preview: 'Engineering & developer code', fontClass: 'font-family-jetbrains' },
    { id: 'fira', label: 'Fira Code', preview: 'Technical monospace design', fontClass: 'font-family-fira' },
  ];

  const sizeOptions: { id: FontSize; label: string; desc: string }[] = [
    { id: 'compact', label: 'Compact', desc: 'Dense 12px base (maximum data visibility)' },
    { id: 'standard', label: 'Standard', desc: 'Comfortable 13.5px base (recommended)' },
    { id: 'large', label: 'Large', desc: 'Spacious 15px base (enhanced legibility)' },
  ];

  const accentOptions: { id: AccentColor; label: string; hex: string }[] = [
    { id: 'indigo', label: 'Indigo', hex: '#6366f1' },
    { id: 'violet', label: 'Violet', hex: '#8b5cf6' },
    { id: 'emerald', label: 'Emerald', hex: '#10b981' },
    { id: 'rose', label: 'Rose', hex: '#f43f5e' },
    { id: 'amber', label: 'Amber', hex: '#f59e0b' },
    { id: 'cyan', label: 'Cyan', hex: '#0ea5e9' },
  ];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      const res = await apiClient.post(`/orgs/${organization.id}/invite`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setMembers([...members, res.data]);
      setInviteEmail('');
    } catch (e) {
      alert('Failed to invite member');
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    await apiClient.put(`/orgs/${organization.id}/members/${memberId}`, { role });
    setMembers(members.map((m) => (m.id === memberId ? { ...m, role } : m)));
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Remove this member?')) {
      await apiClient.delete(`/orgs/${organization.id}/members/${memberId}`);
      setMembers(members.filter((m) => m.id !== memberId));
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    const res = await apiClient.post('/auth/api-keys', { name: newKeyName.trim() });
    setApiKeys([res.data, ...apiKeys]);
    setCreatedKey(res.data.key);
    setNewKeyName('');
  };

  const handleDeleteApiKey = async (id: string) => {
    await apiClient.delete(`/auth/api-keys/${id}`);
    setApiKeys(apiKeys.filter((k) => k.id !== id));
  };

  const handleSimulateGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId) return;
    try {
      const res = await apiClient.post('/integrations/github/webhook', {
        projectId: activeProjectId,
        commitMessage: ghCommitMsg,
        action: ghAction,
        author: 'Jordan Smith',
      });
      setGhResult(res.data.message);
      setTimeout(() => setGhResult(null), 4000);
    } catch (e) {
      alert('GitHub simulation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-3xl bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 max-h-[88vh] flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
              {organization.name}
            </span>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Preferences & Settings</h3>
          </div>
          <button
            onClick={() => setOrgSettingsOpen(false)}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-semibold ${
              activeTab === 'appearance'
                ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Appearance & Fonts</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-semibold ${
              activeTab === 'members'
                ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members & Roles</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-semibold ${
              activeTab === 'billing'
                ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Plan & Billing</span>
          </button>

          <button
            onClick={() => setActiveTab('apikeys')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-semibold ${
              activeTab === 'apikeys'
                ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys</span>
          </button>

          <button
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-semibold ${
              activeTab === 'integrations'
                ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>GitHub & Slack Sync</span>
          </button>
        </div>

        {/* Tab: Appearance & Fonts */}
        {activeTab === 'appearance' && (
          <div className="flex-1 overflow-y-auto space-y-6 text-xs pr-1">
            {/* 1. Theme Selector */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Color Theme Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all text-left ${
                    theme === 'light'
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                      : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">Light Mode</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">Clean, high-contrast daytime interface</p>
                    </div>
                  </div>
                  {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all text-left ${
                    theme === 'dark'
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                      : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">Dark Mode (Linear Theme)</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">Sleek midnight dark aesthetic</p>
                    </div>
                  </div>
                  {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                </button>
              </div>
            </div>

            {/* 2. Font Family Selection */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Application Font Family
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {fontOptions.map((f) => {
                  const isSelected = fontFamily === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFontFamily(f.id)}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all text-left ${f.fontClass} ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                          : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-bold text-sm text-[var(--text-primary)]">{f.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)]">{f.preview}</p>
                      <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] font-mono">
                        ABCDEFGHIJK 12345
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Font Size Scaling */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Display Font Size Scaling
              </label>
              <div className="grid grid-cols-3 gap-3">
                {sizeOptions.map((s) => {
                  const isSelected = fontSize === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFontSize(s.id)}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all text-left ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                          : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-bold text-xs text-[var(--text-primary)]">{s.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)]">{s.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Density & Accent */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-subtle)]">
              {/* Density */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  UI Layout Density
                </label>
                <div className="flex gap-2">
                  {(['comfortable', 'compact'] as DensityMode[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDensity(d)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                        density === d
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300'
                          : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Theme Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {accentOptions.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAccentColor(a.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        accentColor === a.id ? 'scale-125 ring-2 ring-offset-2 ring-[var(--border-active)]' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: a.hex }}
                      title={a.label}
                    >
                      {accentColor === a.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Members */}
        {activeTab === 'members' && (
          <div className="flex-1 overflow-y-auto space-y-4 text-xs">
            {/* Invite Form */}
            <form onSubmit={handleInvite} className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] flex gap-2">
              <input
                type="email"
                required
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              >
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
                <option value="GUEST">Guest</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow"
              >
                Invite
              </button>
            </form>

            {/* Members Table */}
            <div className="border border-[var(--border-default)] rounded-xl overflow-hidden divide-y divide-[var(--border-subtle)]">
              {members.map((m) => (
                <div key={m.id} className="p-3 bg-[var(--bg-surface)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.user?.name} avatarUrl={m.user?.avatarUrl} size="sm" />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{m.user?.name}</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">{m.user?.email || m.invitedEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
                    >
                      <option value="OWNER">Owner</option>
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                      <option value="GUEST">Guest</option>
                      <option value="VIEWER">Viewer</option>
                    </select>

                    {m.userId !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="p-1 text-[var(--text-muted)] hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Billing */}
        {activeTab === 'billing' && (
          <div className="flex-1 overflow-y-auto space-y-4 text-xs">
            <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-indigo-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-indigo-500 font-bold uppercase">Current Tier</span>
                <h4 className="text-base font-bold text-[var(--text-primary)] mt-0.5">{organization.plan} Plan</h4>
                <p className="text-[var(--text-secondary)] text-xs">Includes unlimited projects, sprints, automation rules, and webhooks.</p>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-semibold rounded-full border border-emerald-500/40">
                Active Subscription
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {['TEAM', 'BUSINESS', 'ENTERPRISE'].map((plan) => (
                <div
                  key={plan}
                  className={`p-4 rounded-xl border ${
                    organization.plan === plan
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500'
                      : 'bg-[var(--bg-surface)] border-[var(--border-default)]'
                  }`}
                >
                  <h5 className="font-bold text-[var(--text-primary)]">{plan}</h5>
                  <p className="text-[var(--text-secondary)] text-[11px] mt-1">
                    {plan === 'ENTERPRISE'
                      ? 'Custom SLA, SSO SAML 2.0, Audit logs'
                      : 'Unlimited automations and agile charts'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: API Keys */}
        {activeTab === 'apikeys' && (
          <div className="flex-1 overflow-y-auto space-y-4 text-xs">
            <form onSubmit={handleCreateApiKey} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Token Name (e.g. CI/CD Pipeline)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
              >
                Generate Token
              </button>
            </form>

            {createdKey && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs space-y-1">
                <span className="font-semibold text-emerald-300">Generated API Key (Copy now):</span>
                <p className="font-mono text-emerald-200 break-all">{createdKey}</p>
              </div>
            )}

            <div className="space-y-2">
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{k.name}</p>
                    <p className="font-mono text-[11px] text-[var(--text-muted)]">{k.key.slice(0, 12)}...</p>
                  </div>
                  <button
                    onClick={() => handleDeleteApiKey(k.id)}
                    className="text-[var(--text-muted)] hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Integrations */}
        {activeTab === 'integrations' && (
          <div className="flex-1 overflow-y-auto space-y-4 text-xs">
            <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] space-y-3">
              <div className="flex items-center gap-2">
                <Github className="w-5 h-5 text-[var(--text-primary)]" />
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)]">GitHub / GitLab Webhook Simulator</h4>
                  <p className="text-[var(--text-secondary)] text-[11px]">
                    Auto-transition issues when PRs are merged or commits reference task keys (e.g. #KOR-10).
                  </p>
                </div>
              </div>

              {ghResult && (
                <div className="p-2.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-medium">
                  {ghResult}
                </div>
              )}

              <form onSubmit={handleSimulateGitHub} className="space-y-2">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Commit Message / PR Title</label>
                  <input
                    type="text"
                    value={ghCommitMsg}
                    onChange={(e) => setGhCommitMsg(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <select
                    value={ghAction}
                    onChange={(e) => setGhAction(e.target.value)}
                    className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--text-primary)]"
                  >
                    <option value="merged">Action: PR Merged (Moves to Done)</option>
                    <option value="opened">Action: PR Opened (Moves to Code Review)</option>
                  </select>

                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium shadow"
                  >
                    Simulate Webhook Payload
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
