// ===== 活动库类型 =====
export interface Activity {
  id: string;
  name: string;
  tags: ActivityTag[];
  images: string[]; // base64 strings
  description: string;
  venue: string;
  equipment: string[];
  minStaff: number;
  safetyTips: string;
  buyLink: string;
}

export type ActivityTag =
  | '运动健身'
  | '手工制作'
  | '文娱欣赏'
  | '外出游玩'
  | '节气养生'
  | '益智游戏'
  | '音乐舞蹈'
  | '节庆活动';

// ===== 时间段 =====
export interface TimeSlot {
  id: string;
  label: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

// ===== 周计划 =====
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface WeeklyPlanCell {
  timeSlotId: string;
  weekday: Weekday;
  activityId: string | null;
  customText: string;
  imageBase64: string | null;
  note: string;
}

export interface WeeklyPlan {
  id: string;
  weekStart: string; // ISO date string (Monday)
  cells: Record<string, WeeklyPlanCell>; // key: `${timeSlotId}-${weekday}`
  theme: ThemeType;
}

export type ThemeType = 'default' | 'springFestival' | 'qingming' | 'winterSolstice' | 'midAutumn' | 'dragonBoat' | 'nationalDay';

export interface ThemeConfig {
  key: ThemeType;
  label: string;
  bg: string;
  border: string;
  headerBg: string;
  headerText: string;
  cellBg: string;
  cellText: string;
  accent: string;
}

// ===== 老人 =====
export interface Elderly {
  id: string;
  name: string;
  roomNumber: string;
  groupId: string;
  groupName: string;
  sortOrder: number;
}

export interface ElderlyGroup {
  id: string;
  name: string;
}

// ===== 活动记录 =====
export type ParticipationStatus = 'participated' | 'not_participated' | 'unmarked';

export interface ActivityRecord {
  id: string;
  elderlyId: string;
  date: string; // ISO date
  timeSlotId: string;
  activityName: string;
  status: ParticipationStatus;
}

// ===== 默认时间段 =====
export const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: 'morning-1', label: '上午 08:00-09:00', startTime: '08:00', endTime: '09:00' },
  { id: 'morning-2', label: '上午 09:00-10:00', startTime: '09:00', endTime: '10:00' },
  { id: 'morning-3', label: '上午 10:00-11:00', startTime: '10:00', endTime: '11:00' },
  { id: 'noon', label: '中午 11:00-12:00', startTime: '11:00', endTime: '12:00' },
  { id: 'afternoon-1', label: '下午 14:00-15:00', startTime: '14:00', endTime: '15:00' },
  { id: 'afternoon-2', label: '下午 15:00-16:00', startTime: '15:00', endTime: '16:00' },
  { id: 'afternoon-3', label: '下午 16:00-17:00', startTime: '16:00', endTime: '17:00' },
  { id: 'evening', label: '晚上 18:00-19:30', startTime: '18:00', endTime: '19:30' },
];

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
};

// ===== 主题配置 =====
export const THEME_CONFIGS: Record<ThemeType, ThemeConfig> = {
  default: {
    key: 'default',
    label: '默认风格',
    bg: '#fef7f0',
    border: '#fde0b8',
    headerBg: '#e67414',
    headerText: '#ffffff',
    cellBg: '#ffffff',
    cellText: '#4a3728',
    accent: '#e67414',
  },
  springFestival: {
    key: 'springFestival',
    label: '春节·红金',
    bg: '#fff5f5',
    border: '#fecaca',
    headerBg: '#dc2626',
    headerText: '#ffffff',
    cellBg: '#fff7ed',
    cellText: '#7f1d1d',
    accent: '#b91c1c',
  },
  qingming: {
    key: 'qingming',
    label: '清明·青绿',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    headerBg: '#16a34a',
    headerText: '#ffffff',
    cellBg: '#f0fdf4',
    cellText: '#14532d',
    accent: '#15803d',
  },
  winterSolstice: {
    key: 'winterSolstice',
    label: '冬至·蓝白',
    bg: '#f0f9ff',
    border: '#bae6fd',
    headerBg: '#0284c7',
    headerText: '#ffffff',
    cellBg: '#f8fafc',
    cellText: '#0c4a6e',
    accent: '#0369a1',
  },
  midAutumn: {
    key: 'midAutumn',
    label: '中秋·金桂',
    bg: '#fffbeb',
    border: '#fde68a',
    headerBg: '#d97706',
    headerText: '#ffffff',
    cellBg: '#fff7ed',
    cellText: '#713f12',
    accent: '#b45309',
  },
  dragonBoat: {
    key: 'dragonBoat',
    label: '端午·青艾',
    bg: '#f0fdf4',
    border: '#86efac',
    headerBg: '#15803d',
    headerText: '#ffffff',
    cellBg: '#f0fdf4',
    cellText: '#166534',
    accent: '#16a34a',
  },
  nationalDay: {
    key: 'nationalDay',
    label: '国庆·中国红',
    bg: '#fef2f2',
    border: '#fca5a5',
    headerBg: '#b91c1c',
    headerText: '#ffffff',
    cellBg: '#fff7ed',
    cellText: '#7f1d1d',
    accent: '#dc2626',
  },
};

export const ACTIVITY_TAGS: ActivityTag[] = [
  '运动健身',
  '手工制作',
  '文娱欣赏',
  '外出游玩',
  '节气养生',
  '益智游戏',
  '音乐舞蹈',
  '节庆活动',
];

