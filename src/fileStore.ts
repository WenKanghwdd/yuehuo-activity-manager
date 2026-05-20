/**
 * fileStore — 文件持久化状态管理（全局单例）
 * 
 * 将 useAutoSave 中的共享状态提取为模块级变量，
 * 确保 App 层和 SettingsPage 层的 hook 使用同一份状态。
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getFileHandle, saveFileHandle, clearFileHandle, verifyHandle, pickFile, restoreFromFile } from './fileStorage';
import { useElderlyStore } from './store/elderlyStore';
import { useActivityRecordStore } from './store/activityRecordStore';
import { useWeeklyPlanStore } from './store/weeklyPlanStore';
import { useActivityLibraryStore } from './store/activityLibraryStore';

// ===== 共享状态（模块级单例） =====

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

interface FileStoreState {
  fileHandle: FileSystemFileHandle | null;
  syncStatus: SyncStatus;
  lastSyncTime: string;
}

let sharedState: FileStoreState = {
  fileHandle: null,
  syncStatus: 'idle',
  lastSyncTime: '',
};

let listeners: Array<(state: FileStoreState) => void> = [];

function notifyListeners() {
  for (const fn of listeners) fn({ ...sharedState });
}

function setSharedState(partial: Partial<FileStoreState>) {
  sharedState = { ...sharedState, ...partial };
  notifyListeners();
}

function subscribe(fn: (state: FileStoreState) => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter(f => f !== fn);
  };
}

// ===== 文件操作函数（模块级，供 SettingsPage 调用） =====

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
let currentHandle: FileSystemFileHandle | null = null;

export async function initFileHandle() {
  const handle = await getFileHandle();
  if (handle) {
    const valid = await verifyHandle(handle);
    if (valid) {
      currentHandle = handle;
      setSharedState({ fileHandle: handle, syncStatus: 'idle' });
      return true;
    } else {
      await clearFileHandle();
    }
  }
  return false;
}

export async function pickFileLocation(): Promise<boolean> {
  const handle = await pickFile();
  if (!handle) return false;
  currentHandle = handle;
  await saveFileHandle(handle);
  setSharedState({ fileHandle: handle, syncStatus: 'idle' });
  await writeToFile(handle);
  setSharedState({ syncStatus: 'saved', lastSyncTime: new Date().toLocaleString('zh-CN') });
  return true;
}

export async function disconnectFile() {
  currentHandle = null;
  setSharedState({ fileHandle: null, syncStatus: 'idle', lastSyncTime: '' });
  await clearFileHandle();
}

async function writeToFile(handle: FileSystemFileHandle) {
  setSharedState({ syncStatus: 'saving' });
  try {
    // Collect all data from stores
    const elderly = useElderlyStore.getState().elderlyList;
    const groups = useElderlyStore.getState().groups;
    const records = useActivityRecordStore.getState().records;
    const plan = useWeeklyPlanStore.getState().currentPlan;
    const activities = useActivityLibraryStore.getState().activities;
    
    const data = {
      version: 1,
      savedAt: new Date().toISOString(),
      elderly,
      elderlyGroups: groups,
      activityRecords: records,
      weeklyPlans: plan ? [plan] : [],
      weeklyPlanCells: plan ? Object.values(plan.cells) : [],
      activities,
      settings: [],
    };
    
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    
    setSharedState({ syncStatus: 'saved', lastSyncTime: new Date().toLocaleString('zh-CN') });
  } catch (err) {
    console.error('保存失败:', err);
    setSharedState({ syncStatus: 'error' });
  }
}

export async function restoreFromFileLocation(): Promise<boolean> {
  const handle = await getFileHandle();
  if (!handle) return false;
  const valid = await verifyHandle(handle);
  if (!valid) {
    await clearFileHandle();
    return false;
  }
  try {
    const data = await restoreFromFile(handle);
    useElderlyStore.getState().loadElderly();
    useActivityRecordStore.getState().loadRecords();
    useWeeklyPlanStore.getState().loadOrCreatePlan();
    useActivityLibraryStore.getState().loadActivities();
    setSharedState({ lastSyncTime: new Date().toLocaleString('zh-CN') });
    return true;
  } catch (err) {
    console.error('恢复失败:', err);
    return false;
  }
}

// ===== React Hook（只在 App 层挂载一次） =====

export function useFileStore() {
  const [state, setState] = useState<FileStoreState>({ ...sharedState });
  const initRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = subscribe(setState);
    return unsub;
  }, []);

  // 初始化时检查文件句柄
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      initFileHandle();
    }
  }, []);

  // 订阅 store 变化自动保存
  const elderlyLen = useElderlyStore(s => s.elderlyList.length);
  const groupsLen = useElderlyStore(s => s.groups.length);
  const recordsLen = useActivityRecordStore(s => s.records.length);
  const planId = useWeeklyPlanStore(s => s.currentPlan?.id);
  const activitiesLen = useActivityLibraryStore(s => s.activities.length);

  const doSave = useCallback(async () => {
    if (!currentHandle) return;
    await writeToFile(currentHandle);
  }, []);

  useEffect(() => {
    if (!state.fileHandle) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, 2000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [elderlyLen, groupsLen, recordsLen, planId, activitiesLen, state.fileHandle, doSave]);

  return state;
}
