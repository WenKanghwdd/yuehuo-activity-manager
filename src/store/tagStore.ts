import { create } from 'zustand';
import { getAll, putItem } from '../db';
import { ACTIVITY_TAGS } from '../types';
import type { ActivityTag } from '../types';

export interface TagConfig {
  name: string;
  color: string; // hex color for accent
  bgColor: string; // light bg for chip
}

const DEFAULT_TAG_COLORS: Record<string, TagConfig> = {
  '运动健身': { name: '运动健身', color: '#16a34a', bgColor: '#dcfce7' },
  '手工制作': { name: '手工制作', color: '#e91e63', bgColor: '#fce4ec' },
  '文娱欣赏': { name: '文娱欣赏', color: '#7c3aed', bgColor: '#f3e8ff' },
  '外出游玩': { name: '外出游玩', color: '#2563eb', bgColor: '#dbeafe' },
  '节气养生': { name: '节气养生', color: '#059669', bgColor: '#d1fae5' },
  '益智游戏': { name: '益智游戏', color: '#d97706', bgColor: '#fef3c7' },
  '音乐舞蹈': { name: '音乐舞蹈', color: '#db2777', bgColor: '#fdf2f8' },
  '节庆活动': { name: '节庆活动', color: '#dc2626', bgColor: '#fef2f2' },
};

interface TagState {
  tags: Record<string, TagConfig>;
  loaded: boolean;
  customTags: string[];
  hiddenTags: string[];
  tagDisplayNames: Record<string, string>;
  loadTags: () => Promise<void>;
  getTagConfig: (tagName: string) => TagConfig;
  getDisplayName: (tagName: string) => string;
  updateTagColor: (tagName: string, color: string, bgColor: string) => Promise<void>;
  addCustomTag: (name: string, color: string) => Promise<void>;
  removeCustomTag: (name: string) => Promise<void>;
  toggleHiddenTag: (name: string) => Promise<void>;
  renameTag: (oldName: string, newName: string) => Promise<void>;
}  

export const useTagStore = create<TagState>((set, get) => ({
  tags: { ...DEFAULT_TAG_COLORS },
  loaded: false,
  customTags: [],
  hiddenTags: [],
  tagDisplayNames: {},

  loadTags: async () => {
    const data = await getAll<{ key: string; value: unknown }>('settings');
    const saved = data.find((s: any) => s.key === 'tagColors') as any;
    const custom = data.find((s: any) => s.key === 'customTags') as any;
    const hidden = data.find((s: any) => s.key === 'hiddenTags') as any;
    const displayNames = data.find((s: any) => s.key === 'tagDisplayNames') as any;
    set({
      tags: saved?.colors ? { ...DEFAULT_TAG_COLORS, ...saved.colors } : { ...DEFAULT_TAG_COLORS },
      customTags: custom?.list || [],
      hiddenTags: hidden?.list || [],
      tagDisplayNames: displayNames?.map || {},
      loaded: true,
    });
  },

  getTagConfig: (tagName) => {
    return get().tags[tagName] || { name: tagName, color: '#e67414', bgColor: '#fff0dd' };
  },

  getDisplayName: (tagName) => {
    return get().tagDisplayNames[tagName] || tagName;
  },

  updateTagColor: async (tagName, color, bgColor) => {
    const tags = { ...get().tags, [tagName]: { name: tagName, color, bgColor } };
    await putItem('settings', { key: 'tagColors', colors: tags });
    set({ tags });
  },

  addCustomTag: async (name, color) => {
    const tags = { ...get().tags, [name]: { name, color, bgColor: color + '20' } };
    const customTags = [...get().customTags, name];
    await putItem('settings', { key: 'tagColors', colors: tags });
    await putItem('settings', { key: 'customTags', list: customTags });
    set({ tags, customTags });
  },

  removeCustomTag: async (name) => {
    const tags = { ...get().tags };
    delete tags[name];
    const customTags = get().customTags.filter(t => t !== name);
    await putItem('settings', { key: 'tagColors', colors: tags });
    await putItem('settings', { key: 'customTags', list: customTags });
    set({ tags, customTags });
  },

  toggleHiddenTag: async (name) => {
    const hiddenTags = get().hiddenTags.includes(name)
      ? get().hiddenTags.filter(t => t !== name)
      : [...get().hiddenTags, name];
    await putItem('settings', { key: 'hiddenTags', list: hiddenTags });
    set({ hiddenTags });
  },

  renameTag: async (oldName, newName) => {
    const tagDisplayNames = { ...get().tagDisplayNames, [oldName]: newName };
    await putItem('settings', { key: 'tagDisplayNames', map: tagDisplayNames });
    set({ tagDisplayNames });
  },
}));
