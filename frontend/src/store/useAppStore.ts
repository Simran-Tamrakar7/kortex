import { create } from 'zustand';
import { ViewType, Priority, IssueType } from '@kortex/shared';

export type MainSection = 'PROJECT' | 'DASHBOARDS' | 'DOCS' | 'TIMESHEET' | 'SETTINGS';
export type ThemeMode = 'dark' | 'light';
export type FontFamily = 'inter' | 'jakarta' | 'outfit' | 'roboto' | 'jetbrains' | 'fira';
export type FontSize = 'compact' | 'standard' | 'large' | 'xlarge';
export type DensityMode = 'compact' | 'comfortable';
export type AccentColor = 'indigo' | 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan';

interface FilterState {
  search: string;
  assigneeIds: string[];
  statusIds: string[];
  priorities: Priority[];
  issueTypes: IssueType[];
  sprintId?: string | null;
  onlyMyTasks: boolean;
}

interface ActiveTimer {
  taskId: string;
  taskKey: string;
  taskTitle: string;
  startTimestamp: number;
  elapsedSeconds: number;
  isRunning: boolean;
}

interface AppState {
  activeProjectId: string | null;
  activeView: ViewType;
  activeMainSection: MainSection;
  activeTaskId: string | null;
  selectedTaskIds: string[]; // For bulk actions
  
  // Modals & Drawers
  isCreateTaskOpen: boolean;
  createTaskDefaults: { statusId?: string; sprintId?: string; issueType?: IssueType };
  isCommandPaletteOpen: boolean;
  isOrgSettingsOpen: boolean;
  isProjectSettingsOpen: boolean;
  isSprintModalOpen: boolean;
  sprintModalData: any | null;
  isSprintReportOpen: boolean;
  activeSprintReportId: string | null;
  isTimeModalOpen: boolean;
  isAutomationsOpen: boolean;
  isGuideOpen: boolean;

  // Filters
  filters: FilterState;
  
  // Time tracker stop-watch
  timer: ActiveTimer | null;

  // UI Theme & Typography Settings
  theme: ThemeMode;
  fontFamily: FontFamily;
  fontSize: FontSize;
  fontSizePx: number;
  density: DensityMode;
  accentColor: AccentColor;

  // Actions
  setActiveProjectId: (id: string | null) => void;
  setActiveView: (view: ViewType) => void;
  setActiveMainSection: (section: MainSection) => void;
  setActiveTaskId: (id: string | null) => void;
  setSelectedTaskIds: (ids: string[]) => void;
  toggleSelectTask: (id: string) => void;
  clearSelectedTasks: () => void;

  setCreateTaskOpen: (open: boolean, defaults?: { statusId?: string; sprintId?: string; issueType?: IssueType }) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setOrgSettingsOpen: (open: boolean) => void;
  setProjectSettingsOpen: (open: boolean) => void;
  setSprintModalOpen: (open: boolean, data?: any) => void;
  setSprintReportOpen: (open: boolean, sprintId?: string | null) => void;
  setTimeModalOpen: (open: boolean) => void;
  setAutomationsOpen: (open: boolean) => void;
  setGuideOpen: (open: boolean) => void;

  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;

  startTimer: (task: { id: string; key: string; title: string }) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tickTimer: () => void;

  // Appearance actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: FontSize) => void;
  setFontSizePx: (px: number) => void;
  setDensity: (density: DensityMode) => void;
  setAccentColor: (color: AccentColor) => void;
  initAppearance: () => void;
}

const initialFilters: FilterState = {
  search: '',
  assigneeIds: [],
  statusIds: [],
  priorities: [],
  issueTypes: [],
  sprintId: undefined,
  onlyMyTasks: false,
};

const fontMap: Record<FontFamily, string> = {
  inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  jakarta: "'Plus Jakarta Sans', sans-serif",
  outfit: "'Outfit', sans-serif",
  roboto: "'Roboto', sans-serif",
  jetbrains: "'JetBrains Mono', monospace",
  fira: "'Fira Code', monospace",
};

const sizePxMap: Record<FontSize, number> = {
  compact: 12,
  standard: 14,
  large: 16,
  xlarge: 18,
};

