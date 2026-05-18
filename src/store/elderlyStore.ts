import { create } from 'zustand';
import type { Elderly, ElderlyGroup } from '../types';
import { generateId } from '../utils/helpers';
import { getAll, putItem, deleteItem } from '../db';

interface ElderlyState {
  elderlyList: Elderly[];
  groups: ElderlyGroup[];
  selectedIds: string[];
  loading: boolean;
  loaded: boolean;
  loadElderly: () => Promise<void>;
  addElderly: (elderly: Omit<Elderly, 'id' | 'sortOrder'>) => Promise<void>;
  importElderly: (data: Record<string, string>[], groupName: string) => Promise<void>;
  updateElderly: (elderly: Elderly) => Promise<void>;
  deleteElderly: (id: string) => Promise<void>;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setSortOrder: (list: Elderly[]) => Promise<void>;
  addGroup: (name: string) => Promise<ElderlyGroup>;
  deleteGroup: (id: string) => Promise<void>;
}

export const useElderlyStore = create<ElderlyState>((set, get) => ({
  elderlyList: [],
  groups: [{ id: 'default', name: '默认分组' }],
  selectedIds: [],
  loading: false,
  loaded: false,

  loadElderly: async () => {
    set({ loading: true });
    const [elderly, groups] = await Promise.all([
      getAll<Elderly>('elderly'),
      getAll<ElderlyGroup>('elderlyGroups'),
    ]);
    const finalGroups = groups.length > 0 ? groups : [{ id: 'default', name: '默认分组' }];
    if (groups.length === 0) {
      await putItem('elderlyGroups', finalGroups[0]);
    }
    set({
      elderlyList: elderly.sort((a, b) => a.sortOrder - b.sortOrder),
      groups: finalGroups,
      loaded: true,
      loading: false,
    });
  },

  addElderly: async (data) => {
    const list = get().elderlyList;
    const maxOrder = list.length > 0 ? Math.max(...list.map((e) => e.sortOrder)) : 0;
    const newElderly: Elderly = {
      ...data,
      id: generateId(),
      sortOrder: maxOrder + 1,
    };
    await putItem('elderly', newElderly);
    set((s) => ({ elderlyList: [...s.elderlyList, newElderly] }));
  },

  importElderly: async (data, groupName) => {
    const groups = get().groups;
    let group = groups.find((g) => g.name === groupName);
    if (!group) {
      group = { id: generateId(), name: groupName };
      await putItem('elderlyGroups', group);
      set((s) => ({ groups: [...s.groups, group!] }));
    }

    const list = get().elderlyList;
    let maxOrder = list.length > 0 ? Math.max(...list.map((e) => e.sortOrder)) : 0;
    const newItems: Elderly[] = [];

    const nameKey = Object.keys(data[0]).find(
      (k) => k.includes('姓名') || k.toLowerCase().includes('name')
    );
    const roomKey = Object.keys(data[0]).find(
      (k) => k.includes('房间') || k.includes('房号') || k.toLowerCase().includes('room')
    );

    if (!nameKey) {
      throw new Error('未找到"老人姓名"列，请确认Excel包含该列');
    }

    for (const row of data) {
      maxOrder++;
      const elderly: Elderly = {
        id: generateId(),
        name: String(row[nameKey]).trim(),
        roomNumber: roomKey ? String(row[roomKey] || '').trim() : '',
        groupId: group.id,
        groupName: group.name,
        sortOrder: maxOrder,
      };
      if (elderly.name) {
        newItems.push(elderly);
        await putItem('elderly', elderly);
      }
    }

    set((s) => ({ elderlyList: [...s.elderlyList, ...newItems] }));
  },

  updateElderly: async (elderly) => {
    await putItem('elderly', elderly);
    set((s) => ({
      elderlyList: s.elderlyList.map((e) => (e.id === elderly.id ? elderly : e)),
    }));
  },

  deleteElderly: async (id) => {
    await deleteItem('elderly', id);
    set((s) => ({
      elderlyList: s.elderlyList.filter((e) => e.id !== id),
      selectedIds: s.selectedIds.filter((sid) => sid !== id),
    }));
  },

  toggleSelect: (id) => {
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((i) => i !== id)
        : [...s.selectedIds, id],
    }));
  },

  selectAll: () => {
    set((s) => ({ selectedIds: s.elderlyList.map((e) => e.id) }));
  },

  deselectAll: () => set({ selectedIds: [] }),

  setSortOrder: async (list) => {
    for (let i = 0; i < list.length; i++) {
      const item = { ...list[i], sortOrder: i + 1 };
      await putItem('elderly', item);
    }
    set({ elderlyList: list });
  },

  addGroup: async (name) => {
    const group: ElderlyGroup = { id: generateId(), name };
    await putItem('elderlyGroups', group);
    set((s) => ({ groups: [...s.groups, group] }));
    return group;
  },

  deleteGroup: async (id) => {
    await deleteItem('elderlyGroups', id);
    set((s) => ({
      groups: s.groups.filter((g) => g.id !== id),
      elderlyList: s.elderlyList.map((e) =>
        e.groupId === id ? { ...e, groupId: 'default', groupName: '默认分组' } : e
      ),
    }));
  },
}));
