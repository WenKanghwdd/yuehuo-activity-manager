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
  buyLinks?: { label: string; url: string }[];
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

export interface CellActivityItem {
  activityId: string;
  venue: string;
  startTime?: string; // HH:mm，第二活动的自定义开始时间
  endTime?: string;   // HH:mm，第二活动的自定义结束时间
}

export interface WeeklyPlanCell {
  timeSlotId: string;
  weekday: Weekday;
  activityId: string | null;
  customText: string;
  imageBase64: string | null;
  imageHeight: number; // 图片显示高度 px
  imageOffsetX: number; // 图片裁剪偏移 X (%)
  imageOffsetY: number; // 图片裁剪偏移 Y (%)
  note: string;
  venue: string; // 可自定义的场所
  extraActivities?: CellActivityItem[]; // 额外活动列表（同一时段可排多个活动）
}

export interface WeeklyPlan {
  id: string;
  weekStart: string; // ISO date string (Monday)
  cells: Record<string, WeeklyPlanCell>; // key: `${timeSlotId}-${weekday}`
  timeConfig: Record<Weekday, DayTimeConfig>; // per-day time range overrides
  theme: ThemeType;
  dayNotes: Record<Weekday, string>; // 每天备注/提醒
  weatherReminder: string; // 天气变化提醒
}

export type ThemeType = 'default' | 'springFestival' | 'qingming' | 'winterSolstice' | 'midAutumn' | 'dragonBoat' | 'nationalDay' | 'summerOcean' | 'mintMatcha' | 'oxygenForest' | 'peachOolong' | 'twilightWisteria';

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

// ===== 长者 =====
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

// ===== 员工排班 =====
export interface Staff {
  id: string;
  name: string;
  position: string; // 职位：经理/社工/实习生...
}

/** 按月排班，key = 'YYYY-MM-DD' */
export type StaffSchedule = Record<string, '上班' | '休息'>;

/** 某月某员工排班数据 */
export interface StaffMonthSchedule {
  id: string; // `${year}-${month}-${staffId}`
  staffId: string;
  year: number;
  month: number; // 1-12
  schedule: StaffSchedule;
}

// ===== 默认时间段（早中晚各一个，时间可调） =====
export type SlotId = 'morning' | 'afternoon' | 'evening';

export const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: 'morning', label: '上午', startTime: '08:00', endTime: '11:00' },
  { id: 'afternoon', label: '下午', startTime: '14:00', endTime: '17:00' },
];

// 每天各时段的自定义时间范围
export type DayTimeConfig = Record<SlotId, { startTime: string; endTime: string }>;