const getStoredAppearance = () => {
  const theme = (localStorage.getItem('kortex_theme') as ThemeMode) || 'light';
  const fontFamily = (localStorage.getItem('kortex_font') as FontFamily) || 'inter';
  const fontSize = (localStorage.getItem('kortex_size') as FontSize) || 'standard';
  const fontSizePx = Number(localStorage.getItem('kortex_sizepx')) || sizePxMap[fontSize] || 14;
  const density = (localStorage.getItem('kortex_density') as DensityMode) || 'comfortable';
  const accentColor = (localStorage.getItem('kortex_accent') as AccentColor) || 'indigo';
  return { theme, fontFamily, fontSize, fontSizePx, density, accentColor };
};

const applyAppearance = (theme: ThemeMode, font: FontFamily, size: FontSize, sizePx?: number) => {
  const root = document.documentElement;
  
  // 1. Theme
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }

  // 2. Set Font Family CSS variable
  const fontCss = fontMap[font] || fontMap.inter;
  root.style.setProperty('--font-family-base', fontCss);

  // 3. Set Font Size CSS variable
  const actualPx = sizePx || sizePxMap[size] || 14;
  root.style.setProperty('--font-size-base', `${actualPx}px`);

  // Classes for helper hooks
  const fontClasses = ['font-family-inter', 'font-family-jetbrains', 'font-family-outfit', 'font-family-jakarta', 'font-family-roboto', 'font-family-fira'];
  fontClasses.forEach((c) => root.classList.remove(c));
  root.classList.add(`font-family-${font}`);

  const sizeClasses = ['text-scale-compact', 'text-scale-standard', 'text-scale-large', 'text-scale-xlarge'];
  sizeClasses.forEach((c) => root.classList.remove(c));
  root.classList.add(`text-scale-${size}`);
};

const initialAppearance = getStoredAppearance();

const getStoredTimer = (): ActiveTimer | null => {
  try {
    const raw = localStorage.getItem('kortex_active_timer');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.taskId) return null;
    
    // If was running, account for background seconds
    if (parsed.isRunning && parsed.lastTick) {
      const extraSeconds = Math.max(0, Math.floor((Date.now() - parsed.lastTick) / 1000));
      return {
        ...parsed,
        elapsedSeconds: (parsed.elapsedSeconds || 0) + extraSeconds,
      };
    }
    return parsed;
  } catch (e) {
    return null;
  }
};

const initialTimer = getStoredTimer();

