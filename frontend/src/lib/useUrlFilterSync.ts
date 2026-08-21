import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  parseUrlFilters,
  buildUrlFilters,
  URL_FILTER_VIEWS,
} from './urlFilters';
import type { Priority, IssueType } from '@kortex/shared';

/**
 * Keep List / Kanban / Spreadsheet filters in the URL query string (DEV-39).
 * URL wins on first load (bookmark/share); thereafter store → replaceState.
 */
export function useUrlFilterSync() {
  const hydrated = useRef(false);
  const {
    activeView,
    filters,
    setActiveView,
    setFilter,
    resetFilters,
  } = useAppStore();

  // Hydrate from URL once
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const snap = parseUrlFilters(window.location.search);
    if (!Object.keys(snap).length) return;

    if (snap.view) setActiveView(snap.view);
    if (snap.search !== undefined) setFilter('search', snap.search);
    if (snap.priority) setFilter('priorities', [snap.priority] as Priority[]);
    if (snap.type) setFilter('issueTypes', [snap.type] as IssueType[]);
    if (snap.sprint === 'backlog') setFilter('sprintId', null);
    else if (snap.sprint) setFilter('sprintId', snap.sprint);
    if (snap.my) setFilter('onlyMyTasks', true);
    if (snap.sort !== undefined) setFilter('sort', snap.sort);
  }, [setActiveView, setFilter]);

  // Write URL when filters/view change (List / Board / Table only)
  useEffect(() => {
    if (!hydrated.current) return;
    const next = URL_FILTER_VIEWS.includes(activeView)
      ? buildUrlFilters({
          view: activeView,
          search: filters.search,
          priorities: filters.priorities,
          issueTypes: filters.issueTypes,
          sprintId: filters.sprintId,
          onlyMyTasks: filters.onlyMyTasks,
          sort: filters.sort,
        })
      : '';
    const path = window.location.pathname + next;
    if (path !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, '', path || window.location.pathname);
    }
  }, [activeView, filters]);

  // Browser back/forward
  useEffect(() => {
    const onPop = () => {
      const snap = parseUrlFilters(window.location.search);
      if (!Object.keys(snap).length) {
        resetFilters();
        return;
      }
      if (snap.view) setActiveView(snap.view);
      setFilter('search', snap.search || '');
      setFilter('priorities', snap.priority ? ([snap.priority] as Priority[]) : []);
      setFilter('issueTypes', snap.type ? ([snap.type] as IssueType[]) : []);
      if (snap.sprint === 'backlog') setFilter('sprintId', null);
      else if (snap.sprint) setFilter('sprintId', snap.sprint);
      else setFilter('sprintId', undefined);
      setFilter('onlyMyTasks', !!snap.my);
      setFilter('sort', snap.sort || '');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [setActiveView, setFilter, resetFilters]);
}
