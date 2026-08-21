import { create } from 'zustand';
import { User, Organization, Workspace } from '@kortex/shared';
import { apiClient } from '../api/client';
import { socketService } from '../api/socket';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, orgName?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setActiveWorkspaceId: (workspaceId: string) => void;
  updateUser: (data: Partial<User>) => void;
  renameOrganization: (name: string) => void;
  createWorkspace: (name: string) => Workspace;
  renameWorkspace: (id: string, name: string) => void;
  deleteWorkspace: (id: string) => { ok: boolean; error?: string };
}

const ORG_META_KEY = 'kortex_org_meta';

function loadOrgMeta(): { organization?: Organization; workspaces?: Workspace[]; activeWorkspaceId?: string | null } | null {
  try {
    const raw = localStorage.getItem(ORG_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistOrgMeta(partial: {
  organization?: Organization | null;
  workspaces?: Workspace[];
  activeWorkspaceId?: string | null;
}) {
  try {
    const prev = loadOrgMeta() || {};
    localStorage.setItem(
      ORG_META_KEY,
      JSON.stringify({
        organization: partial.organization ?? prev.organization,
        workspaces: partial.workspaces ?? prev.workspaces,
        activeWorkspaceId: partial.activeWorkspaceId ?? prev.activeWorkspaceId,
      })
    );
  } catch {
    /* ignore */
  }
}

// Fallback demo users for instant offline/Vercel login
const demoUsersMap: Record<string, { user: User; role: string }> = {
  'alex@kortex.dev': {
    user: {
      id: 'usr_alex',
      email: 'alex@kortex.dev',
      name: 'Alex Rivera',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      timezone: 'America/New_York',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    role: 'OWNER',
  },
  'maya@kortex.dev': {
    user: {
      id: 'usr_maya',
      email: 'maya@kortex.dev',
      name: 'Maya Lin',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      timezone: 'America/Los_Angeles',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    role: 'ADMIN',
  },
  'jordan@kortex.dev': {
    user: {
      id: 'usr_jordan',
      email: 'jordan@kortex.dev',
      name: 'Jordan Smith',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      timezone: 'Europe/London',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    role: 'MEMBER',
  },
  'devon@kortex.dev': {
    user: {
      id: 'usr_devon',
      email: 'devon@kortex.dev',
      name: 'Devon Vance',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      timezone: 'America/Chicago',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    role: 'MEMBER',
  },
  'priya@kortex.dev': {
    user: {
      id: 'usr_priya',
      email: 'priya@kortex.dev',
      name: 'Priya Patel',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      timezone: 'Asia/Kolkata',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    role: 'MEMBER',
  },
  'cursor@kortex.dev': {
    user: {
      id: 'usr_cursor',
      email: 'cursor@kortex.dev',
      name: 'Cursor',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cursor',
      timezone: 'UTC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    role: 'MEMBER',
  },
  'antigravity@kortex.dev': {
    user: {
      id: 'usr_antigravity',
      email: 'antigravity@kortex.dev',
      name: 'Antigravity',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=antigravity',
      timezone: 'UTC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    role: 'MEMBER',
  },
};

const fallbackOrg: Organization = {
  id: 'org_acme',
  name: 'Acme Global Innovations',
  slug: 'acme-global',
  plan: 'ENTERPRISE',
  ownerId: 'usr_alex',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fallbackWorkspaces: Workspace[] = [
  {
    id: 'ws_dev',
    orgId: 'org_acme',
    name: 'Product Development',
    slug: 'product-dev',
    description: 'Primary product development space for Kortex core platform and AI agents',
    icon: 'Layers',
    color: '#6366f1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ws_eng',
    orgId: 'org_acme',
    name: 'Engineering & Product',
    slug: 'eng-product',
    description: 'Core product engineering, sprint planning, and architecture',
    icon: 'Cpu',
    color: '#6366f1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ws_ops',
    orgId: 'org_acme',
    name: 'Operations & IT Support',
    slug: 'ops-it',
    description: 'Internal service desk, SLAs, and customer operations',
    icon: 'LifeBuoy',
    color: '#10b981',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const savedMeta = loadOrgMeta();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: demoUsersMap['alex@kortex.dev'].user,
  organization: savedMeta?.organization || fallbackOrg,
  workspaces: savedMeta?.workspaces?.length ? savedMeta.workspaces : fallbackWorkspaces,
  activeWorkspaceId: savedMeta?.activeWorkspaceId || fallbackWorkspaces[0].id,
  isAuthenticated: true,
  isLoading: false,

  login: async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { user, organization, workspaces, token } = res.data;
      localStorage.setItem('kortex_token', token);
      localStorage.setItem('kortex_user_email', email);

      const initialWorkspaceId = workspaces.length > 0 ? workspaces[0].id : null;
      set({
        user,
        organization,
        workspaces,
        activeWorkspaceId: initialWorkspaceId,
        isAuthenticated: true,
        isLoading: false,
      });

      try {
        socketService.connect();
        if (initialWorkspaceId) {
          socketService.joinWorkspace(initialWorkspaceId);
        }
      } catch (e) {}
    } catch (err) {
      // Fallback: If backend is offline or on static Vercel host, log in using demo seed profile
      const demoProfile = demoUsersMap[email.toLowerCase()] || {
        user: {
          id: `usr_${Date.now()}`,
          email,
          name: email.split('@')[0],
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          timezone: 'UTC',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        role: 'OWNER',
      };

      const token = `demo_token_${Date.now()}`;
      localStorage.setItem('kortex_token', token);
      localStorage.setItem('kortex_user_email', email);

      set({
        user: demoProfile.user,
        organization: fallbackOrg,
        workspaces: fallbackWorkspaces,
        activeWorkspaceId: fallbackWorkspaces[0].id,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  },

  register: async (email, password, name, orgName) => {
    try {
      const res = await apiClient.post('/auth/register', { email, password, name, orgName });
      const { user, organization, workspaces, token } = res.data;
      localStorage.setItem('kortex_token', token);
      localStorage.setItem('kortex_user_email', email);

      const initialWorkspaceId = workspaces.length > 0 ? workspaces[0].id : null;
      set({
        user,
        organization,
        workspaces,
        activeWorkspaceId: initialWorkspaceId,
        isAuthenticated: true,
        isLoading: false,
      });

      try {
        socketService.connect();
        if (initialWorkspaceId) {
          socketService.joinWorkspace(initialWorkspaceId);
        }
      } catch (e) {}
    } catch (err) {
      // Fallback registration
      const newUser: User = {
        id: `usr_${Date.now()}`,
        email,
        name: name || email.split('@')[0],
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        timezone: 'UTC',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const newOrg: Organization = {
        id: `org_${Date.now()}`,
        name: orgName || 'My Organization',
        slug: 'my-org',
        plan: 'ENTERPRISE',
        ownerId: newUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const token = `demo_token_${Date.now()}`;
      localStorage.setItem('kortex_token', token);
      localStorage.setItem('kortex_user_email', email);

      set({
        user: newUser,
        organization: newOrg,
        workspaces: fallbackWorkspaces,
        activeWorkspaceId: fallbackWorkspaces[0].id,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  },

  logout: () => {
    localStorage.removeItem('kortex_token');
    localStorage.removeItem('kortex_user_email');
    set({
      user: demoUsersMap['alex@kortex.dev'].user,
      organization: fallbackOrg,
      workspaces: fallbackWorkspaces,
      activeWorkspaceId: fallbackWorkspaces[0].id,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('kortex_token');
    const savedEmail = localStorage.getItem('kortex_user_email') || 'alex@kortex.dev';

    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const res = await apiClient.get('/auth/me');
      const { user, organization, workspaces } = res.data;
      const initialWorkspaceId = workspaces.length > 0 ? workspaces[0].id : null;

      set({
        user,
        organization,
        workspaces,
        activeWorkspaceId: initialWorkspaceId,
        isAuthenticated: true,
        isLoading: false,
      });

      try {
        socketService.connect();
        if (initialWorkspaceId) {
          socketService.joinWorkspace(initialWorkspaceId);
        }
      } catch (e) {}
    } catch (err) {
      // Restore demo session if token exists
      const demoProfile = demoUsersMap[savedEmail.toLowerCase()] || demoUsersMap['alex@kortex.dev'];
      set({
        user: demoProfile.user,
        organization: fallbackOrg,
        workspaces: fallbackWorkspaces,
        activeWorkspaceId: fallbackWorkspaces[0].id,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  },

  setActiveWorkspaceId: (workspaceId: string) => {
    const current = get().activeWorkspaceId;
    if (current) {
      try {
        socketService.leaveWorkspace(current);
      } catch (e) {}
    }
    try {
      socketService.joinWorkspace(workspaceId);
    } catch (e) {}
    persistOrgMeta({ activeWorkspaceId: workspaceId });
    set({ activeWorkspaceId: workspaceId });
  },

  updateUser: (data: Partial<User>) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...data } });
    }
  },

  renameOrganization: (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    const org = get().organization;
    if (!org) return;
    const organization = { ...org, name: clean, updatedAt: new Date().toISOString() };
    persistOrgMeta({ organization });
    set({ organization });
  },

  createWorkspace: (name: string) => {
    const clean = name.trim() || 'New Branch';
    const ws: Workspace = {
      id: `ws_${Date.now()}`,
      orgId: get().organization?.id || 'org_acme',
      name: clean,
      slug: clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40),
      description: '',
      icon: 'Layers',
      color: '#6366f1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const workspaces = [...get().workspaces, ws];
    persistOrgMeta({ workspaces, activeWorkspaceId: ws.id });
    set({ workspaces, activeWorkspaceId: ws.id });
    return ws;
  },

  renameWorkspace: (id: string, name: string) => {
    const clean = name.trim();
    if (!clean) return;
    const workspaces = get().workspaces.map((w) =>
      w.id === id ? { ...w, name: clean, updatedAt: new Date().toISOString() } : w
    );
    persistOrgMeta({ workspaces });
    set({ workspaces });
  },

  deleteWorkspace: (id: string) => {
    const list = get().workspaces;
    if (list.length <= 1) {
      return { ok: false, error: 'You must keep at least one branch.' };
    }
    const workspaces = list.filter((w) => w.id !== id);
    let activeWorkspaceId = get().activeWorkspaceId;
    if (activeWorkspaceId === id) {
      activeWorkspaceId = workspaces[0]?.id || null;
    }
    persistOrgMeta({ workspaces, activeWorkspaceId });
    set({ workspaces, activeWorkspaceId });
    return { ok: true };
  },
}));