export const useAppStore = create<AppState>((set, get) => ({
  activeProjectId: 'proj_kor',
  activeView: 'BOARD',
  activeMainSection: 'PROJECT',
  activeTaskId: null,
  selectedTaskIds: [],

  isCreateTaskOpen: false,
  createTaskDefaults: {},
  isCommandPaletteOpen: false,
  isOrgSettingsOpen: false,
  isProjectSettingsOpen: false,
  isSprintModalOpen: false,
  sprintModalData: null,
  isSprintReportOpen: false,
  activeSprintReportId: null,
  isTimeModalOpen: false,
  isAutomationsOpen: false,
  isGuideOpen: false,

  filters: initialFilters,
  timer: initialTimer,

  theme: initialAppearance.theme,
  fontFamily: initialAppearance.fontFamily,
  fontSize: initialAppearance.fontSize,
  fontSizePx: initialAppearance.fontSizePx,
  density: initialAppearance.density,
  accentColor: initialAppearance.accentColor,

  setActiveProjectId: (id) => set({ activeProjectId: id, activeMainSection: 'PROJECT' }),
  setActiveView: (view) => set({ activeView: view }),
  setActiveMainSection: (section) => set({ activeMainSection: section }),
  setActiveTaskId: (id) => set({ activeTaskId: id }),

  setSelectedTaskIds: (ids) => set({ selectedTaskIds: ids }),
  toggleSelectTask: (id) => {
    const current = get().selectedTaskIds;
    if (current.includes(id)) {
      set({ selectedTaskIds: current.filter((x) => x !== id) });
    } else {
      set({ selectedTaskIds: [...current, id] });
    }
  },
  clearSelectedTasks: () => set({ selectedTaskIds: [] }),

  setCreateTaskOpen: (open, defaults = {}) => set({ isCreateTaskOpen: open, createTaskDefaults: defaults }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setOrgSettingsOpen: (open) => set({ isOrgSettingsOpen: open }),
  setProjectSettingsOpen: (open) => set({ isProjectSettingsOpen: open }),
  setSprintModalOpen: (open, data = null) => set({ isSprintModalOpen: open, sprintModalData: data }),
  setSprintReportOpen: (open, sprintId = null) => set({ isSprintReportOpen: open, activeSprintReportId: sprintId }),
  setTimeModalOpen: (open) => set({ isTimeModalOpen: open }),
  setAutomationsOpen: (open) => set({ isAutomationsOpen: open }),
  setGuideOpen: (open) => set({ isGuideOpen: open }),

  setFilter: (key, value) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    }));
  },
  resetFilters: () => set({ filters: initialFilters }),

  startTimer: (task) => {
    const newTimer: ActiveTimer = {
      taskId: task.id,
      taskKey: task.key,
      taskTitle: task.title,
      startTimestamp: Date.now(),
      elapsedSeconds: 0,
      isRunning: true,
    };
    try {
      localStorage.setItem('kortex_active_timer', JSON.stringify({ ...newTimer, lastTick: Date.now() }));
    } catch (e) {}
    set({ timer: newTimer });
  },
  pauseTimer: () => {
    const t = get().timer;
    if (t) {
      const updated = { ...t, isRunning: false };
      try {
        localStorage.setItem('kortex_active_timer', JSON.stringify({ ...updated, lastTick: Date.now() }));
      } catch (e) {}
      set({ timer: updated });
    }
  },
  resumeTimer: () => {
    const t = get().timer;
    if (t) {
      const updated = { ...t, isRunning: true };
      try {
        localStorage.setItem('kortex_active_timer', JSON.stringify({ ...updated, lastTick: Date.now() }));
      } catch (e) {}
      set({ timer: updated });
    }
  },
  stopTimer: () => {
    try {
      localStorage.removeItem('kortex_active_timer');
    } catch (e) {}
    set({ timer: null });
  },
  tickTimer: () => {
    const t = get().timer;
    if (t && t.isRunning) {
      const updated = { ...t, elapsedSeconds: t.elapsedSeconds + 1 };
      try {
        localStorage.setItem('kortex_active_timer', JSON.stringify({ ...updated, lastTick: Date.now() }));
      } catch (e) {}
      set({ timer: updated });
    }
  },

  setTheme: (theme) => {
    localStorage.setItem('kortex_theme', theme);
    applyAppearance(theme, get().fontFamily, get().fontSize, get().fontSizePx);
    set({ theme });
  },

  toggleTheme: () => {
    const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('kortex_theme', next);
    applyAppearance(next, get().fontFamily, get().fontSize, get().fontSizePx);
    set({ theme: next });
  },

  setFontFamily: (fontFamily) => {
    localStorage.setItem('kortex_font', fontFamily);
    applyAppearance(get().theme, fontFamily, get().fontSize, get().fontSizePx);
    set({ fontFamily });
  },

  setFontSize: (fontSize) => {
    const px = sizePxMap[fontSize] || 14;
    localStorage.setItem('kortex_size', fontSize);
    localStorage.setItem('kortex_sizepx', String(px));
    applyAppearance(get().theme, get().fontFamily, fontSize, px);
    set({ fontSize, fontSizePx: px });
  },

  setFontSizePx: (fontSizePx) => {
    localStorage.setItem('kortex_sizepx', String(fontSizePx));
    applyAppearance(get().theme, get().fontFamily, get().fontSize, fontSizePx);
    set({ fontSizePx });
  },

  setDensity: (density) => {
    localStorage.setItem('kortex_density', density);
    set({ density });
  },

  setAccentColor: (accentColor) => {
    localStorage.setItem('kortex_accent', accentColor);
    set({ accentColor });
  },

  initAppearance: () => {
    const { theme, fontFamily, fontSize, fontSizePx } = getStoredAppearance();
    applyAppearance(theme, fontFamily, fontSize, fontSizePx);
  },
}));
