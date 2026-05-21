/**
 * templateStore — 周计划模板管理
 * 模板不涉及图片/附件，纯结构描述，存 IndexedDB settings store
 */

import { create } from 'zustand';
import { getAll, putItem } from '../db';

// ===== 类型定义 =====

export interface TemplateField {
  label: string;
  slotId: string;  // 对应 DEFAULT_TIME_SLOTS 的 id
}

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  timeSlots: TemplateField[];
  weekdays: number;            // 1-7
  hasNotes: boolean;           // 是否有备注行
  hasWeather: boolean;         // 是否有天气提醒
  groupLabels?: string[];      // 分组标签，如 ['一层','二层']
  createdAt: string;
  isPreset: boolean;           // 是否预设模板
}

// ===== 预设模板 =====

const PRESET_TEMPLATES: TemplateConfig[] = [
  {
    id: 'standard',
    name: '标准（上午/下午）',
    description: '两时段 × 七天，适合大多数养老院',
    timeSlots: [
      { label: '上午', slotId: 'morning' },
      { label: '下午', slotId: 'afternoon' },
    ],
    weekdays: 7,
    hasNotes: true,
    hasWeather: true,
    isPreset: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'three-slot',
    name: '三时段（含晚上）',
    description: '上午、下午、晚上三个时段',
    timeSlots: [
      { label: '上午', slotId: 'morning' },
      { label: '下午', slotId: 'afternoon' },
      { label: '晚上', slotId: 'evening' },
    ],
    weekdays: 7,
    hasNotes: true,
    hasWeather: true,
    isPreset: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'grouped',
    name: '按楼层分组',
    description: '分楼层安排活动，每层独立时间段',
    timeSlots: [
      { label: '上午', slotId: 'morning' },
      { label: '下午', slotId: 'afternoon' },
    ],
    weekdays: 7,
    hasNotes: false,
    hasWeather: true,
    groupLabels: ['一层', '二层', '三层'],
    isPreset: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'compact',
    name: '精简版（无备注）',
    description: '只有上午下午，不含备注和天气提醒',
    timeSlots: [
      { label: '上午', slotId: 'morning' },
      { label: '下午', slotId: 'afternoon' },
    ],
    weekdays: 7,
    hasNotes: false,
    hasWeather: false,
    isPreset: true,
    createdAt: '2026-01-01',
  },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ===== Store =====

interface TemplateState {
  templates: TemplateConfig[];
  loaded: boolean;
  currentTemplateId: string;
  loadTemplates: () => Promise<void>;
  addTemplate: (tpl: Omit<TemplateConfig, 'id' | 'createdAt' | 'isPreset'>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  setCurrentTemplate: (id: string) => void;
  getCurrentTemplate: () => TemplateConfig | undefined;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [...PRESET_TEMPLATES],
  loaded: false,
  currentTemplateId: 'standard',

  loadTemplates: async () => {
    const saved = await getAll<any>('settings');
    const tplEntry = saved.find((s: any) => s.key === 'customTemplates');
    const custom = tplEntry?.value || [];
    set({
      templates: [...PRESET_TEMPLATES, ...custom],
      loaded: true,
    });
  },

  addTemplate: async (data) => {
    const custom: TemplateConfig = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      isPreset: false,
    };
    const state = get();
    const existingCustom = state.templates.filter(t => !t.isPreset);
    const newCustom = [...existingCustom, custom];
    await putItem('settings', { key: 'customTemplates', value: newCustom });
    set({ templates: [...PRESET_TEMPLATES, ...newCustom] });
  },

  deleteTemplate: async (id) => {
    const state = get();
    const existingCustom = state.templates.filter(t => !t.isPreset);
    const filtered = existingCustom.filter(t => t.id !== id);
    await putItem('settings', { key: 'customTemplates', value: filtered });
    set({ templates: [...PRESET_TEMPLATES, ...filtered] });
    // Reset to preset if current was deleted
    if (get().currentTemplateId === id) {
      set({ currentTemplateId: 'standard' });
    }
  },

  setCurrentTemplate: (id) => {
    set({ currentTemplateId: id });
  },

  getCurrentTemplate: () => {
    const state = get();
    return state.templates.find(t => t.id === state.currentTemplateId);
  },
}));
