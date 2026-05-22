/**
 * 云同步服务 — 将本地 IndexedDB 数据同步到 Supabase
 * 策略：双向同步，后写入者覆盖
 */
import { supabase } from './supabaseClient';
import type {
  Activity, Elderly, ElderlyGroup,
  WeeklyPlan, WeeklyPlanCell, ActivityRecord,
} from './types';

/** 需要同步的 store 定义 */
interface SyncStore<T> {
  name: string;
  tableName: string;
  getAll: () => Promise<T[]>;
  putItem: (item: T) => Promise<void>;
}

/** 注册所有要同步的 store */
const syncStores: SyncStore<any>[] = [];

export function registerSyncStore<T>(
  name: string,
  tableName: string,
  getAll: () => Promise<T[]>,
  putItem: (item: T) => Promise<void>,
) {
  syncStores.push({ name, tableName, getAll, putItem });
}

/** 从 Supabase 拉取数据 */
export async function pullFromCloud(store: SyncStore<any>): Promise<number> {
  const { data, error } = await supabase
    .from(store.tableName)
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`拉取 ${store.name} 失败: ${error.message}`);
  if (!data || data.length === 0) return 0;

  for (const row of data) {
    await store.putItem(row.data);
  }
  return data.length;
}

/** 获取当前用户 ID（v2 API 异步获取） */
async function getUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  } catch {
    return null;
  }
}

/** 推送数据到 Supabase */
export async function pushToCloud(store: SyncStore<any>): Promise<number> {
  const items = await store.getAll();
  if (items.length === 0) return 0;

  const userId = await getUserId();
  if (!userId) throw new Error('请先登录后再同步');

  const now = new Date().toISOString();
  const rows = items.map((item: any) => ({
    id: item.id,
    data: item,
    user_id: userId,
    updated_at: now,
  }));

  // Upsert: 用 id 做主键冲突更新
  const { error } = await supabase
    .from(store.tableName)
    .upsert(rows, { onConflict: 'id' });

  if (error) throw new Error(`推送 ${store.name} 失败: ${error.message}`);
  return rows.length;
}

/** 全量同步：先推后拉 */
export async function syncAll(
  onProgress?: (msg: string) => void,
): Promise<{ pushed: number; pulled: number }> {
  let totalPushed = 0;
  let totalPulled = 0;

  for (const store of syncStores) {
    onProgress?.(`同步 ${store.name}...`);

    // 先推送本地数据到云端
    const pushed = await pushToCloud(store);
    totalPushed += pushed;

    // 再拉取云端最新数据到本地
    const pulled = await pullFromCloud(store);
    totalPulled += pulled;
  }

  return { pushed: totalPushed, pulled: totalPulled };
}

/** 检查 Supabase 连接状态（不依赖表权限） */
export async function checkConnection(): Promise<boolean> {
  try {
    // 判断能否访问 Supabase API 服务
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('https://uydyblzlphwnqsfkiuwj.supabase.co/auth/v1/settings', {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true; // 能连上就算成功
  } catch {
    return false;
  }
}

export { type SyncStore };
