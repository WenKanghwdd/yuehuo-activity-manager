import { create } from 'zustand';
import type { ActivityRecord, ParticipationStatus } from '../types';
import { generateId } from '../utils/helpers';
import { getAll, putItem, getDB } from '../db';

interface ActivityRecordState {
  records: ActivityRecord[];
  loading: boolean;
  loaded: boolean;
  loadRecords: () => Promise<void>;
  setStatus: (elderlyId: string, date: string, timeSlotId: string, activityName: string, status: ParticipationStatus) => Promise<void>;
  batchSetStatus: (elderlyIds: string[], date: string, timeSlotId: string, activityName: string, status: ParticipationStatus) => Promise<void>;
  getElderlyRecords: (elderlyId: string, startDate: string, endDate: string) => ActivityRecord[];
  cleanupOldRecords: () => Promise<number>;
}

export const useActivityRecordStore = create<ActivityRecordState>((set, get) => ({
  records: [],
  loading: false,
  loaded: false,

  loadRecords: async () => {
    set({ loading: true });
    const records = await getAll<ActivityRecord>('activityRecords');
    set({ records, loaded: true, loading: false });
  },

  setStatus: async (elderlyId, date, timeSlotId, activityName, status) => {
    const existing = get().records.find(
      (r) => r.elderlyId === elderlyId && r.date === date && r.timeSlotId === timeSlotId
    );
    if (existing) {
      const updated = { ...existing, status, activityName };
      await putItem('activityRecords', updated);
      set((s) => ({
        records: s.records.map((r) => (r.id === updated.id ? updated : r)),
      }));
    } else {
      const newRecord: ActivityRecord = {
        id: generateId(),
        elderlyId,
        date,
        timeSlotId,
        activityName,
        status,
      };
      await putItem('activityRecords', newRecord);
      set((s) => ({ records: [...s.records, newRecord] }));
    }
  },

  batchSetStatus: async (elderlyIds, date, timeSlotId, activityName, status) => {
    for (const elderlyId of elderlyIds) {
      await get().setStatus(elderlyId, date, timeSlotId, activityName, status);
    }
  },

  getElderlyRecords: (elderlyId, startDate, endDate) => {
    return get().records.filter(
      (r) =>
        r.elderlyId === elderlyId &&
        r.date >= startDate &&
        r.date <= endDate
    );
  },

  cleanupOldRecords: async () => {
    const all = await getAll<ActivityRecord>('activityRecords');
    const toDelete = all.filter((r) => {
      const d = new Date(r.date);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return d < oneYearAgo;
    });
    if (toDelete.length > 0) {
      const database = await getDB();
      const tx = database.transaction('activityRecords', 'readwrite');
      for (const r of toDelete) {
        tx.store.delete(r.id);
      }
      await tx.done;
    }
    set((s) => ({
      records: s.records.filter((r) => {
        const d = new Date(r.date);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return d >= oneYearAgo;
      }),
    }));
    return toDelete.length;
  },
}));
