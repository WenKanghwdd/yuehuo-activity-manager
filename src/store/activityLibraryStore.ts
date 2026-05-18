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
    const activities = await getAll<Activity>('activities');
    if (activities.length === 0) {
      // Load default activities
      const defaults = DEFAULT_ACTIVITIES.map(a => ({ ...a, id: generateId() }));
      for (const act of defaults) {
        await putItem('activities', act);
      }
      set({ activities: defaults, loaded: true, loading: false });
    } else {
      set({ activities, loaded: true, loading: false });
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
