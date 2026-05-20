/**
 * 文件持久化模块（File System Access API）
 * 
 * 将 IndexedDB 数据同步到用户指定的本地文件，实现浏览器缓存独立持久化。
 * 
 * 使用流程：
 * 1. 用户点击"选择存储位置" → pickFile() → 获得文件句柄
 * 2. 数据变化 → writeAll() → 自动写入文件
 * 3. 重新打开 → checkAndRestore() → 从文件恢复数据
 */

import { openDB } from 'idb';
import { getAll, putItem, clearStore, getDB } from './db';

// ===== 文件句柄存储（用独立的 IndexedDB 数据库，避免和业务数据混淆） =====

const HANDLE_DB = 'yuehuo-file-handle';
const HANDLE_VERSION = 1;

async function getHandleDB() {
  return openDB(HANDLE_DB, HANDLE_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('handle')) {
        db.createObjectStore('handle', { keyPath: 'id' });
      }
    },
  });
}

export async function saveFileHandle(handle: FileSystemFileHandle): Promise<void> {
  const db = await getHandleDB();
  await db.put('handle', { id: 'main', handle });
}

export async function getFileHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await getHandleDB();
    const entry = await db.get('handle', 'main');
    return entry?.handle || null;
  } catch {
    return null;
  }
}

export async function clearFileHandle(): Promise<void> {
  const db = await getHandleDB();
  await db.delete('handle', 'main');
}

// ===== 文件操作 =====

// 数据格式版本
const DATA_VERSION = 1;

export interface ExportedData {
  version: number;
  savedAt: string;
  elderly: Record<string, unknown>[];
  elderlyGroups: Record<string, unknown>[];
  activityRecords: Record<string, unknown>[];
  weeklyPlans: Record<string, unknown>[];
  weeklyPlanCells: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  settings: Record<string, unknown>[];
}

/**
 * 用户选择存储位置（必须由用户手势触发）
 */
export async function pickFile(): Promise<FileSystemFileHandle | null> {
  if (!('showSaveFilePicker' in window)) {
    alert('当前浏览器不支持文件持久化功能，请使用 Chrome 或 Edge 浏览器。');
    return null;
  }
  
  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: '悦活数据.json',
      types: [{
        description: 'JSON 文件',
        accept: { 'application/json': ['.json'] },
      }],
    });
    return handle as FileSystemFileHandle;
  } catch (err: any) {
    if (err.name === 'AbortError') return null; // 用户取消
    console.error('选择文件失败:', err);
    alert('选择文件失败：' + err.message);
    return null;
  }
}

/**
 * 从所有 IndexedDB store 收集数据
 */
export async function collectAllData(): Promise<ExportedData> {
  const [elderly, elderlyGroups, activityRecords, weeklyPlans, weeklyPlanCells, activities, settings] =
    await Promise.all([
      getAll('elderly'),
      getAll('elderlyGroups'),
      getAll('activityRecords'),
      getAll('weeklyPlans'),
      getAll('weeklyPlanCells'),
      getAll('activities'),
      getAll('settings'),
    ]);

  return {
    version: DATA_VERSION,
    savedAt: new Date().toISOString(),
    elderly: elderly as Record<string, unknown>[],
    elderlyGroups: elderlyGroups as Record<string, unknown>[],
    activityRecords: activityRecords as Record<string, unknown>[],
    weeklyPlans: weeklyPlans as Record<string, unknown>[],
    weeklyPlanCells: weeklyPlanCells as Record<string, unknown>[],
    activities: activities as Record<string, unknown>[],
    settings: settings as Record<string, unknown>[],
  };
}

/**
 * 写入 JSON 到文件
 */
async function writeFile(handle: FileSystemFileHandle, data: ExportedData): Promise<void> {
  const writable = await handle.createWritable();
  const json = JSON.stringify(data, null, 2);
  await writable.write(json);
  await writable.close();
}

/**
 * 读取 JSON 从文件
 */
async function readFile(handle: FileSystemFileHandle): Promise<ExportedData | null> {
  const file = await handle.getFile();
  const text = await file.text();
  return JSON.parse(text) as ExportedData;
}

/**
 * 保存所有数据到文件
 */
export async function saveAllToFile(handle: FileSystemFileHandle): Promise<void> {
  const data = await collectAllData();
  await writeFile(handle, data);
}

/**
 * 从文件恢复所有数据到 IndexedDB
 */
export async function restoreFromFile(handle: FileSystemFileHandle): Promise<ExportedData> {
  const data = await readFile(handle);
  if (!data) throw new Error('文件读取失败');

  // 验证版本
  if (data.version !== DATA_VERSION) {
    console.warn(`数据版本不一致: 文件=${data.version}, 期望=${DATA_VERSION}`);
  }

  // 写入 IndexedDB（先清空再写入）
  const storeNames = ['elderly', 'elderlyGroups', 'activityRecords', 'weeklyPlans', 'weeklyPlanCells', 'activities', 'settings'];
  
  for (const storeName of storeNames) {
    await clearStore(storeName);
    const items = data[storeName as keyof ExportedData] as Record<string, unknown>[];
    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');
    for (const item of items) {
      tx.store.put(item);
    }
    await tx.done;
  }

  return data;
}

/**
 * 验证文件句柄是否仍然有效
 */
export async function verifyHandle(handle: FileSystemFileHandle): Promise<boolean> {
  try {
    await handle.getFile();
    return true;
  } catch {
    return false;
  }
}
