/**
 * electronFileStore — Electron 环境下的自动数据持久化
 * 
 * 自动将 IndexedDB 中的数据同步到 app.getPath('userData') 下的 JSON 文件。
 * 无需用户手动选择文件，开箱即用。
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAll, clearStore, getDB } from './db';
import { useElderlyStore } from './store/elderlyStore';
import { useActivityRecordStore } from './store/activityRecordStore';
import { useWeeklyPlanStore } from './store/weeklyPlanStore';
import { useActivityLibraryStore } from './store/activityLibraryStore';
import { useTemplateStore } from './store/templateStore';
import { useVenueStore } from './store/venueStore';
import { useBrandStore } from './store/brandStore';

// ===== 类型定义 =====

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface DesktopStoreState {
  isElectron: boolean;
  dataDir: string;
  dataFile: string;
  syncStatus: SyncStatus;
  lastSyncTime: string;
  fileSize: number;
  recordsCount: number;
}

// ===== 共享状态（模块级单例） =====

let sharedState: DesktopStoreState = {
  isElectron: false,
  dataDir: '',
  dataFile: '',
  syncStatus: 'idle',
  lastSyncTime: '',
  fileSize: 0,
  recordsCount: 0,
};

let listeners: Array<(state: DesktopStoreState) => void> = [];

function notifyListeners() {
  const s = { ...sharedState };
  for (const fn of listeners) fn(s);
}

function setState(partial: Partial<DesktopStoreState>) {
  sharedState = { ...sharedState, ...partial };
  notifyListeners();
}

function subscribe(fn: (state: DesktopStoreState) => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter(f => f !== fn);
  };
}

// ===== IPC 桥接 =====

const api = (window as any).electronAPI as any;

export function isElectron(): boolean {
  return !!(api?.data?.save);
}

// ===== 数据收集 =====

export interface AppData {
  elderly: Record<string, unknown>[];
  elderlyGroups: Record<string, unknown>[];
  activityRecords: Record<string, unknown>[];
  weeklyPlans: Record<string, unknown>[];
  weeklyPlanCells: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  templates: Record<string, unknown>[];
  venues: Record<string, unknown>[];
  brandConfig: Record<string, unknown> | null;
  settings: Record<string, unknown>[];
}

async function collectAllData(): Promise<AppData> {
  const [elderly, elderlyGroups, activityRecords, weeklyPlans, weeklyPlanCells, activities] =
    await Promise.all([
      getAll('elderly'),
      getAll('elderlyGroups'),
      getAll('activityRecords'),
      getAll('weeklyPlans'),
      getAll('weeklyPlanCells'),
      getAll('activities'),
    ]);

  const templates = useTemplateStore.getState().templates || [];
  const venueSuggestions = useVenueStore.getState().suggestions || [];
  const brandConfig = useBrandStore.getState().config || null;

  return {
    elderly: elderly as Record<string, unknown>[],
    elderlyGroups: elderlyGroups as Record<string, unknown>[],
    activityRecords: activityRecords as Record<string, unknown>[],
    weeklyPlans: weeklyPlans as Record<string, unknown>[],
    weeklyPlanCells: weeklyPlanCells as Record<string, unknown>[],
    activities: activities as Record<string, unknown>[],
    templates: templates as unknown as Record<string, unknown>[],
    venues: venueSuggestions as unknown as Record<string, unknown>[],
    brandConfig: brandConfig as unknown as Record<string, unknown> | null,
    settings: [],
  };
}

// ===== 保存到文件 =====

export async function saveToFile(): Promise<boolean> {
  if (!api?.data?.save) return false;

  setState({ syncStatus: 'saving' });
  try {
    const data = await collectAllData();
    const result = await api.data.save(data);
    if (result.ok) {
      setState({ syncStatus: 'saved', lastSyncTime: new Date().toLocaleString('zh-CN') });
      const info = await api.data.info();
      if (info.ok) {
        setState({ fileSize: info.size, recordsCount: data.activityRecords.length, dataDir: info.dataDir });
      }
      return true;
    } else {
      setState({ syncStatus: 'error' });
      return false;
    }
  } catch (err) {
    console.error('保存失败:', err);
    setState({ syncStatus: 'error' });
    return false;
  }
}

// ===== 从文件恢复 =====

export async function restoreFromFile(): Promise<boolean> {
  if (!api?.data?.load) return false;

  try {
    const result = await api.data.load();
    if (!result.ok || !result.data) {
      setState({ lastSyncTime: '首次运行' });
      const info = await api.data.info();
      if (info.ok) setState({ dataDir: info.dataDir });
      return false;
    }

    const data = result.data as AppData;
    const storeNames = ['elderly', 'elderlyGroups', 'activityRecords', 'weeklyPlans', 'weeklyPlanCells', 'activities'] as const;

    for (const storeName of storeNames) {
      const items = data[storeName] as Record<string, unknown>[];
      if (items && items.length > 0) {
        await clearStore(storeName);
        const db = await getDB();
        const tx = db.transaction(storeName, 'readwrite');
        for (const item of items) {
          tx.store.put(item);
        }
        await tx.done;
      }
    }

    // 恢复 Zustand stores（如果有 load 方法）
    if (data.templates?.length) useTemplateStore.getState().loadTemplates?.();
    if (data.venues?.length) useVenueStore.getState().loadAll?.();
    if (data.brandConfig) useBrandStore.getState().loadConfig?.();

    // 通知 stores 刷新
    useElderlyStore.getState().loadElderly();
    useActivityRecordStore.getState().loadRecords();
    useWeeklyPlanStore.getState().loadOrCreatePlan();
    useActivityLibraryStore.getState().loadActivities();

    const info = await api.data.info();
    if (info.ok) {
      setState({
        syncStatus: 'saved',
        lastSyncTime: result.savedAt
          ? new Date(result.savedAt).toLocaleString('zh-CN')
          : '已恢复',
        fileSize: info.size,
        recordsCount: data.activityRecords?.length || 0,
        dataDir: info.dataDir,
      });
    }

    return true;
  } catch (err) {
    console.error('恢复数据失败:', err);
    setState({ syncStatus: 'error' });
    return false;
  }
}

// ===== 初始化 =====

let initialized = false;
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

export async function initDesktopStorage(): Promise<{ state: DesktopStoreState; restored: boolean }> {
  if (initialized) return { state: { ...sharedState }, restored: false };
  initialized = true;

  if (!isElectron()) {
    setState({ isElectron: false });
    return { state: { ...sharedState }, restored: false };
  }

  setState({ isElectron: true });

  // 获取应用信息
  try {
    const appInfo = await api.app.info();
    setState({ dataDir: appInfo.dataFile || '' });
  } catch {}

  // 从文件恢复数据（如果存在）
  const restored = await restoreFromFile();

  // 如无数据文件但有 IndexedDB 数据，立即保存一份
  if (!restored) {
    const elderly = useElderlyStore.getState().elderlyList;
    if (elderly.length > 0) {
      await saveToFile();
    }
  }

  return { state: { ...sharedState }, restored };
}

// ===== React Hook =====

export function useDesktopStore() {
  const [state, setStateLocal] = useState<DesktopStoreState>({ ...sharedState });
  const initRef = useRef(false);

  // 订阅共享状态变化
  useEffect(() => {
    const unsub = subscribe(setStateLocal);
    return unsub;
  }, []);

  // 初始化（仅在 Electron 环境）
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      initDesktopStorage();
    }
  }, []);

  return state;
}

// ===== 自动保存 Hook（在 App.tsx 挂载） =====

export function useAutoSave() {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const state = useDesktopStore();

  // 订阅 store 变化，自动保存
  const elderlyLen = useElderlyStore(s => s.elderlyList.length);
  const groupsLen = useElderlyStore(s => s.groups.length);
  const recordsLen = useActivityRecordStore(s => s.records.length);
  const planId = useWeeklyPlanStore(s => s.currentPlan?.id);
  const activitiesLen = useActivityLibraryStore(s => s.activities.length);

  const doSave = useCallback(async () => {
    if (!isElectron()) return;
    await saveToFile();
  }, []);

  useEffect(() => {
    if (!isElectron()) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(doSave, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [elderlyLen, groupsLen, recordsLen, planId, activitiesLen, doSave]);

  return state;
}
