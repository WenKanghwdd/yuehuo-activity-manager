import { create } from 'zustand';
import type { Staff, StaffMonthSchedule } from '../types';
import { generateId } from '../utils/helpers';
import { getAll, putItem, deleteItem } from '../db';

interface StaffState {
  staffList: Staff[];
  schedules: StaffMonthSchedule[];
  loading: boolean;
  loaded: boolean;
  loadStaff: () => Promise<void>;
  addStaff: (staff: Omit<Staff, 'id'>) => Promise<void>;
  updateStaff: (staff: Staff) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  getSchedule: (staffId: string, year: number, month: number) => StaffMonthSchedule | undefined;
  setDayShift: (staffId: string, year: number, month: number, day: number, value: '上班' | '休息') => Promise<void>;
  copyPrevMonth: (staffId: string, year: number, month: number) => Promise<void>;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staffList: [],
  schedules: [],
  loading: false,
  loaded: false,

  loadStaff: async () => {
    set({ loading: true });
    const [staff, schedules] = await Promise.all([
      getAll<Staff>('staff'),
      getAll<StaffMonthSchedule>('staffSchedules'),
    ]);
    set({ staffList: staff, schedules, loading: false, loaded: true });
  },

  addStaff: async (staff) => {
    const item: Staff = { ...staff, id: generateId() };
    await putItem('staff', item);
    set((s) => ({ staffList: [...s.staffList, item] }));
  },

  updateStaff: async (staff) => {
    await putItem('staff', staff);
    set((s) => ({ staffList: s.staffList.map((e) => (e.id === staff.id ? staff : e)) }));
  },

  deleteStaff: async (id) => {
    await deleteItem('staff', id);
    set((s) => ({ staffList: s.staffList.filter((e) => e.id !== id) }));
  },

  getSchedule: (staffId, year, month) => {
    return get().schedules.find(
      (s) => s.staffId === staffId && s.year === year && s.month === month
    );
  },

  setDayShift: async (staffId, year, month, day, value) => {
    const id = `${year}-${month}-${staffId}`;
    let schedule = get().schedules.find((s) => s.id === id);
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (!schedule) {
      schedule = { id, staffId, year, month, schedule: {} };
      schedule.schedule[dateKey] = value;
      await putItem('staffSchedules', schedule);
      set((s) => ({ schedules: [...s.schedules, schedule!] }));
    } else {
      schedule.schedule[dateKey] = value;
      await putItem('staffSchedules', schedule);
      set((s) => ({
        schedules: s.schedules.map((s2) => (s2.id === id ? schedule! : s2)),
      }));
    }
  },

  copyPrevMonth: async (staffId, year, month) => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevSchedule = get().schedules.find(
      (s) => s.staffId === staffId && s.year === prevYear && s.month === prevMonth
    );
    if (!prevSchedule) return;

    const daysInPrev = new Date(prevYear, prevMonth, 0).getDate();
    const id = `${year}-${month}-${staffId}`;
    const newSchedule: StaffMonthSchedule = {
      id, staffId, year, month, schedule: {},
    };

    // 按日期映射（同月日数不同时只复制存在的天数）
    for (let d = 1; d <= 31; d++) {
      const prevKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (prevSchedule.schedule[prevKey]) {
        const newKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        newSchedule.schedule[newKey] = prevSchedule.schedule[prevKey];
      }
    }

    await putItem('staffSchedules', newSchedule);
    set((s) => ({
      schedules: [
        ...s.schedules.filter((s2) => s2.id !== id),
        newSchedule,
      ],
    }));
  },
}));