// ===== 预设活动库 =====
export const DEFAULT_ACTIVITIES: Omit<Activity, 'id'>[] = [
  {
    name: '太极晨练',
    tags: ['运动健身', '节气养生'],
    images: [],
    description: '清晨太极拳锻炼，适合各年龄层老人，促进血液循环，增强平衡能力。',
    venue: '户外广场 / 活动大厅',
    equipment: ['太极服（可选）', '太极剑（可选）'],
    minStaff: 1,
    safetyTips: '注意地面防滑；高血压老人量力而行；建议穿舒适运动鞋。',
    buyLink: 'https://s.taobao.com/search?q=太极服老人',
  },
  {
    name: '剪纸手工',
    tags: ['手工制作', '节庆活动'],
    images: [],
    description: '传统剪纸艺术活动，锻炼手部精细动作和创造力。',
    venue: '活动室',
    equipment: ['彩纸', '剪刀', '胶水', '剪纸图案模板'],
    minStaff: 1,
    safetyTips: '使用剪刀时注意安全；可提供安全剪刀；完成后展示作品增强成就感。',
    buyLink: 'https://s.taobao.com/search?q=剪纸材料包老人',
  },
  {
    name: '红歌合唱',
    tags: ['文娱欣赏', '音乐舞蹈'],
    images: [],
    description: '经典红歌合唱活动，激发爱国情怀，促进社交互动。',
    venue: '多功能厅',
    equipment: ['音响设备', '麦克风', '歌词单', '投影仪'],
    minStaff: 1,
    safetyTips: '控制活动时长不超过1小时；注意音量适中；体弱老人可坐着参与。',
    buyLink: 'https://s.taobao.com/search?q=老人合唱团歌词本',
  },
  {
    name: '公园散步',
    tags: ['外出游玩', '运动健身'],
    images: [],
    description: '组织老人到附近公园散步，呼吸新鲜空气，亲近自然。',
    venue: '附近公园',
    equipment: ['饮用水', '急救包', '折叠凳', '遮阳帽'],
    minStaff: 3,
    safetyTips: '⚠️ 外出活动需提前报名并获得家属同意；随行配备急救箱；注意交通安全；关注天气情况。',
    buyLink: 'https://s.taobao.com/search?q=老人外出便携折叠凳',
  },
  {
    name: '节气养生讲座',
    tags: ['节气养生', '文娱欣赏'],
    images: [],
    description: '结合二十四节气讲解养生知识，帮助老人科学养生。',
    venue: '活动室 / 多媒体室',
    equipment: ['投影仪', '讲稿', '茶水点心'],
    minStaff: 1,
    safetyTips: '内容通俗易懂；控制时长45-60分钟；鼓励提问互动。',
    buyLink: 'https://s.taobao.com/search?q=二十四节气养生书',
  },
  {
    name: '棋牌对弈',
    tags: ['益智游戏'],
    images: [],
    description: '象棋、围棋、扑克等棋牌活动，锻炼思维能力。',
    venue: '棋牌室',
    equipment: ['象棋', '围棋', '扑克', '桌布', '计时器'],
    minStaff: 1,
    safetyTips: '注意久坐提醒；每30分钟建议起身活动；避免激烈竞争情绪。',
    buyLink: 'https://s.taobao.com/search?q=老人象棋围棋套装',
  },
  {
    name: '手势舞练习',
    tags: ['音乐舞蹈', '运动健身'],
    images: [],
    description: '简单手势舞配合音乐，促进手脑协调，愉悦心情。',
    venue: '活动大厅',
    equipment: ['音响', '投影屏幕', '手势舞教学视频'],
    minStaff: 1,
    safetyTips: '动作不宜过快；坐姿完成更安全；鼓励但不强迫参与。',
    buyLink: 'https://s.taobao.com/search?q=手势舞教学视频素材',
  },
  {
    name: '园艺种植',
    tags: ['手工制作', '节气养生'],
    images: [],
    description: '在花园或阳台种植花草蔬菜，亲近自然，心情愉悦。',
    venue: '花园 / 阳台',
    equipment: ['花盆', '土壤', '种子/幼苗', '浇水壶', '园艺手套'],
    minStaff: 1,
    safetyTips: '注意防滑；避免使用尖锐工具；对花粉过敏者注意防护。',
    buyLink: 'https://s.taobao.com/search?q=老人园艺种植套装',
  },
  {
    name: '电影欣赏',
    tags: ['文娱欣赏'],
    images: [],
    description: '经典老电影或纪录片放映，丰富精神文化生活。',
    venue: '多功能厅',
    equipment: ['投影仪', '音响', '幕布', '茶水点心'],
    minStaff: 1,
    safetyTips: '选择正能量主题；控制观影时长不超过2小时；中场安排休息。',
    buyLink: 'https://s.taobao.com/search?q=经典老电影DVD合集',
  },
  {
    name: '包饺子活动',
    tags: ['手工制作', '节庆活动'],
    images: [],
    description: '集体包饺子活动，传统美食与社交互动相结合。',
    venue: '食堂 / 活动室',
    equipment: ['面粉', '馅料', '擀面杖', '面板', '保鲜膜'],
    minStaff: 2,
    safetyTips: '注意食品卫生；防止烫伤；对食物过敏者留意配料。',
    buyLink: 'https://s.taobao.com/search?q=老人包饺子工具套装',
  },
];
