import { create } from 'zustand';
import { getAll, putItem } from '../db';

interface VenueState {
  suggestions: string[];
  activityVenues: Record<string, string>; // activityId -> last used venue
  loaded: boolean;
  editing: { slotLabel: string; current: string; onSave: (v: string) => void } | null;

  loadAll: () => Promise<void>;
  addSuggestion: (venue: string) => Promise<void>;
  removeSuggestion: (venue: string) => Promise<void>;
  setActivityVenue: (activityId: string, venue: string) => Promise<void>;
  getActivityVenue: (activityId: string) => string | undefined;
  openVenueEditor: (
    slotLabel: string,
    current: string,
    onSave: (v: string) => void
  ) => void;
  closeVenueEditor: () => void;
}

export const useVenueStore = create<VenueState>((set, get) => ({
  suggestions: ['活动大厅', '多功能厅', '活动室', '手工室', '棋牌室', '阅览室', '户外广场', '花园/阳台', '食堂', '户外公园'],
  activityVenues: {},
  loaded: false,
  editing: null,

  loadAll: async () => {
    const data = await getAll<{ key: string; value: unknown }>('settings');

    const venueSetting = data.find((s: any) => s.key === 'venueSuggestions');
    const activityVenueSetting = data.find((s: any) => s.key === 'activityVenues');
    const defaults = ['活动大厅', '多功能厅', '活动室', '手工室', '棋牌室', '阅览室', '户外广场', '花园/阳台', '食堂', '户外公园'];

    set({
      suggestions: (venueSetting as any)?.venues || defaults,
      activityVenues: (activityVenueSetting as any)?.map || {},
      loaded: true,
    });
  },

  addSuggestion: async (venue) => {
    const list = get().suggestions;
    if (list.includes(venue)) return;
    const newList = [...list, venue];
    await putItem('settings', { key: 'venueSuggestions', venues: newList });
    set({ suggestions: newList });
  },

  removeSuggestion: async (venue) => {
    const newList = get().suggestions.filter((v) => v !== venue);
    await putItem('settings', { key: 'venueSuggestions', venues: newList });
    set({ suggestions: newList });
  },

  setActivityVenue: async (activityId, venue) => {
    const map = { ...get().activityVenues, [activityId]: venue };
    await putItem('settings', { key: 'activityVenues', map });
    set({ activityVenues: map });
  },

  getActivityVenue: (activityId) => get().activityVenues[activityId],

  openVenueEditor: (slotLabel, current, onSave) => {
    set({ editing: { slotLabel, current, onSave } });
  },

  closeVenueEditor: () => set({ editing: null }),
}));