export const DEFAULT_DAY_TIME_CONFIG: DayTimeConfig = {
  morning: { startTime: '08:00', endTime: '11:00' },
  afternoon: { startTime: '14:00', endTime: '17:00' },
  evening: { startTime: '18:00', endTime: '20:00' },
};

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
  summerOcean: {
    key: 'summerOcean',
    label: '夏日·碧海',
    bg: '#F8FAE7',
    border: '#D0ECF4',
    headerBg: '#315BB8',
    headerText: '#ffffff',
    cellBg: '#F8FAE7',
    cellText: '#315BB8',
    accent: '#7DAFDD',
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
  mintMatcha: {
    key: 'mintMatcha',
    label: '薄荷奶绿',
    bg: '#F2FBF5',
    border: '#C4E4D0',
    headerBg: '#8FC9A6',
    headerText: '#ffffff',
    cellBg: '#F2FBF5',
    cellText: '#2D5A3E',
    accent: '#6DB08A',
  },
  oxygenForest: {
    key: 'oxygenForest',
    label: '多氧森林',
    bg: '#EFFBF4',
    border: '#A3DDB8',
    headerBg: '#4EA770',
    headerText: '#ffffff',
    cellBg: '#EFFBF4',
    cellText: '#1B5E30',
    accent: '#3B8A5A',
  },
  peachOolong: {
    key: 'peachOolong',
    label: '蜜桃乌龙',
    bg: '#FEF6F5',
    border: '#F8D0CC',
    headerBg: '#F2A7A0',
    headerText: '#ffffff',
    cellBg: '#FEF6F5',
    cellText: '#7A3D38',
    accent: '#E8877E',
  },
  twilightWisteria: {
    key: 'twilightWisteria',
    label: '暮色紫藤',
    bg: '#F7F4FB',
    border: '#D5C9E4',
    headerBg: '#A98BCD',
    headerText: '#ffffff',
    cellBg: '#F7F4FB',
    cellText: '#4A3566',
    accent: '#9372B8',
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
    description: '清晨太极拳锻炼，适合各年龄层长者，促进血液循环，增强平衡能力。',
    venue: '户外广场 / 活动大厅',
    equipment: ['太极服（可选）', '太极剑（可选）'],
    minStaff: 1,
    safetyTips: '注意地面防滑；高血压长者量力而行；建议穿舒适运动鞋。',
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
  },
  {
    name: '红歌合唱',
    tags: ['文娱欣赏', '音乐舞蹈'],
    images: [],
    description: '经典红歌合唱活动，激发爱国情怀，促进社交互动。',
    venue: '多功能厅',
    equipment: ['音响设备', '麦克风', '歌词单', '投影仪'],
    minStaff: 1,
    safetyTips: '控制活动时长不超过1小时；注意音量适中；体弱长者可坐着参与。',
  },
  {
    name: '公园散步',
    tags: ['外出游玩', '运动健身'],
    images: [],
    description: '组织长者到附近公园散步，呼吸新鲜空气，亲近自然。',
    venue: '附近公园',
    equipment: ['饮用水', '急救包', '折叠凳', '遮阳帽'],
    minStaff: 3,
    safetyTips: '⚠️ 外出活动需提前报名并获得家属同意；随行配备急救箱；注意交通安全；关注天气情况。',
  },
  {
    name: '节气养生讲座',
    tags: ['节气养生', '文娱欣赏'],
    images: [],
    description: '结合二十四节气讲解养生知识，帮助长者科学养生。',
    venue: '活动室 / 多媒体室',
    equipment: ['投影仪', '讲稿', '茶水点心'],
    minStaff: 1,
    safetyTips: '内容通俗易懂；控制时长45-60分钟；鼓励提问互动。',
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
  },
  {
    name: '书法练习',
    tags: ['手工制作', '文娱欣赏'],
    images: [],
    description: '毛笔书法练习，修身养性，锻炼手部精细动作。',
    venue: '活动室',
    equipment: ['毛笔', '宣纸', '墨汁', '砚台', '字帖'],
    minStaff: 1,
    safetyTips: '注意桌椅高度适宜；避免墨汁洒落；完成后展示作品。',
  },
  {
    name: '手指操',
    tags: ['运动健身', '益智游戏'],
    images: [],
    description: '简单手指操练习，促进手脑协调，预防认知退化。',
    venue: '活动大厅',
    equipment: ['手指操图谱', '音乐播放器'],
    minStaff: 1,
    safetyTips: '动作由慢到快；坐姿完成；注意关节保护。',
  },
  {
    name: '广场舞',
    tags: ['音乐舞蹈', '运动健身'],
    images: [],
    description: '简单广场舞教学，锻炼身体，促进社交互动。',
    venue: '户外广场 / 活动大厅',
    equipment: ['音响', '教学视频', '舒适运动鞋'],
    minStaff: 1,
    safetyTips: '注意地面平整；根据长者身体状况调整动作强度；备好饮用水。',
  },
  {
    name: '手工串珠',
    tags: ['手工制作'],
    images: [],
    description: '用彩珠串制手链、项链等饰品，锻炼手部灵活性。',
    venue: '手工室',
    equipment: ['彩珠', '弹力线', '剪刀', '收纳盒'],
    minStaff: 1,
    safetyTips: '注意珠子防吞食；提供放大镜辅助；可两人一组协作完成。',
  },
  {
    name: '拼图比赛',
    tags: ['益智游戏'],
    images: [],
    description: '分组拼图比赛，锻炼观察力和团队协作能力。',
    venue: '活动室',
    equipment: ['拼图板', '计时器', '计分板'],
    minStaff: 1,
    safetyTips: '选择大块拼图方便长者操作；控制时间避免疲劳。',
  },
  {
    name: '春季踏青',
    tags: ['外出游玩', '节气养生'],
    images: [],
    description: '组织长者到郊外或公园春游，感受自然风光。',
    venue: '郊外公园/景区',
    equipment: ['饮用水', '应急药品', '遮阳帽', '折叠椅', '点名册'],
    minStaff: 4,
    safetyTips: '⚠️ 外出活动须填写外出申请表；一对一陪护行动不便长者；携带急救箱；关注天气预报。',
  },
  {
    name: '折纸艺术',
    tags: ['手工制作'],
    images: [],
    description: '折纸活动，折叠千纸鹤、花朵等，锻炼手指灵活度。',
    venue: '活动室',
    equipment: ['彩色折纸', '图纸', '胶水'],
    minStaff: 1,
    safetyTips: '选择大尺寸折纸方便操作；分步骤教学；鼓励互相帮助。',
  },
  {
    name: '健康讲座',
    tags: ['节气养生', '文娱欣赏'],
    images: [],
    description: '邀请医生或健康专家开展常见病预防与保健知识讲座。',
    venue: '多功能厅',
    equipment: ['投影仪', '讲座PPT', '麦克风', '座椅排列整齐'],
    minStaff: 1,
    safetyTips: '内容通俗易懂；控制时长45分钟；预留提问时间。',
  },
  {
    name: '健身气功八段锦',
    tags: ['运动健身', '节气养生'],
    images: [],
    description: '八段锦养生功法练习，调节气血，强身健体。',
    venue: '户外广场 / 活动大厅',
    equipment: ['教学视频', '音响', '瑜伽垫(可选)'],
    minStaff: 1,
    safetyTips: '动作柔和循序渐进；有严重骨质疏松者量力而行；建议空腹或饭后一小时练习。',
  },
  {
    name: '诗词朗诵会',
    tags: ['文娱欣赏'],
    images: [],
    description: '经典古诗词朗诵，感受传统文化魅力。',
    venue: '活动室',
    equipment: ['诗集', '麦克风', '背景音乐', '座椅'],
    minStaff: 1,
    safetyTips: '鼓励自愿参与；选择积极正面诗词；可分组轮读。',
  },
  {
    name: '端午节包粽子',
    tags: ['手工制作', '节庆活动'],
    images: [],
    description: '传统端午节包粽子活动，传承文化，增进感情。',
    venue: '食堂',
    equipment: ['糯米', '粽叶', '馅料', '棉线', '大盆'],
    minStaff: 2,
    safetyTips: '注意食品卫生；粽子煮熟后分发；糖尿病人提供无糖选项。',
  },
  {
    name: '猜灯谜',
    tags: ['益智游戏', '节庆活动'],
    images: [],
    description: '挂灯笼猜灯谜，趣味益智，营造节日氛围。',
    venue: '活动大厅',
    equipment: ['灯笼', '谜语纸条', '小礼品', '展板'],
    minStaff: 1,
    safetyTips: '谜语难度适中；准备小奖品增加积极性；注意场地照明。',
  },
  {
    name: '回忆录写作',
    tags: ['文娱欣赏', '手工制作'],
    images: [],
    description: '引导长者回忆人生经历，编写个人回忆录或口述历史。',
    venue: '阅览室',
    equipment: ['笔记本', '笔', '录音设备(可选)', '老照片(自带)'],
    minStaff: 1,
    safetyTips: '营造轻松氛围；尊重个人隐私；可安排志愿者协助记录。',
  },
  {
    name: '数字油画',
    tags: ['手工制作', '文娱欣赏'],
    images: [],
    description: '按数字填色油画创作，零基础也能完成美丽画作。',
    venue: '手工室',
    equipment: ['数字油画套装', '画笔', '调色盘', '围裙'],
    minStaff: 1,
    safetyTips: '选择大号画布方便操作；提供老花镜；完成后装裱展示。',
  },
  {
    name: '养生气功',
    tags: ['运动健身', '节气养生'],
    images: [],
    description: '简单气功功法练习，调息养神，增强体质。',
    venue: '户外广场 / 活动大厅',
    equipment: ['瑜伽垫', '轻音乐', '音响'],
    minStaff: 1,
    safetyTips: '关注呼吸节奏；动作轻柔缓慢；心脑血管疾病长者须医生许可。',
  },
  {
    name: '老电影放映周',
    tags: ['文娱欣赏'],
    images: [],
    description: '每周播放经典老电影，唤起美好回忆。',
    venue: '多功能厅',
    equipment: ['投影仪', 'DVD播放器', '经典老片资源', '爆米花'],
    minStaff: 1,
    safetyTips: '选择积极向上的影片；中场休息15分钟；提供茶水。',
  },
  {
    name: '制作香囊',
    tags: ['手工制作', '节气养生'],
    images: [],
    description: '用中草药制作端午香囊，驱蚊安神。',
    venue: '手工室',
    equipment: ['布料', '针线', '中草药粉', '丝带', '装饰配件'],
    minStaff: 1,
    safetyTips: '使用钝头针或安全针；对中药材过敏者注意防护；避免粉末吸入。',
  },
  {
    name: '趣味运动会',
    tags: ['运动健身', '节庆活动'],
    images: [],
    description: '设置适合长者的趣味运动项目，如投沙包、套圈、保龄球等。',
    venue: '户外操场 / 活动大厅',
    equipment: ['沙包', '套圈', '塑料保龄球', '计时器', '奖品'],
    minStaff: 3,
    safetyTips: '运动强度以轻缓为主；提前热身；备好急救用品；划分安全区域。',
  },
  {
    name: '中秋赏月',
    tags: ['节庆活动', '外出游玩'],
    images: [],
    description: '中秋夜组织长者户外赏月，吃月饼，讲传说。',
    venue: '户外花园 / 天台',
    equipment: ['月饼', '茶水', '座椅', '灯笼', '毯子'],
    minStaff: 2,
    safetyTips: '注意夜间保暖；地面平坦防绊倒；提前查看天气预报。',
  },
  {
    name: '养花草盆栽',
    tags: ['手工制作', '节气养生'],
    images: [],
    description: '种植和养护盆栽植物，培养耐心和责任感。',
    venue: '花园 / 阳台',
    equipment: ['花盆', '营养土', '植物幼苗', '浇水壶', '小铲子'],
    minStaff: 1,
    safetyTips: '选择易养护植物；避免带刺植物；注意浇水防滑。',
  },
  {
    name: '茶道体验',
    tags: ['文娱欣赏', '节气养生'],
    images: [],
    description: '学习中国茶文化，品茗赏茶，陶冶情操。',
    venue: '茶室 / 活动室',
    equipment: ['茶具套装', '多种茶叶', '开水壶', '茶点'],
    minStaff: 1,
    safetyTips: '注意热水安全；避免空腹饮茶；咖啡因敏感者提供花茶选项。',
  },
  {
    name: '非洲鼓体验',
    tags: ['音乐舞蹈'],
    images: [],
    description: '学习简单非洲鼓节奏，感受音乐律动，释放压力。',
    venue: '活动大厅',
    equipment: ['非洲鼓', '音乐播放器', '座椅'],
    minStaff: 1,
    safetyTips: '控制音量避免刺耳；坐着击鼓；间隔休息。',
  },
  {
    name: '围巾扎染',
    tags: ['手工制作'],
    images: [],
    description: '用传统扎染工艺制作独一无二的围巾或手帕。',
    venue: '手工室',
    equipment: ['白围巾/白布', '染料', '橡皮筋', '塑料手套', '水盆'],
    minStaff: 1,
    safetyTips: '使用无毒布料染料；佩戴手套操作；注意防染料洒落。',
  },
  {
    name: '中秋做月饼',
    tags: ['手工制作', '节庆活动'],
    images: [],
    description: '亲手制作冰皮月饼，体验中秋传统文化。',
    venue: '食堂',
    equipment: ['冰皮粉', '馅料', '月饼模具', '手套', '包装盒'],
    minStaff: 2,
    safetyTips: '注意食品卫生；糖尿病患者提供低糖馅料；操作台清洁防滑。',
  },
  {
    name: '手机使用教学',
    tags: ['文娱欣赏', '益智游戏'],
    images: [],
    description: '教长者使用智能手机基本功能，跟上数字时代。',
    venue: '活动室',
    equipment: ['投影仪', '智能手机', '教学PPT', '操作手册'],
    minStaff: 2,
    safetyTips: '一对一或小组教学；耐心重复；防诈骗内容重点讲解；控制时长。',
  },
  {
    name: '剪纸窗花',
    tags: ['手工制作', '节庆活动'],
    images: [],
    description: '新年剪窗花活动，增添节日喜庆氛围。',
    venue: '活动室',
    equipment: ['红纸', '剪刀', '剪纸图案', '胶水', '展示板'],
    minStaff: 1,
    safetyTips: '提供安全剪刀；可提供半成品剪裁；完成后装饰窗户。',
  },
  {
    name: '跳棋比赛',
    tags: ['益智游戏'],
    images: [],
    description: '跳棋对弈比赛，锻炼逻辑思维能力。',
    venue: '棋牌室',
    equipment: ['跳棋棋盘', '计时器', '积分表', '奖品'],
    minStaff: 1,
    safetyTips: '避免长时间保持同一姿势；每轮结束后起身活动。',
  },
  {
    name: '经络拍打操',
    tags: ['运动健身', '节气养生'],
    images: [],
    description: '通过拍打经络穴位，促进血液循环，疏通经络。',
    venue: '活动大厅',
    equipment: ['经络拍打棒(可选)', '教学视频', '轻音乐'],
    minStaff: 1,
    safetyTips: '力度适中避免拍伤；有出血倾向疾病者慎用；饭后半小时后进行。',
  },
  {
    name: '手工布艺花',
    tags: ['手工制作'],
    images: [],
    description: '用布料制作各种布艺花朵，装饰房间。',
    venue: '手工室',
    equipment: ['彩色布料', '剪刀', '铁丝', '花艺胶带', '花瓶'],
    minStaff: 1,
    safetyTips: '使用钝头剪刀；铁丝端部需包裹防刺伤；完成后可装点房间。',
  },
  {
    name: '重阳登高',
    tags: ['外出游玩', '节庆活动'],
    images: [],
    description: '重阳节组织登高望远活动，寓意健康长寿。',
    venue: '附近山丘/公园高地',
    equipment: ['登山杖', '饮用水', '急救包', '点心', '点名册'],
    minStaff: 4,
    safetyTips: '⚠️ 提前评估长者体力；一对一陪护行动不便者；选择平缓路线；需家属签署知情同意书。',
  },
  {
    name: '黏土手工',
    tags: ['手工制作'],
    images: [],
    description: '用超轻黏土捏制各种造型，锻炼手部精细动作。',
    venue: '手工室',
    equipment: ['超轻黏土', '工具套装', '参考图样', '收纳盒'],
    minStaff: 1,
    safetyTips: '选用无毒黏土；提供参考图样；完成后自然晾干保存。',
  },
  {
    name: '京剧欣赏',
    tags: ['文娱欣赏', '音乐舞蹈'],
    images: [],
    description: '欣赏经典京剧片段，感受国粹魅力。',
    venue: '多功能厅',
    equipment: ['投影仪', '音响', '京剧唱段资源', '茶水'],
    minStaff: 1,
    safetyTips: '控制音量适中；提供字幕辅助理解；中场休息。',
  },
  {
    name: '耳穴保健',
    tags: ['节气养生'],
    images: [],
    description: '学习耳穴按摩方法，缓解失眠、头痛等常见问题。',
    venue: '活动室',
    equipment: ['耳穴图', '按摩棒(可选)', '教学视频'],
    minStaff: 1,
    safetyTips: '力度轻柔；耳部有炎症者暂停参与；配合讲解引导操作。',
  },
  {
    name: '旧物改造DIY',
    tags: ['手工制作'],
    images: [],
    description: '利用废旧物品制作实用小物件，环保又有趣。',
    venue: '手工室',
    equipment: ['废旧物品(瓶子/纸箱/布料)', '胶水', '剪刀', '装饰材料'],
    minStaff: 1,
    safetyTips: '注意工具使用安全；提前洗净废旧物品；发挥创意不拘一格。',
  },
  {
    name: '集体生日会',
    tags: ['节庆活动', '文娱欣赏'],
    images: [],
    description: '为当月过生日长者举办集体生日派对，增进归属感。',
    venue: '多功能厅',
    equipment: ['蛋糕', '气球', '生日帽', '小礼品', '音响'],
    minStaff: 2,
    safetyTips: '注意食品过敏确认；蛋糕糖分控制；拍照记录温馨时刻。',
  },
  {
    name: '二十四节气养生操',
    tags: ['节气养生', '运动健身'],
    images: [],
    description: '根据二十四节气编排的养生操，顺应自然规律。',
    venue: '活动大厅',
    equipment: ['节气养生图', '音响', '教学视频'],
    minStaff: 1,
    safetyTips: '配合节气特点调整动作；注意保暖；循序渐进。',
  },
  {
    name: '绕口令比赛',
    tags: ['益智游戏', '文娱欣赏'],
    images: [],
    description: '趣味绕口令比赛，锻炼语言能力和反应速度。',
    venue: '活动室',
    equipment: ['绕口令卡片', '计时器', '小奖品', '麦克风'],
    minStaff: 1,
    safetyTips: '以娱乐为主避免压力；口齿不清者也可参与获得鼓励；气氛轻松愉快。',
  },
  {
    name: '绘画疗愈',
    tags: ['手工制作', '文娱欣赏'],
    images: [],
    description: '自由绘画表达情感，纾解情绪，促进心理健康。',
    venue: '活动室',
    equipment: ['画纸', '水彩/蜡笔', '画板', '围裙'],
    minStaff: 1,
    safetyTips: '不追求绘画技巧，重在表达；完成后可展示或赠予家人。',
  },
  {
    name: '冬季养生煲汤',
    tags: ['节气养生'],
    images: [],
    description: '学习冬季养生汤品制作，食补养生。',
    venue: '食堂',
    equipment: ['汤锅', '食材', '菜谱', '餐具', '电磁炉'],
    minStaff: 2,
    safetyTips: '注意用火用电安全；防止烫伤；有饮食禁忌者提前告知。',
  },
  {
    name: '交谊舞会',
    tags: ['音乐舞蹈', '运动健身'],
    images: [],
    description: '举办小型交谊舞会，音乐优雅，舞步简单。',
    venue: '多功能厅',
    equipment: ['音响', '舞曲合集', '彩灯', '装饰气球', '座椅'],
    minStaff: 2,
    safetyTips: '地面防滑处理；舞步简单易学；可坐着舞动上肢；备好饮用水。',
  },
  {
    name: '乒乓球练习',
    tags: ['运动健身', '益智游戏'],
    images: [],
    description: '适老化乒乓球运动，降低网高、使用大球，活动全身关节。',
    venue: '活动室/大厅',
    equipment: ['乒乓球拍', '乒乓球', '球桌(可折叠)', '网架'],
    minStaff: 1,
    safetyTips: '注意地面防滑；运动前热身；避免长时间站立；配备座椅休息。',
  },
  {
    name: '桌上冰壶',
    tags: ['益智游戏', '运动健身'],
    images: [],
    description: '桌面冰壶竞技，策略与技巧并重，适合室内娱乐。',
    venue: '活动室',
    equipment: ['桌上冰壶套装', '计分板'],
    minStaff: 1,
    safetyTips: '坐姿完成；轻缓投掷；分组对抗增强趣味。',
  },
  {
    name: '橡皮泥塑形',
    tags: ['手工制作'],
    images: [],
    description: '用橡皮泥捏制各种造型，激发创造力，锻炼手指灵活性。',
    venue: '手工室',
    equipment: ['彩色橡皮泥', '工具套装', '参考图样', '密封盒'],
    minStaff: 1,
    safetyTips: '选用无毒橡皮泥；完成后密封保存防止干裂；可晾干成永久作品。',
  },
  {
    name: '冥想放松',
    tags: ['节气养生', '文娱欣赏'],
    images: [],
    description: '跟随引导词进行冥想练习，放松身心，舒缓焦虑。',
    venue: '活动室/安静室',
    equipment: ['瑜伽垫', '冥想音乐', '香薰(可选)'],
    minStaff: 1,
    safetyTips: '环境安静舒适；引导语轻柔；时长20-30分钟；有严重精神疾病者评估参与。',
  },
  {
    name: '飞镖投靶',
    tags: ['运动健身', '益智游戏'],
    images: [],
    description: '安全飞镖投靶运动，锻炼手眼协调和专注力。',
    venue: '活动大厅/走廊',
    equipment: ['软头飞镖', '磁力靶', '计分板'],
    minStaff: 1,
    safetyTips: '使用安全软头飞镖；靶挂墙牢固；站位距离适合长者；围观者保持安全距离。',
  },
  {
    name: '英语角',
    tags: ['文娱欣赏', '益智游戏'],
    images: [],
    description: '基础英语口语交流，学习日常用语，活跃大脑。',
    venue: '阅览室',
    equipment: ['英语入门教材', '卡片', '音响', '投影仪'],
    minStaff: 1,
    safetyTips: '内容简单有趣；以生活场景为主；不强迫开口；鼓励氛围。',
  },
  {
    name: '盆栽微景观',
    tags: ['手工制作'],
    images: [],
    description: '制作微型生态景观，将大自然浓缩于方寸之间。',
    venue: '手工室/花园',
    equipment: ['玻璃容器', '苔藓', '小石子', '小植物', '镊子'],
    minStaff: 1,
    safetyTips: '使用安全工具；精细操作提供放大镜；完成后放在公共区域展示。',
  },
  {
    name: '手影戏表演',
    tags: ['文娱欣赏', '音乐舞蹈'],
    images: [],
    description: '用双手和光影创造各种动物造型，配以故事讲述。',
    venue: '活动大厅',
    equipment: ['幕布', '手电筒/聚光灯', '背景音乐', '座椅'],
    minStaff: 1,
    safetyTips: '光线柔和不刺眼；坐姿表演；鼓励创意发挥。',
  },
  {
    name: '团扇绘画',
    tags: ['手工制作', '文娱欣赏'],
    images: [],
    description: '在团扇上绘制花鸟山水，传统与艺术结合。',
    venue: '手工室',
    equipment: ['空白团扇', '水彩/国画颜料', '画笔', '调色盘'],
    minStaff: 1,
    safetyTips: '选择易上色颜料；提供图案参考；完成后可作为伴手礼。',
  },
  {
    name: '成语接龙',
    tags: ['益智游戏', '文娱欣赏'],
    images: [],
    description: '趣味成语接龙比赛，丰富词汇，活跃思维。',
    venue: '活动室',
    equipment: ['成语卡片', '计时器', '计分板', '小奖品'],
    minStaff: 1,
    safetyTips: '难度适中；可分组进行；营造轻松氛围；禁止嘲笑答错者。',
  },
  {
    name: '植物拓印',
    tags: ['手工制作', '外出游玩'],
    images: [],
    description: '将新鲜植物叶片的纹理拓印到布面或纸面上。',
    venue: '花园/手工室',
    equipment: ['新鲜树叶/花朵', '白布/白纸', '小锤子', '胶带'],
    minStaff: 1,
    safetyTips: '户外采集注意安全；使用小锤时垫布缓冲；选择无毒植物。',
  },
  {
    name: '扔沙包游戏',
    tags: ['运动健身', '益智游戏'],
    images: [],
    description: '传统扔沙包游戏，锻炼投掷准确性和手臂力量。',
    venue: '户外/大厅',
    equipment: ['沙包', '目标桶/圈', '计分板'],
    minStaff: 1,
    safetyTips: '沙包重量轻；目标物稳固；投掷距离适中；分组进行。',
  },
  {
    name: '肥皂雕刻',
    tags: ['手工制作'],
    images: [],
    description: '在肥皂上雕刻简单图案，安全易上手的手工活动。',
    venue: '手工室',
    equipment: ['白肥皂', '雕刻刀(安全型)', '图样', '砂纸'],
    minStaff: 1,
    safetyTips: '使用安全雕刻刀；提供防护手套；废料统一收集。',
  },
  {
    name: '头脑风暴故事会',
    tags: ['文娱欣赏', '益智游戏'],
    images: [],
    description: '集体创作故事，每人一句，打造天马行空的剧情。',
    venue: '活动室',
    equipment: ['图片/道具卡片', '录音设备(可选)', '座椅'],
    minStaff: 1,
    safetyTips: '每人轮流编一句话；鼓励奇思妙想；记录有趣故事汇编成册。',
  },
  {
    name: '手指画创作',
    tags: ['手工制作', '文娱欣赏'],
    images: [],
    description: '用手指蘸取颜料自由创作画作，释放天性。',
    venue: '手工室',
    equipment: ['手指画颜料', '画纸', '围裙', '湿布'],
    minStaff: 1,
    safetyTips: '使用无毒可水洗颜料；穿戴围裙；铺好桌面防护。',
  },
  {
    name: '养生穴位按摩',
    tags: ['节气养生'],
    images: [],
    description: '学习常用养生穴位按压方法，自我保健调理。',
    venue: '活动室',
    equipment: ['人体穴位图', '按摩球', '教学视频'],
    minStaff: 1,
    safetyTips: '力度适中；指甲剪短；避免穴位按压过度；有特殊疾病者咨询医师。',
  },
  {
    name: '集体广播体操',
    tags: ['运动健身'],
    images: [],
    description: '播放老年广播体操音乐，集体锻炼身体。',
    venue: '户外/大厅',
    equipment: ['音响', '广播体操音乐', '领操视频'],
    minStaff: 1,
    safetyTips: '选择老年版广播体操；动作简化为坐姿版；量力而行。',
  },
  {
    name: '中国结编织',
    tags: ['手工制作', '节庆活动'],
    images: [],
    description: '学习传统中国结编织技法，寓意吉祥如意。',
    venue: '手工室',
    equipment: ['红绳', '珠饰', '图样说明书', '剪刀'],
    minStaff: 1,
    safetyTips: '选用粗绳方便操作；分步骤教学；可做节日装饰或赠礼。',
  },
  {
    name: '套圈游戏',
    tags: ['运动健身', '益智游戏'],
    images: [],
    description: '趣味套圈赢奖品活动，老少皆宜的经典游戏。',
    venue: '户外/大厅',
    equipment: ['套圈', '目标物品', '计分板', '奖品'],
    minStaff: 1,
    safetyTips: '目标物放置稳定；套圈重量轻；投掷线设明显标记。',
  },
  {
    name: '配音模仿秀',
    tags: ['文娱欣赏', '音乐舞蹈'],
    images: [],
    description: '模仿影视经典台词或方言配音，欢乐互动。',
    venue: '多功能厅',
    equipment: ['影视片段', '麦克风', '音响', '字幕'],
    minStaff: 1,
    safetyTips: '选择长者熟悉影视片段；鼓励方言配音；欢乐为主。',
  },
  {
    name: '艾灸养生',
    tags: ['节气养生'],
    images: [],
    description: '传统艾灸养生体验，温通经络，驱寒祛湿。',
    venue: '活动室',
    equipment: ['艾条', '艾灸盒', '打火机', '烟灰缸', '通风设备'],
    minStaff: 1,
    safetyTips: '⚠️ 需专业人员指导；注意通风防烟；皮肤敏感者慎用；操作时注意防火。',
  },
  {
    name: '皮影戏表演',
    tags: ['文娱欣赏', '手工制作'],
    images: [],
    description: '制作并表演传统皮影戏，感受非遗文化魅力。',
    venue: '多功能厅',
    equipment: ['皮影材料', '幕布', '光源', '剧本'],
    minStaff: 2,
    safetyTips: '制作皮影时使用安全剪刀；演出时需多人协作；传统剧目优先。',
  },
  {
    name: '桌游大冒险',
    tags: ['益智游戏'],
    images: [],
    description: '多人桌游活动，飞行棋/大富翁等经典游戏。',
    venue: '活动室',
    equipment: ['飞行棋/大富翁/UNO', '桌椅', '计时器'],
    minStaff: 1,
    safetyTips: '选择规则简单的桌游；每组配一名讲解员；控制时长。',
  },
  {
    name: '采摘果蔬',
    tags: ['外出游玩', '手工制作'],
    images: [],
    description: '组织长者到农场采摘当季水果蔬菜，亲近自然。',
    venue: '农场/种植园',
    equipment: ['篮子', '水', '遮阳帽', '点名册'],
    minStaff: 3,
    safetyTips: '⚠️ 外出活动提前报备；选择平坦果园；注意防虫防晒；安排车辆接送。',
  },
  {
    name: '手工蜡烛制作',
    tags: ['手工制作'],
    images: [],
    description: 'DIY手工香薰蜡烛，选择喜欢的颜色和香型。',
    venue: '手工室',
    equipment: ['蜡块', '烛芯', '模具', '色素', '香精', '电磁炉'],
    minStaff: 2,
    safetyTips: '⚠️ 加热蜡块时注意安全防止烫伤；使用电磁炉而非明火；通风良好。',
  },
  {
    name: '古诗书法临摹',
    tags: ['手工制作', '文娱欣赏'],
    images: [],
    description: '临摹经典古诗词书法，感受文字之美。',
    venue: '阅览室',
    equipment: ['钢笔/毛笔', '字帖', '田字格本', '墨水'],
    minStaff: 1,
    safetyTips: '坐姿端正；光线充足；提供老花镜；不限进度。',
  },
  {
    name: '瑜伽球训练',
    tags: ['运动健身'],
    images: [],
    description: '利用瑜伽球进行核心力量和平衡训练。',
    venue: '活动大厅',
    equipment: ['瑜伽球', '瑜伽垫'],
    minStaff: 1,
    safetyTips: '选择合适尺寸瑜伽球；坐姿或卧姿完成；靠墙练习增加稳定性。',
  },
  {
    name: '美食分享会',
    tags: ['节庆活动', '文娱欣赏'],
    images: [],
    description: '各地特色美食分享品鉴，交流饮食文化。',
    venue: '食堂/大厅',
    equipment: ['各色小吃', '餐具', '桌布', '标签牌', '茶水'],
    minStaff: 1,
    safetyTips: '注意食品过敏原标注；鼓励自带家乡美食分享；营造温馨氛围。',
  },
  {
    name: '魔术教学',
    tags: ['文娱欣赏', '益智游戏'],
    images: [],
    description: '学习简单魔术技巧，增添生活乐趣。',
    venue: '活动室',
    equipment: ['简单魔术道具', '教学视频', '镜子'],
    minStaff: 1,
    safetyTips: '选择简单易学魔术；增强自信心；可组织表演展示。',
  },
  {
    name: '竹编工艺',
    tags: ['手工制作'],
    images: [],
    description: '传统竹编手工艺制作篮子、杯垫等实用品。',
    venue: '手工室',
    equipment: ['竹条/藤条', '剪刀', '胶水', '样品'],
    minStaff: 1,
    safetyTips: '使用前检查竹条无毛刺；提供防护手套；编制过程耐心。',
  },
  {
    name: '拍手歌谣',
    tags: ['音乐舞蹈', '益智游戏'],
    images: [],
    description: '跟着节奏拍手唱歌，简单快乐的音乐互动。',
    venue: '活动大厅',
    equipment: ['音响', '歌谣歌词', '节奏图'],
    minStaff: 1,
    safetyTips: '选择节奏明快的儿歌/民歌；拍手配合节奏；可坐姿完成。',
  },
  {
    name: '户外写生',
    tags: ['外出游玩', '手工制作'],
    images: [],
    description: '到户外用画笔记录自然风光，放松心情。',
    venue: '公园/花园',
    equipment: ['画板', '水彩', '折叠凳', '遮阳帽'],
    minStaff: 2,
    safetyTips: '选择阴凉通风处；户外注意防暑防虫；不需专业技巧。',
  },
  {
    name: '沙画体验',
    tags: ['手工制作', '文娱欣赏'],
    images: [],
    description: '用彩沙在灯箱上创作流动的沙画作品。',
    venue: '手工室',
    equipment: ['沙画台', '彩沙', '模板', '密封胶'],
    minStaff: 1,
    safetyTips: '沙画台放置平稳；选用细沙；完成后可密封保存。',
  },
  {
    name: '看图说话',
    tags: ['益智游戏', '文娱欣赏'],
    images: [],
    description: '根据图片即兴编故事，锻炼表达和想象力。',
    venue: '活动室',
    equipment: ['图片/照片集', '投影仪', '座椅'],
    minStaff: 1,
    safetyTips: '选取有故事性的图片；鼓励自由发挥；可分组讨论。',
  },
  {
    name: '泥塑陶艺',
    tags: ['手工制作'],
    images: [],
    description: '用陶泥捏制器皿或造型，体验陶艺乐趣。',
    venue: '手工室',
    equipment: ['陶泥', '转盘', '工具套装', '围裙', '水盆'],
    minStaff: 1,
    safetyTips: '提供一次性手套；陶泥密封保存防干；可刻字留念。',
  },
  {
    name: '智力问答',
    tags: ['益智游戏'],
    images: [],
    description: '生活常识、历史地理趣味问答竞赛。',
    venue: '活动室',
    equipment: ['题库', '抢答器/铃铛', '计分板', '奖品'],
    minStaff: 1,
    safetyTips: '题目涵盖生活常识、历史、地理等；难度分级；气氛活跃。',
  },
  {
    name: '空竹表演',
    tags: ['运动健身', '文娱欣赏'],
    images: [],
    description: '抖空竹表演和教学，传统民间技艺。',
    venue: '户外广场',
    equipment: ['空竹', '抖杆', '绳'],
    minStaff: 1,
    safetyTips: '选择轻便空竹；场地开阔无障碍；有经验者示范教学。',
  },
  {
    name: '感恩墙制作',
    tags: ['手工制作', '文娱欣赏'],
    images: [],
    description: '写下心中的感恩话语，装饰公共区域。',
    venue: '活动室/走廊',
    equipment: ['便利贴', '彩笔', '大海报/软木板', '胶水'],
    minStaff: 1,
    safetyTips: '每人写下感谢的话；布置公共感恩墙；营造温馨氛围。',
  },
  {
    name: '自然观察日记',
    tags: ['外出游玩', '手工制作'],
    images: [],
    description: '记录庭院中的植物生长和天气变化。',
    venue: '花园/户外',
    equipment: ['笔记本', '笔', '放大镜', '折叠凳'],
    minStaff: 1,
    safetyTips: '鼓励记录所见所闻(植物、昆虫、天气)；可配简笔画。',
  },
  {
    name: '音乐律动操',
    tags: ['音乐舞蹈', '运动健身'],
    images: [],
    description: '跟随音乐节奏做律动操，愉悦身心。',
    venue: '活动大厅',
    equipment: ['音响', '律动操音乐', '视频'],
    minStaff: 1,
    safetyTips: '动作简单易跟；坐姿完成更安全；选择轻快音乐。',
  },
  {
    name: '家居安全知识讲座',
    tags: ['文娱欣赏', '节气养生'],
    images: [],
    description: '防跌倒、防烫伤、用电安全等实用知识。',
    venue: '多功能厅',
    equipment: ['投影仪', '安全手册', '案例视频', '互动道具'],
    minStaff: 1,
    safetyTips: '内容实用易懂；重点讲述防跌倒、防烫伤、用电安全；问答互动。',
  },
  {
    name: '湿拓画体验',
    tags: ['手工制作', '文娱欣赏'],
    images: [],
    description: '水面作画的传统湿拓画(Ebru)艺术体验。',
    venue: '手工室',
    equipment: ['湿拓画颜料', '水盆', '画纸', '梳子工具'],
    minStaff: 1,
    safetyTips: '选用专用湿拓画颜料；穿戴围裙防溅；成品晾干后展示。',
  },
  {
    name: '词语接龙',
    tags: ['益智游戏', '文娱欣赏'],
    images: [],
    description: '趣味词语接龙游戏，活跃语言思维。',
    venue: '活动室',
    equipment: ['词语卡片', '计时器', '计分板'],
    minStaff: 1,
    safetyTips: '难度循序渐进；可设主题(如食物、动物)；轻松氛围为主。',
  },
  {
    name: '环保手工袋制作',
    tags: ['手工制作'],
    images: [],
    description: '在环保布袋上手绘图案，制作专属购物袋。',
    venue: '手工室',
    equipment: ['环保布袋', '布料颜料', '画笔', '模板'],
    minStaff: 1,
    safetyTips: '使用布料专用颜料；可印环保标语；成品日常实用。',
  },
  {
    name: '太极拳推广讲座',
    tags: ['运动健身', '节气养生'],
    images: [],
    description: '太极拳基础知识和入门教学讲座。',
    venue: '多功能厅',
    equipment: ['投影仪', '太极拳视频', '讲义'],
    minStaff: 1,
    safetyTips: '讲练结合；从最基础动作开始；强调意念与呼吸配合。',
  },
  {
    name: '趣味夹豆子',
    tags: ['益智游戏', '运动健身'],
    images: [],
    description: '用筷子夹豆子比赛，锻炼手部精细动作。',
    venue: '活动室',
    equipment: ['豆子', '筷子', '碗/盘', '计时器'],
    minStaff: 1,
    safetyTips: '分组比赛；豆子大小适中；可使用长短筷适应不同手部能力。',
  },
  {
    name: '弹子棋对战',
    tags: ['益智游戏'],
    images: [],
    description: '弹子跳棋对战，策略益智。',
    venue: '棋牌室',
    equipment: ['弹子棋盘', '计时器', '积分表'],
    minStaff: 1,
    safetyTips: '坐姿完成；鼓励思考但不制造压力；可设茶点。',
  },
  {
    name: '气泡膜作画',
    tags: ['手工制作'],
    images: [],
    description: '用气泡膜蘸颜料印画，创作立体纹理画作。',
    venue: '手工室',
    equipment: ['气泡膜', '颜料', '画纸', '胶带', '刷子'],
    minStaff: 1,
    safetyTips: '用气泡膜蘸颜料印画；色彩缤纷；趣味性强；完成后装裱。',
  },
  {
    name: '回忆老照片展',
    tags: ['文娱欣赏', '节庆活动'],
    images: [],
    description: '征集老照片举办展览，分享背后的故事。',
    venue: '多功能厅/走廊',
    equipment: ['老照片征集', '展板', '标签', '茶点'],
    minStaff: 2,
    safetyTips: '提前征集长者的老照片；讲述照片故事；唤起美好回忆。',
  },
  {
    name: '竹竿舞体验',
    tags: ['音乐舞蹈', '运动健身'],
    images: [],
    description: '伴随音乐节奏在竹竿间跳跃或坐姿拍打节奏。',
    venue: '户外/大厅',
    equipment: ['竹竿(两根)', '音乐', '地垫'],
    minStaff: 2,
    safetyTips: '坐姿完成(手部跟随节奏拍打)；户外注意地面平整；节奏由慢到快。',
  },
];
