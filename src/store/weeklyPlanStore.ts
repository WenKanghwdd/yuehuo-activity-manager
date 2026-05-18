import { create } from 'zustand';
import type { WeeklyPlan, WeeklyPlanCell, Weekday, ThemeType } from '../types';
import { generateId, getMonday } from '../utils/helpers';
import { getAll, putItem } from '../db';

interface WeeklyPlanState {
  currentPlan: WeeklyPlan | null;
  loading: boolean;
  loaded: boolean;
  loadOrCreatePlan: (weekStart?: string) => Promise<void>;
  updateCell: (timeSlotId: string, weekday: Weekday, cell: Partial<WeeklyPlanCell>) => Promise<void>;
  setTheme: (theme: ThemeType) => Promise<void>;
  clearCell: (timeSlotId: string, weekday: Weekday) => Promise<void>;
}

export const useWeeklyPlanStore = create<WeeklyPlanState>((set, get) => ({
  currentPlan: null,
  loading: false,
  loaded: false,

  loadOrCreatePlan: async (weekStart?: string) => {
    set({ loading: true });
    const start = weekStart || getMonday();
    
    // Try to find existing plan for this week
    const allPlans = await getAll<WeeklyPlan>('weeklyPlans');
    let plan = allPlans.find((p) => p.weekStart === start);
    
    if (!plan) {
      plan = {
        id: generateId(),
        weekStart: start,
        cells: {},
        theme: 'default',
      };
      await putItem('weeklyPlans', plan);
    }

    set({ currentPlan: plan, loaded: true, loading: false });
  },

  updateCell: async (timeSlotId, weekday, updates) => {
    const plan = get().currentPlan;
    if (!plan) return;

    const key = `${timeSlotId}-${weekday}`;
    const existingCell = plan.cells[key];
    const updatedCell: WeeklyPlanCell = {
      timeSlotId,
      weekday,
      activityId: existingCell?.activityId ?? null,
      customText: existingCell?.customText ?? '',
      imageBase64: existingCell?.imageBase64 ?? null,
      note: existingCell?.note ?? '',
      ...updates,
    };

    const newCells = { ...plan.cells, [key]: updatedCell };
    const updatedPlan = { ...plan, cells: newCells };
    await putItem('weeklyPlans', updatedPlan);
    set({ currentPlan: updatedPlan });
  },

  setTheme: async (theme) => {
    const plan = get().currentPlan;
    if (!plan) return;
    const updated = { ...plan, theme };
    await putItem('weeklyPlans', updated);
    set({ currentPlan: updated });
  },

  clearCell: async (timeSlotId, weekday) => {
    const plan = get().currentPlan;
    if (!plan) return;
    const key = `${timeSlotId}-${weekday}`;
    const newCells = { ...plan.cells };
    delete newCells[key];
    const updated = { ...plan, cells: newCells };
    await putItem('weeklyPlans', updated);
    set({ currentPlan: updated });
  },
}));
