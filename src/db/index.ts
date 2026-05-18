import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'yihuo-activity-manager';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 活动库
      if (!db.objectStoreNames.contains('activities')) {
        db.createObjectStore('activities', { keyPath: 'id' });
      }
      // 周计划
      if (!db.objectStoreNames.contains('weeklyPlans')) {
        const planStore = db.createObjectStore('weeklyPlans', { keyPath: 'id' });
        planStore.createIndex('weekStart', 'weekStart', { unique: false });
      }
      // 周计划单元格
      if (!db.objectStoreNames.contains('weeklyPlanCells')) {
        const cellStore = db.createObjectStore('weeklyPlanCells', { keyPath: 'id' });
        cellStore.createIndex('planId', 'planId', { unique: false });
        cellStore.createIndex('planId_weekday', ['planId', 'weekday'], { unique: false });
      }
      // 老人信息
      if (!db.objectStoreNames.contains('elderly')) {
        db.createObjectStore('elderly', { keyPath: 'id' });
      }
      // 老人分组
      if (!db.objectStoreNames.contains('elderlyGroups')) {
        db.createObjectStore('elderlyGroups', { keyPath: 'id' });
      }
      // 活动记录
      if (!db.objectStoreNames.contains('activityRecords')) {
        const recordStore = db.createObjectStore('activityRecords', { keyPath: 'id' });
        recordStore.createIndex('elderlyId', 'elderlyId', { unique: false });
        recordStore.createIndex('date', 'date', { unique: false });
        recordStore.createIndex('elderlyId_date', ['elderlyId', 'date'], { unique: false });
      }
      // 设置
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
  
  return dbInstance;
}

export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  return db.getAll(storeName);
}

export async function getByKey<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get(storeName, key);
}

export async function putItem<T>(storeName: string, item: T): Promise<void> {
  const db = await getDB();
  await db.put(storeName, item);
}

export async function deleteItem(storeName: string, key: string): Promise<void> {
  const db = await getDB();
  await db.delete(storeName, key);
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await getDB();
  await db.clear(storeName);
}
