import { create } from 'zustand';
import type { WeeklyPlan, WeeklyPlanCell, Weekday, ThemeType, DayTimeConfig, SlotId } from '../types';
import { generateId, getMonday } from '../utils/helpers';
import { DEFAULT_DAY_TIME_CONFIG } from '../types';
import { getAll, putItem } from '../db';

interface WeeklyPlanState {
  currentPlan: WeeklyPlan | null;
  loading: boolean;
  loaded: boolean;
  loadOrCreatePlan: (weekStart?: string) => Promise<void>;
  updateCell: (timeSlotId: string, weekday: Weekday, cell: Partial<Omit<WeeklyPlanCell, 'timeSlotId' | 'weekday'>>) => Promise<void>;
  setTheme: (theme: ThemeType) => Promise<void>;
  setTimeRange: (weekday: Weekday, slotId: SlotId, startTime: string, endTime: string) => Promise<void>;
  batchSetTimeRange: (slotId: SlotId, startTime: string, endTime: string) => Promise<void>;
  setDayNote: (weekday: Weekday, text: string) => Promise<void>;
  batchSetDayNotes: (notes: Record<Weekday, string>) => Promise<void>;
  clearCell: (timeSlotId: string, weekday: Weekday) => Promise<void>;
  getDayTimeConfig: (weekday: Weekday) => DayTimeConfig;
}

export const useWeeklyPlanStore = create<WeeklyPlanState>((set, get) => ({
  currentPlan: null,
  loading: false,
  loaded: false,

  loadOrCreatePlan: async (weekStart?: string) => {
    set({ loading: true });
    const start = weekStart || getMonday();
    
    const allPlans = await getAll<WeeklyPlan>('weeklyPlans');
    let plan = allPlans.find((p) => p.weekStart === start);
    
    if (!plan) {
      // Initialize default timeConfig for all 7 days
      const timeConfig: Record<Weekday, DayTimeConfig> = {
        1: { ...DEFAULT_DAY_TIME_CONFIG },
        2: { ...DEFAULT_DAY_TIME_CONFIG },
        3: { ...DEFAULT_DAY_TIME_CONFIG },
        4: { ...DEFAULT_DAY_TIME_CONFIG },
        5: { ...DEFAULT_DAY_TIME_CONFIG },
        6: { ...DEFAULT_DAY_TIME_CONFIG },
        7: { ...DEFAULT_DAY_TIME_CONFIG },
      };
      const dayNotes = {} as Record<Weekday, string>;
      [1,2,3,4,5,6,7].forEach(d => { dayNotes[d as Weekday] = ''; });
      plan = {
        id: generateId(),
        weekStart: start,
        cells: {},
        timeConfig,
        dayNotes,
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
      imageHeight: existingCell?.imageHeight ?? 60,
      note: existingCell?.note ?? '',
      venue: existingCell?.venue ?? '',
      ...(updates as unknown as Partial<WeeklyPlanCell>),
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

  setTimeRange: async (weekday, slotId, startTime, endTime) => {
    const plan = get().currentPlan;
    if (!plan) return;
    const dayConfig = { ...(plan.timeConfig[weekday] || DEFAULT_DAY_TIME_CONFIG) };
    dayConfig[slotId as SlotId] = { startTime, endTime };
    const timeConfig = { ...plan.timeConfig, [weekday]: dayConfig };
    const updated = { ...plan, timeConfig };
    await putItem('weeklyPlans', updated);
    set({ currentPlan: updated });
  },

  setDayNote: async (weekday, text) => {
    const plan = get().currentPlan;
    if (!plan) return;
    const dayNotes = { ...plan.dayNotes, [weekday]: text };
    const updated = { ...plan, dayNotes };
    await putItem('weeklyPlans', updated);
    set({ currentPlan: updated });
  },

  batchSetDayNotes: async (notes) => {
    const plan = get().currentPlan;
    if (!plan) return;
    const dayNotes = { ...plan.dayNotes, ...notes };
    const updated = { ...plan, dayNotes };
    await putItem('weeklyPlans', updated);
    set({ currentPlan: updated });
  },

  batchSetTimeRange: async (slotId, startTime, endTime) => {
    const plan = get().currentPlan;
    if (!plan) return;
    const timeConfig = { ...plan.timeConfig };
    for (let d = 1; d <= 7; d++) {
      const day = d as Weekday;
      const dayConfig = { ...(timeConfig[day] || DEFAULT_DAY_TIME_CONFIG) };
      dayConfig[slotId as SlotId] = { startTime, endTime };
      timeConfig[day] = dayConfig;
    }
    const updated = { ...plan, timeConfig };
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

  getDayTimeConfig: (weekday) => {
    const plan = get().currentPlan;
    return plan?.timeConfig[weekday] || DEFAULT_DAY_TIME_CONFIG;
  },
}));
