import { create } from 'zustand';
import type { Activity, ActivityTag } from '../types';
import { DEFAULT_ACTIVITIES } from '../types';
import { generateId } from '../utils/helpers';
import { getAll, putItem, deleteItem } from '../db';

interface ActivityLibraryState {
  activities: Activity[];
  loading: boolean;
  loaded: boolean;
  searchQuery: string;
  selectedTags: ActivityTag[];
  loadActivities: () => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id'>) => Promise<void>;
  updateActivity: (activity: Activity) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
  toggleTag: (tag: ActivityTag) => void;
  getFilteredActivities: () => Activity[];
  initDefaultActivities: () => Promise<void>;
}

export const useActivityLibraryStore = create<ActivityLibraryState>((set, get) => ({
  activities: [],
  loading: false,
  loaded: false,
  searchQuery: '',
  selectedTags: [],

  loadActivities: async () => {
    set({ loading: true });
    let activities = await getAll<Activity>('activities');
    // Migrate old buyLink format to buyLinks
    let migrated = false;
    activities = activities.map(a => {
      if ((a as any).buyLink && !a.buyLinks) {
        migrated = true;
        return { ...a, buyLinks: [{ label: '购买链接', url: (a as any).buyLink }], buyLink: undefined };
      }
      return a;
    });
    if (migrated) {
      for (const a of activities) {
        await putItem('activities', { ...a, buyLink: undefined });
      }
    }
    const existingNames = new Set(activities.map(a => a.name));
    // Inject any default activities that don't exist yet
    let hasNew = false;
    for (const def of DEFAULT_ACTIVITIES) {
      if (!existingNames.has(def.name)) {
        const newAct = { ...def, id: generateId() };
        await putItem('activities', newAct);
        activities.push(newAct);
        hasNew = true;
      }
    }
    if (hasNew) {
      set({ activities, loaded: true, loading: false });
    } else {
      set({
        activities: activities.length > 0 ? activities : DEFAULT_ACTIVITIES.map(a => ({ ...a, id: generateId() })),
        loaded: true,
        loading: false,
      });
    }
  },

  addActivity: async (activity) => {
    const newActivity = { ...activity, id: generateId() };
    await putItem('activities', newActivity);
    set((s) => ({ activities: [...s.activities, newActivity] }));
  },

  updateActivity: async (activity) => {
    await putItem('activities', activity);
    set((s) => ({
      activities: s.activities.map((a) => (a.id === activity.id ? activity : a)),
    }));
  },

  deleteActivity: async (id) => {
    await deleteItem('activities', id);
    set((s) => ({ activities: s.activities.filter((a) => a.id !== id) }));
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  toggleTag: (tag) => {
    set((s) => ({
      selectedTags: s.selectedTags.includes(tag)
        ? s.selectedTags.filter((t) => t !== tag)
        : [...s.selectedTags, tag],
    }));
  },

  getFilteredActivities: () => {
    const { activities, searchQuery, selectedTags } = get();
    return activities.filter((a) => {
      const matchSearch =
        !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => a.tags.includes(tag));
      return matchSearch && matchTags;
    });
  },

  initDefaultActivities: async () => {
    const existing = await getAll<Activity>('activities');
    if (existing.length > 0) return;
    const defaults = DEFAULT_ACTIVITIES.map((a) => ({ ...a, id: generateId() }));
    for (const act of defaults) {
      await putItem('activities', act);
    }
    set({ activities: defaults, loaded: true });
  },
}));
