import { useEffect, useState, useRef, useCallback } from 'react';
import { Printer, Palette, X, Clock, Search, MapPin, Plus, RotateCcw, FileDown, Loader2 } from 'lucide-react';
import { useWeeklyPlanStore } from '../store/weeklyPlanStore';
import { useThemeStore } from '../store/themeStore';
import { useActivityLibraryStore } from '../store/activityLibraryStore';
import { useVenueStore } from '../store/venueStore';
import { THEME_CONFIGS, WEEKDAY_NAMES } from '../types';
import type { ThemeType, WeeklyPlanCell, Activity, Weekday, SlotId, DayTimeConfig } from '../types';
import { hasOutdoorKeyword, getWeekInfo, getMonday } from '../utils/helpers';
import { useBrandStore } from '../store/brandStore';
import { useTemplateStore } from '../store/templateStore';
// 导出PDF使用动态 import: html2canvas + jspdf
import ActivityDetailModal from '../components/activityLibrary/ActivityDetailModal';
import { PRESET_IMAGES } from '../utils/presetImages';

const SLOT_LABELS: Record<SlotId, string> = { morning: '上午', afternoon: '下午', evening: '晚上' };

export default function WeeklyPlanPage() {
  const { currentPlan, loaded, loading, loadOrCreatePlan, updateCell, setTheme, setTimeRange, batchSetTimeRange, clearCell, setDayNote, batchSetDayNotes } =
    useWeeklyPlanStore();
  const { currentTheme, setTheme: setAppTheme } = useThemeStore();
  const { activities, loaded: libLoaded, loadActivities } = useActivityLibraryStore();
  const venueStore = useVenueStore();
  const brandStore = useBrandStore();
  const templateStore = useTemplateStore();
  const [venueEditValue, setVenueEditValue] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [planTabs, setPlanTabs] = useState<string[]>(['计划表1']);
  const [activeTab, setActiveTab] = useState(0);
  const [editingTab, setEditingTab] = useState<number | null>(null);
  const [editTabVal, setEditTabVal] = useState('');
  const [pickSlot, setPickSlot] = useState<{ slotId: string; weekday: number } | null>(null);
  const [extraPickSlot, setExtraPickSlot] = useState<{ slotId: string; weekday: number } | null>(null);
  const [cropSlot, setCropSlot] = useState<{ slotId: string; weekday: number } | null>(null);
  const [cropPos, setCropPos] = useState({ x: 50, y: 50 });
  const [searchQuery, setSearchQuery] = useState('');
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);
  const [targetWeekStart, setTargetWeekStart] = useState(getMonday(new Date()));
  const [navKey, setNavKey] = useState(0);
  const [showAllTimeEdit, setShowAllTimeEdit] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState<{ slotId: string; weekday: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImageSlot, setPendingImageSlot] = useState<{ slotId: string; weekday: number } | null>(null);

  // 保存图片到活动库 & 记忆（双向同步，后修改的覆盖）
  const saveImageToActivity = (slotId: string, weekday: number, data: string) => {
    const cell = getCell(slotId, weekday);
    if (!cell?.activityId) return;
    // 保存到记忆
    venueStore.setActivityVenue(cell.activityId + '_img', data);
    // 也保存到活动库
    const act = activities.find(a => a.id === cell.activityId);
    if (act) {
      const { updateActivity } = useActivityLibraryStore.getState();
      updateActivity({ ...act, images: [data, ...act.images.filter(i => i !== data)] });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, slotId: string, weekday: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const data = ev.target.result as string;
          doUpdateCell(slotId, weekday as Weekday, { imageBase64: data });
          saveImageToActivity(slotId, weekday, data);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handlePickPresetImage = (data: string) => {
    if (showImageGallery) {
      doUpdateCell(showImageGallery.slotId, showImageGallery.weekday as Weekday, { imageBase64: data });
      saveImageToActivity(showImageGallery.slotId, showImageGallery.weekday, data);
      setShowImageGallery(null);
    }
  };

  // Removed per-cell time editing; time only shown in left column

  // Unified time editor input values
  const [uniTime, setUniTime] = useState<Record<SlotId, { start: string; end: string }>>({
    morning: { start: '08:00', end: '11:00' },
    afternoon: { start: '14:00', end: '17:00' },
    evening: { start: '18:00', end: '20:00' },
  });

  // Sync uniTime from plan when opening
  const syncUniTime = useCallback(() => {
    if (!currentPlan?.timeConfig?.[1]) return;
    const tc = currentPlan.timeConfig[1];
    setUniTime({
      morning: { start: tc.morning.startTime, end: tc.morning.endTime },
      afternoon: { start: tc.afternoon.startTime, end: tc.afternoon.endTime },
      evening: { start: tc.evening?.startTime || '18:00', end: tc.evening?.endTime || '20:00' },
    });
  }, [currentPlan]);



  // 加载周计划（响应 targetWeekStart 变化）
  useEffect(() => {
    if (!libLoaded) loadActivities();
    if (!venueStore.loaded) venueStore.loadAll();
    if (!brandStore.loaded) brandStore.loadConfig();
    if (!templateStore.loaded) templateStore.loadTemplates();
    useWeeklyPlanStore.getState().loadOrCreatePlan(targetWeekStart);
  }, [targetWeekStart]);

  // 同步 plan 的主题到 app 主题状态
  useEffect(() => {
    if (currentPlan?.theme && currentPlan.theme !== currentTheme) {
      setAppTheme(currentPlan.theme);
    }
  }, [currentPlan?.id, currentPlan?.theme]);

  const [printing, setPrinting] = useState(false);

  const handleExportPDF = useCallback(async () => {
    if (!printRef.current) return;
    setPrinting(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const jsPDF = (await import('jspdf')).default;
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff',
        onclone: (clonedDoc: Document) => {
          // 1. 移除所有打印/导出时隐藏的 UI 元素（no-print、print:hidden）
          clonedDoc.querySelectorAll('.no-print, .print\\:hidden').forEach((el) => {
            el.parentNode?.removeChild(el);
          });
          // 2. 所有 textarea 替换为纯文本 div（textareas只显示2行，截不全）
          clonedDoc.querySelectorAll('textarea').forEach((ta) => {
            const div = clonedDoc.createElement('div');
            div.textContent = (ta as HTMLTextAreaElement).value || '';
            div.className = ta.className.replace(/(?:^|\s)no-print(?:\s|$)/g, ' ').trim();
            div.style.cssText = ta.style.cssText + ';min-height:auto;overflow:visible;white-space:pre-wrap;word-break:break-word;overflow-wrap:break-word;height:auto;';
            ta.parentNode?.replaceChild(div, ta);
          });
          // 3. 整体内容下移 0.5cm
          const root = clonedDoc.querySelector('[data-export-root]') || clonedDoc.body;
          root.style.paddingTop = '0.5cm';
        },
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('l', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, w, h);
      const d = new Date();
      pdf.save(`悦活_周计划_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.pdf`);
    } catch (e: any) {
      console.error('导出PDF失败:', e);
      alert('导出PDF失败: ' + (e.message || '未知错误'));
    } finally {
      setPrinting(false);
    }
  }, [printRef]);

  const cellKey = (slotId: string, weekday: number) =>
    hasTabs && activeTab >= 0 ? `tab${activeTab}-${slotId}-${weekday}` : `${slotId}-${weekday}`;

  const getCell = (slotId: string, weekday: number): WeeklyPlanCell | undefined =>
    currentPlan?.cells[cellKey(slotId, weekday)];

  // Wrapper: updateCell with tab prefix
  const doUpdateCell = (s: string, w: number, p: Partial<WeeklyPlanCell>): void => {
    updateCell(s, w as Weekday, p, cellKey(s, w));
  };

  const doClearCell = (s: string, w: number): void => {
    clearCell(s, w as Weekday, cellKey(s, w));
  };

  const getActivityName = (cell?: WeeklyPlanCell): string => {
    if (cell?.customText) return cell.customText;
    if (cell?.activityId) {
      const act = activities.find((a) => a.id === cell.activityId);
      return act?.name || '';
    }
    return '';
  };

  const getExtraActivities = (cell?: WeeklyPlanCell): { act: Activity | undefined; item: import('../types').CellActivityItem }[] => {
    if (!cell?.extraActivities) return [];
    return cell.extraActivities.map(item => ({
      act: activities.find(a => a.id === item.activityId),
      item,
    }));
  };

  const getActivity = (cell?: WeeklyPlanCell): Activity | undefined =>
    cell?.activityId ? activities.find((a) => a.id === cell.activityId) : undefined;

  // 根据活动名称/标签匹配预设图片
  const matchPresetImage = (activity: Activity): string | null => {
    const name = activity.name.toLowerCase();
    const tags = activity.tags.map(t => t.toLowerCase());
    for (const img of PRESET_IMAGES) {
      const key = img.name.toLowerCase();
      if (name.includes(key) || tags.includes(key)) return img.data;
      // 关键词扩展匹配
      if (key === '运动' && (name.includes('太极') || name.includes('健身') || name.includes('操'))) return img.data;
      if (key === '唱歌' && (name.includes('合唱') || name.includes('歌') || name.includes('音乐'))) return img.data;
      if (key === '户外' && (name.includes('外出') || name.includes('公园') || name.includes('散步') || name.includes('出游'))) return img.data;
      if (key === '棋牌' && (name.includes('棋') || name.includes('牌') || name.includes('麻将'))) return img.data;
      if (key === '园艺' && (name.includes('园') || name.includes('种植'))) return img.data;
      if (key === '讲座' && (name.includes('讲座') || name.includes('养生') || name.includes('健康'))) return img.data;
    }
    return null;
  };

  const handlePickActivity = (activity: Activity) => {
    if (!pickSlot) return;
    const savedVenue = venueStore.getActivityVenue(activity.id);
    const matchedImage = matchPresetImage(activity);
    const savedImage = venueStore.getActivityVenue(activity.id + '_img');
    const savedOX = venueStore.getActivityVenue(activity.id + '_ox');
    const savedOY = venueStore.getActivityVenue(activity.id + '_oy');
    // 图片优先级：活动库图片 > 手动记忆图片 > 自动匹配 > 无
    const activityImg = activity.images?.[0] || '';
    // 自动填写提醒（安全提示）
    const outdoor = hasOutdoorKeyword(activity.name) || hasOutdoorKeyword(activity.safetyTips || '');
    let autoNote = '';
    if (outdoor) autoNote = '⚠️外出活动需提前报名并获家属同意';
    else if (activity.safetyTips) {
      const first = activity.safetyTips.replace(/[。；]/g, '，').split(/[，]/)[0];
      autoNote = first.length > 35 ? first.substring(0, 35) + '...' : first;
    }

    doUpdateCell(pickSlot.slotId, pickSlot.weekday as Weekday, {
      activityId: activity.id,
      customText: '',
      venue: savedVenue || activity.venue || '',
      imageBase64: activityImg || savedImage || matchedImage || '',
      imageOffsetX: savedOX ? Number(savedOX) : 50,
      imageOffsetY: savedOY ? Number(savedOY) : 50,
      note: autoNote,
    });
    // 记住图片，下次优先使用活动库的
    if (activityImg) {
      venueStore.setActivityVenue(activity.id + '_img', activityImg);
    } else if (matchedImage && !savedImage) {
      venueStore.setActivityVenue(activity.id + '_img', matchedImage);
    }
    setPickSlot(null);
    setSearchQuery('');
  };

  const handlePickExtraActivity = (activity: Activity) => {
    if (!extraPickSlot) return;
    const savedVenue = venueStore.getActivityVenue(activity.id);
    const cell = getCell(extraPickSlot.slotId, extraPickSlot.weekday);
    const extras = cell?.extraActivities || [];
    if (extras.find(e => e.activityId === activity.id)) return; // 避免重复
    // 询问第二活动的自定义时间（可选）
    const startTime = prompt('第二活动开始时间（可选，留空则使用时段默认时间）：', '') || undefined;
    const endTime = prompt('第二活动结束时间（可选）：', '') || undefined;
    doUpdateCell(extraPickSlot.slotId, extraPickSlot.weekday as Weekday, {
      extraActivities: [...extras, {
        activityId: activity.id,
        venue: savedVenue || activity.venue || '',
        startTime,
        endTime,
      }],
    });
    setExtraPickSlot(null);
    setSearchQuery('');
  };

  const handleRemoveExtraActivity = (slotId: string, weekday: number, activityId: string) => {
    const cell = getCell(slotId, weekday);
    if (!cell) return;
    doUpdateCell(slotId, weekday as Weekday, {
      extraActivities: (cell.extraActivities || []).filter(e => e.activityId !== activityId),
    });
  };

  const handleClearCell = (slotId: string, weekday: number) => {
    doClearCell(slotId, weekday as Weekday);
    setPickSlot(null);
    setSearchQuery('');
  };

  const renderActivityPicker = ({ title, onPick, onCustom, onClear, onClose }: {
    title: string;
    onPick: (act: Activity) => void;
    onCustom: (name: string, venue: string) => void;
    onClear: () => void;
    onClose: () => void;
  }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-warm-100 shrink-0">
          <h3 className="text-base font-semibold text-warm-800">{title}</h3>
          <button onClick={onClose}
            className="p-1 hover:bg-warm-50 rounded-lg">
            <X className="w-5 h-5 text-warm-400" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-warm-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
            <input type="text" autoFocus value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索活动..."
              className="w-full pl-9 pr-3 py-2 border border-warm-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-warm-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-10 text-warm-400 text-sm">暂无活动</div>
          ) : (
            <div className="space-y-1">
              {filteredActivities.map((act) => (
                <button key={act.id} onClick={() => onPick(act)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-warm-50 transition-colors text-left border border-transparent hover:border-warm-200">
                  <div className="w-10 h-10 rounded-lg bg-warm-100 flex items-center justify-center text-warm-500 text-xs font-bold shrink-0">
                    {act.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-800">{act.name}</p>
                    <p className="text-xs text-warm-400 truncate">{act.tags.join(' · ')}</p>
                  </div>
                  <span className="text-xs text-warm-300 shrink-0">选择</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-warm-100 flex gap-2 shrink-0">
          <button onClick={() => {
            const name = prompt('输入活动名称：');
            if (name?.trim()) {
              const venue = prompt('活动场所（可选）：') || '';
              onCustom(name.trim(), venue);
            }
          }}
            className="flex-1 px-3 py-2 border border-warm-200 rounded-lg text-sm text-warm-600 hover:bg-warm-50 transition-colors">
            手动输入
          </button>
          <button onClick={onClear}
            className="px-3 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors">
            清空
          </button>
        </div>
      </div>
    </div>
  );

  const applyTimeToAll = (slotId: SlotId, start: string, end: string) => {
    batchSetTimeRange(slotId, start, end);
    setShowAllTimeEdit(false);
  };

  // Time editing is now only via the unified time editor

  const filteredActivities = activities.filter((a) =>
    !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const theme = THEME_CONFIGS[currentTheme];

  const cellHasActivity = (cell: WeeklyPlanCell | undefined): boolean => {
    if (!cell) return false;
    return !!cell.activityId || !!cell.customText || !!(cell.extraActivities && cell.extraActivities.length > 0);
  };

  // Derive active slots from template + plan tabs
  const templ = templateStore.getCurrentTemplate();
  const activeSlots: SlotId[] = (templ?.timeSlots.map(s => s.slotId as SlotId)) || ['morning', 'afternoon'];
  const hasTabs = templ?.id === 'grouped' && templ.groupLabels;

  // Load/sync plan tabs
  useEffect(() => {
    if (!currentPlan) return;
    const saved = (currentPlan as any).planTabs;
    if (saved && saved.length > 0) {
      setPlanTabs(saved);
    } else {
      setPlanTabs(['计划表1']);
    }
  }, [currentPlan?.id]);

  const savePlanTabs = async (tabs: string[]) => {
    if (!currentPlan) return;
    const updated = { ...currentPlan, planTabs: tabs };
    const { putItem } = await import('../db');
    await putItem('weeklyPlans', updated);
    useWeeklyPlanStore.getState().loadOrCreatePlan(currentPlan.weekStart);
    setPlanTabs(tabs);
  };
  if (loading || (!loaded && !currentPlan)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-warm-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ===== 工具栏 ===== */}
      <div className="flex flex-wrap items-center gap-2 no-print">
        <button onClick={() => setShowThemePicker(!showThemePicker)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-warm-200 rounded-lg hover:bg-warm-50 text-sm text-warm-700 transition-colors">
          <Palette className="w-4 h-4" /> 风格
        </button>
        {/* 模板选择 */}
        <div className="relative">
          <button onClick={() => setShowTemplatePicker(!showTemplatePicker)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-warm-200 rounded-lg hover:bg-warm-50 text-sm text-warm-700 transition-colors">
            <RotateCcw className="w-4 h-4" /> 模板: {templ?.name || '标准'}
          </button>
          {showTemplatePicker && (
            <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-warm-200 rounded-lg shadow-lg p-2 w-56"
              onMouseLeave={() => setShowTemplatePicker(false)}>
              <p className="text-xs text-warm-500 px-2 py-1">选择周计划模板</p>
              {templateStore.templates.map(t => (
                <button key={t.id}
                  onClick={() => { templateStore.setCurrentTemplate(t.id); setShowTemplatePicker(false); }}
                  className={`w-full text-left px-2 py-2 rounded-lg text-sm transition-colors ${
                    templateStore.currentTemplateId === t.id
                      ? 'bg-warm-100 text-warm-800 font-medium'
                      : 'text-warm-600 hover:bg-warm-50'
                  }`}>
                  <div className="text-sm">{t.name}</div>
                  <div className="text-[10px] text-warm-400">{t.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* 周导航 */}
        <button onClick={() => {
          // 简单字符串加减日期，避免 Date 时区问题
          const parts = targetWeekStart.split('-').map(Number);
          const d = new Date(parts[0], parts[1] - 1, parts[2] - 7);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          setTargetWeekStart(y + '-' + m + '-' + day);
        }}
          className="px-2 py-1.5 text-xs text-warm-500 hover:text-warm-700 hover:bg-warm-50 rounded transition-colors">
          ‹
        </button>
        <span className="text-xs text-warm-600 font-medium min-w-[100px] text-center">
          {currentPlan ? getWeekInfo(currentPlan.weekStart).year + '年第' + getWeekInfo(currentPlan.weekStart).weekNum + '周' : '加载中'}
        </span>
        <button onClick={() => {
          const parts = targetWeekStart.split('-').map(Number);
          const d = new Date(parts[0], parts[1] - 1, parts[2] + 7);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          setTargetWeekStart(y + '-' + m + '-' + day);
        }}
          className="px-2 py-1.5 text-xs text-warm-500 hover:text-warm-700 hover:bg-warm-50 rounded transition-colors">
          ›
        </button>

        <button onClick={async () => {
          if (!currentPlan) return;
          const parts = targetWeekStart.split('-').map(Number);
          const nextDate = new Date(parts[0], parts[1] - 1, parts[2] + 7);
          const nextStart = nextDate.getFullYear() + '-' +
            String(nextDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(nextDate.getDate()).padStart(2, '0');
          const { putItem } = await import('../db');
          const dayNotes = {} as Record<Weekday, string>;
          [1,2,3,4,5,6,7].forEach(d => { dayNotes[d as Weekday] = ''; });
          // 新建计划：重置时间和备注
          const freshConfig = {} as Record<Weekday, DayTimeConfig>;
          [1,2,3,4,5,6,7].forEach(d => {
            freshConfig[d as Weekday] = {
              morning: { startTime: '08:00', endTime: '11:00' },
              afternoon: { startTime: '14:00', endTime: '17:00' },
              evening: { startTime: '18:00', endTime: '20:00' },
            };
          });
          const nextPlan = {
            ...currentPlan,
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
            weekStart: nextStart,
            cells: {},
            timeConfig: freshConfig,
            dayNotes,
            weatherReminder: '',
          };
          await putItem('weeklyPlans', nextPlan);
          setTargetWeekStart(nextStart);
        }}
          className="flex items-center gap-1.5 px-4 py-2 bg-warm-500 text-white rounded-lg hover:bg-warm-600 text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> 新增下周计划
        </button>
        <div className="w-px h-6 bg-warm-200" />

        <button onClick={async () => {
          if (!currentPlan) return;
          const { getAll, putItem } = await import('../db');
          // 尝试找上周、上上周的计划
          const parts = targetWeekStart.split('-').map(Number);
          let sourcePlan = null;
          for (let offset = 7; offset <= 14; offset += 7) {
            const d = new Date(parts[0], parts[1] - 1, parts[2] - offset);
            const srcStart = d.getFullYear() + '-' +
              String(d.getMonth() + 1).padStart(2, '0') + '-' +
              String(d.getDate()).padStart(2, '0');
            const all = await getAll('weeklyPlans') as any[];
            sourcePlan = all.find((p: any) => p.weekStart === srcStart);
            if (sourcePlan) break;
          }
          if (!sourcePlan) { alert('未找到上周或上上周的计划'); return; }
          // 复制 cells 和 dayNotes
          const updated = {
            ...currentPlan,
            cells: { ...sourcePlan.cells },
            dayNotes: { ...sourcePlan.dayNotes },
          };
          await putItem('weeklyPlans', updated);
          useWeeklyPlanStore.getState().loadOrCreatePlan(currentPlan.weekStart);
        }}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-warm-200 rounded-lg hover:bg-warm-50 text-sm text-warm-700 transition-colors">
          从上周复制
        </button>

        <button onClick={() => { syncUniTime(); setShowAllTimeEdit(true); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-warm-200 rounded-lg hover:bg-warm-50 text-sm text-warm-700 transition-colors">
          <Clock className="w-4 h-4" /> 统一设置时间
        </button>
        <button onClick={async () => {
          if (!currentPlan) return;
          const newCells = { ...currentPlan.cells };
          for (const d of [1,2,3,4,5,6,7] as Weekday[]) {
            for (const s of ['morning', 'afternoon']) {
              const key = s + '-' + d;
              const cell = newCells[key];
              if (!cell) continue;
              const name = cell.customText || (cell.activityId ? (activities.find(a => a.id === cell.activityId)?.name || '') : '');
              if (!name) continue;
              const act = cell.activityId ? activities.find(a => a.id === cell.activityId) : undefined;
              const outdoor = hasOutdoorKeyword(name) || hasOutdoorKeyword(act?.safetyTips || '');
              let note = '';
              if (outdoor) note = '⚠️外出活动需提前报名并获家属同意';
              else if (act?.safetyTips) {
                const first = act.safetyTips.replace(/[。；]/g, '，').split(/[，]/)[0];
                note = first.length > 35 ? first.substring(0, 35) + '...' : first;
              }
              if (note) newCells[key] = { ...cell, note };
            }
          }
          const { putItem } = await import('../db');
          await putItem('weeklyPlans', { ...currentPlan, cells: newCells });
          useWeeklyPlanStore.getState().loadOrCreatePlan(currentPlan.weekStart);
        }}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-warm-200 rounded-lg hover:bg-warm-50 text-sm text-warm-700 transition-colors">
          自动提醒
        </button>

        <button onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 text-sm transition-colors">
          <RotateCcw className="w-4 h-4" /> 重置内容
        </button>
        <div className="flex-1" />
        <select className="px-3 py-2 border border-warm-200 rounded-lg text-sm text-warm-700 bg-white opacity-50">
          <option>A4 横向</option>
        </select>
        <button onClick={handleExportPDF} disabled={printing}
          className="flex items-center gap-1.5 px-4 py-2 bg-warm-500 text-white rounded-lg hover:bg-warm-600 text-sm font-medium transition-colors disabled:opacity-50">
          {printing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          {printing ? '导出中...' : '导出PDF'}
        </button>
      </div>

      {/* ===== 主题选择 ===== */}
      {showThemePicker && (
        <div className="no-print bg-white rounded-xl border border-warm-100 p-4 shadow-sm">
          <h3 className="text-sm font-medium text-warm-700 mb-3">选择风格模板</h3>
          <div className="flex flex-wrap gap-2">
            {Object.values(THEME_CONFIGS).map((t) => (
              <button key={t.key}
                onClick={() => { setTheme(t.key as ThemeType); setAppTheme(t.key as ThemeType); setShowThemePicker(false); }}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${currentTheme === t.key ? 'ring-2 ring-warm-500 font-medium' : 'hover:bg-warm-50'}`}
                style={{ backgroundColor: t.bg, color: t.cellText, borderColor: t.border }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== 统一时间设置弹窗 ===== */}
      {showAllTimeEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowAllTimeEdit(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-warm-800 mb-4">统一设置所有时间</h3>
            <div className="flex flex-col gap-4">
              {activeSlots.map((slotId) => {
                const vals = uniTime[slotId];
                return (
                  <div key={slotId} className="flex items-center gap-2">
                    <span className="w-12 text-sm text-warm-700 font-medium shrink-0">{SLOT_LABELS[slotId]}</span>
                    <input type="time" value={vals.start}
                      onChange={(e) => setUniTime({ ...uniTime, [slotId]: { ...vals, start: e.target.value } })}
                      className="flex-1 px-2 py-1.5 border border-warm-200 rounded-lg text-sm" />
                    <span className="text-warm-400 text-sm">至</span>
                    <input type="time" value={vals.end}
                      onChange={(e) => setUniTime({ ...uniTime, [slotId]: { ...vals, end: e.target.value } })}
                      className="flex-1 px-2 py-1.5 border border-warm-200 rounded-lg text-sm" />
                    <button onClick={() => { applyTimeToAll(slotId, vals.start, vals.end); }}
                      className="px-3 py-1.5 bg-warm-500 text-white text-xs rounded-lg hover:bg-warm-600 shrink-0">
                      应用
                    </button>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowAllTimeEdit(false)}
              className="mt-4 w-full py-2 text-sm text-warm-500 hover:text-warm-700">
              完成
            </button>
          </div>
        </div>
      )}

      {/* ===== 多计划表标签 ===== */}
      {hasTabs && (
        <div className="no-print flex items-center gap-1 overflow-x-auto pb-1 border-b border-warm-200">
          {planTabs.map((tab, idx) => (
            <div key={idx} className="flex items-center">
              {editingTab === idx ? (
                <input type="text" value={editTabVal}
                  onChange={e => setEditTabVal(e.target.value)}
                  onBlur={async () => {
                    if (editTabVal.trim()) {
                      const newTabs = [...planTabs];
                      newTabs[idx] = editTabVal.trim();
                      await savePlanTabs(newTabs);
                    }
                    setEditingTab(null);
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  className="w-24 px-2 py-1 text-sm border border-warm-400 rounded outline-none"
                  autoFocus />
              ) : (
                <button onClick={() => setActiveTab(idx)}
                  onDoubleClick={() => { setEditingTab(idx); setEditTabVal(tab); }}
                  className={`px-3 py-1.5 text-sm rounded-t-lg transition-colors whitespace-nowrap ${
                    activeTab === idx
                      ? 'bg-warm-500 text-white font-medium'
                      : 'bg-warm-50 text-warm-600 hover:bg-warm-100'
                  }`}>
                  {tab}
                </button>
              )}
            </div>
          ))}
          <button onClick={async () => {
            const newTabs = [...planTabs, `计划表${planTabs.length + 1}`];
            await savePlanTabs(newTabs);
            setActiveTab(newTabs.length - 1);
          }}
            className="px-2 py-1.5 text-sm text-warm-400 hover:text-warm-600 transition-colors"
            title="新增计划表">
            + 新增
          </button>
          {planTabs.length > 1 && (
            <button onClick={async () => {
              if (!confirm(`删除「${planTabs[activeTab]}」？该表数据将一并清除。`)) return;
              const newTabs = planTabs.filter((_, i) => i !== activeTab);
              // Remove tab cells from plan
              if (currentPlan) {
                const newCells = { ...currentPlan.cells };
                Object.keys(newCells).forEach(key => {
                  if (key.startsWith(`tab${activeTab}-`)) delete newCells[key];
                });
                const { putItem } = await import('../db');
                await putItem('weeklyPlans', { ...currentPlan, cells: newCells, planTabs: newTabs });
                useWeeklyPlanStore.getState().loadOrCreatePlan(currentPlan.weekStart);
              }
              setPlanTabs(newTabs);
              if (activeTab >= newTabs.length) setActiveTab(newTabs.length - 1);
            }}
              className="px-2 py-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
              title="删除当前计划表">
              ✕
            </button>
          )}
        </div>
      )}

      {/* ===== 周计划表（打印区域，含标题） ===== */}
      <div ref={printRef} data-export-root
        className="w-full mx-auto print-full-page overflow-x-auto">

        {/* 系统品牌标识 — 打印始终显示，不可移除 */}
        <div className="hidden print:flex items-center gap-2 mb-2 px-2">
          <img src="./logo.svg" alt="" className="h-6 w-auto" />
          <span className="text-sm font-bold text-gray-700">悦活</span>
          {brandStore.config.enabled && brandStore.config.base64 && (
            <>
              <span className="text-[10px] text-gray-300 mx-1">|</span>
              <img src={brandStore.config.base64} alt="" className={brandStore.config.size === 'small' ? 'h-4 w-auto' : brandStore.config.size === 'large' ? 'h-8 w-auto' : 'h-6 w-auto'} />
            </>
          )}
        </div>

        {/* 周计划标题 */}
        {currentPlan && (() => {
          const info = getWeekInfo(currentPlan.weekStart);
          let title = `${info.year}年第${info.weekNum}周 活动计划`;
          let subtitle = `（${info.startDate} - ${info.endDate}）`;

          // 跨月显示
          if (info.crossYear) {
            title = `${info.year-1}-${info.year}年第${info.weekNum}周 活动计划表`;
          } else if (info.crossMonth) {
            title = `${info.year}年${info.startMonth}月-${info.endMonth}月第${info.weekNum}周 活动计划表`;
            subtitle = `（${info.startDate} - ${info.endDate}）`;
          }

          return (
            <div className="text-center mb-4 print:mb-3">
              <h2 className="text-xl print:text-2xl font-black text-warm-800 " style={{fontFamily:"Microsoft YaHei,MicrosoftYaHei,sans-serif"}}>{title}</h2>
              <p className="text-base font-bold text-warm-500 print:text-gray-600" style={{fontFamily:"SimSun,serif"}}>{subtitle}</p>
            </div>
          );
        })()}

        <table className="border-collapse text-xs border-2 print-full-page mx-auto"
          style={{ tableLayout: 'fixed', minWidth: '700px', borderColor: theme.border, backgroundColor: theme.bg }}>
          <colgroup>
            <col style={{ width: '70px' }} />
            {[1, 2, 3, 4, 5, 6, 7].map((d) => <col key={d} style={{ width: 'calc((100% - 70px) / 7)' }} />)}
          </colgroup>
          <thead>
            <tr>
              <th className="p-1.5 text-center font-black border-2 text-sm print:text-lg"
                style={{fontFamily:'SimHei,sans-serif', backgroundColor: theme.headerBg, color: theme.headerText, borderColor: theme.border }}>
                时段
              </th>
              {([1, 2, 3, 4, 5, 6, 7] as const).map((day) => (
                <th key={day} className="p-1.5 text-center font-black border-2 text-sm print:text-lg"
                  style={{fontFamily:'SimHei,sans-serif', backgroundColor: theme.headerBg, color: theme.headerText, borderColor: theme.border, width: `${100/7}%` }}>
                  <div>{WEEKDAY_NAMES[day]}</div>
                  <div className="text-[10px] font-normal opacity-80">
                    {currentPlan ? (() => {
                      const d = new Date(currentPlan.weekStart);
                      d.setDate(d.getDate() + day - 1);
                      return (d.getMonth() + 1) + '/' + d.getDate();
                    })() : ''}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeSlots.map((slotId) => (
              <tr key={slotId}>
                {/* 左侧时段标 — 只在这里显示时间 */}
                <td className="p-2 text-center border-2 align-middle"
                  style={{ backgroundColor: theme.bg, color: theme.cellText, borderColor: theme.border }}>
                  <div className="font-black text-lg">{SLOT_LABELS[slotId]}</div>
                  <div className="text-[10px] text-warm-500 leading-tight flex flex-col items-center">
                    <span>{currentPlan?.timeConfig?.[1]?.[slotId]?.startTime || '?'}</span>
                    <span className="text-[8px] text-warm-400">至</span>
                    <span>{currentPlan?.timeConfig?.[1]?.[slotId]?.endTime || '?'}</span>
                  </div>
                </td>

                {([1, 2, 3, 4, 5, 6, 7] as const).map((day) => {
                  const cell = getCell(slotId, day);
                  const activityName = getActivityName(cell);
                  const act = getActivity(cell);
                  const outdoor = hasOutdoorKeyword(cell?.note || '') || hasOutdoorKeyword(activityName);
                  const occupied = cellHasActivity(cell);

                  return (
                    <td key={day}
                      className="relative p-1.5 border-2 align-top cursor-pointer print:h-[160px]"
                      style={{
                        backgroundColor: theme.cellBg,
                        color: theme.cellText,
                        borderColor: theme.border,
                        height: '160px',
                        minHeight: '160px',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                      }}
                      onClick={() => { setPickSlot({ slotId, weekday: day }); setSearchQuery(''); }}
                    >
                      {/* ===== 图片占位符（120x80） ===== */}
                      <div className="mb-1 no-print">
                        {cell?.imageBase64 ? (
                          <div className="relative group">
                            <img src={cell.imageBase64} alt="活动图片"
                              className="w-full object-cover rounded border"
                              style={{
                                height: `${cell.imageHeight || 60}px`,
                                borderColor: theme.border,
                                objectPosition: `${cell.imageOffsetX ?? 50}% ${cell.imageOffsetY ?? 50}%`,
                              }} />
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 group-hover:bg-black/30 transition-colors print:hidden">
                              <button onClick={(e) => { e.stopPropagation();
                                setCropPos({ x: cell.imageOffsetX ?? 50, y: cell.imageOffsetY ?? 50 });
                                setCropSlot({ slotId, weekday: day });
                              }}
                                className="opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-green-500/90 text-white text-[10px] rounded">
                                裁剪
                              </button>
                              <button onClick={(e) => { e.stopPropagation();
                                const input = document.createElement('input');
                                input.type = 'file'; input.accept = 'image/*';
                                input.onchange = (ev: any) => handleImageUpload(ev, slotId, day);
                                input.click();
                              }}
                                className="opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-white/90 text-[10px] rounded">
                                更换
                              </button>
                              <button onClick={(e) => { e.stopPropagation();
                                const h = cell.imageHeight || 80;
                                const nextH = h >= 80 ? 40 : h >= 60 ? 80 : 60;
                                doUpdateCell(slotId, day as Weekday, { imageHeight: nextH });
                              }}
                                className="opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-blue-500/90 text-white text-[10px] rounded">
                                {cell.imageHeight || 80}px
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); doUpdateCell(slotId, day as Weekday, { imageBase64: null }); }}
                                className="opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-red-500/90 text-white text-[10px] rounded">
                                删除
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button onClick={(e) => {
                              e.stopPropagation();
                              const input = document.createElement('input');
                              input.type = 'file'; input.accept = 'image/*';
                              input.onchange = (ev: any) => handleImageUpload(ev, slotId, day);
                              input.click();
                            }}
                              className="flex-1 py-1 border border-dashed border-warm-300 rounded text-[9px] text-warm-400 hover:text-warm-600 hover:border-warm-500 transition-colors">
                              + 上传
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setShowImageGallery({ slotId, weekday: day }); }}
                              className="flex-1 py-1 border border-dashed border-warm-300 rounded text-[9px] text-warm-400 hover:text-warm-600 hover:border-warm-500 transition-colors">
                              🖼 图库
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 打印时显示图片 */}
                      {cell?.imageBase64 && (
                        <div className="hidden print:block mb-1">
                          <img src={cell.imageBase64} alt="" className="w-full object-cover rounded border" style={{ height: `${cell.imageHeight || 80}px` }} />
                        </div>
                      )}

                      {/* 移除按钮 — 有活动时显示 */}
                      {occupied && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            doClearCell(slotId, day as Weekday);
                          }}
                          className="absolute top-0.5 right-0.5 text-[9px] text-red-400 hover:text-red-600 print:hidden z-20"
                          title="移除活动"
                        >
                          ✕
                        </button>
                      )}

                      {/* ===== 活动名称 — 橙色突出（始终显示） ===== */}
                      <div className="mb-1.5">
                        <div
                          className="text-center px-1 py-0.5 rounded"
                          style={{backgroundColor:theme.accent+'15', borderLeft:'3px solid '+theme.accent}}
                        >
                          {activityName ? (
                            <span
                              className="text-[17px] font-black leading-tight"
                              style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (act) setDetailActivity(act);
                              }}
                            >
                              {activityName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-warm-300 italic leading-tight no-print">
                              点击选择活动
                            </span>
                          )}
                        </div>
                        {/* ===== 额外活动（第二活动） ===== */}
                        {(cell?.extraActivities || []).map((ea) => {
                          const eaAct = activities.find(a => a.id === ea.activityId);
                          if (!eaAct) return null;
                          return (
                            <div key={ea.activityId}
                              className="mt-1 rounded px-1 py-0.5"
                              style={{backgroundColor:theme.accent+'10', borderLeft:'2px solid '+theme.accent}}>
                              <div className="flex items-center gap-1">
                                <span className="text-[13px] font-bold leading-tight flex-1"
                                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                  onClick={(e) => { e.stopPropagation(); setDetailActivity(eaAct); }}>
                                  {eaAct.name}
                                </span>
                                {ea.venue && <span className="text-[9px] text-warm-400">{ea.venue}</span>}
                                <button onClick={(e) => { e.stopPropagation();
                                  handleRemoveExtraActivity(slotId, day, ea.activityId);
                                }}
                                  className="text-[9px] text-red-300 hover:text-red-500 print:hidden shrink-0">✕</button>
                              </div>
                              {/* 第二活动时间 — 名称下方小字显示 */}
                              {ea.startTime && ea.endTime && (
                                <div className="text-[9px] text-warm-500 leading-tight mt-0.5 ml-0.5">
                                  🕐 {ea.startTime}-{ea.endTime}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {/* 添加第二个活动按钮 */}
                        {activityName && (cell?.extraActivities || []).length < 2 && (
                          <button onClick={(e) => {
                            e.stopPropagation();
                            setExtraPickSlot({ slotId, weekday: day });
                          }}
                            className="w-full mt-1 text-[10px] text-warm-400 border border-dashed border-warm-300 rounded hover:bg-warm-50 hover:text-warm-600 transition-colors print:hidden">
                            ＋ 添加第二个活动
                          </button>
                        )}
                      </div>

                      {/* ===== 活动场所 — 蓝色突出（始终显示） ===== */}
                      <div className="mb-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setVenueEditValue(cell?.venue || '');
                            venueStore.openVenueEditor(
                              `${WEEKDAY_NAMES[day as Weekday]} ${SLOT_LABELS[slotId as SlotId]}`,
                              cell?.venue || '',
                              (v) => doUpdateCell(slotId, day as Weekday, { venue: v })
                            );
                          }}
                          className="w-full text-center text-xs print:text-sm leading-tight px-1 py-0.5 rounded flex items-center justify-center gap-1"
                          style={{backgroundColor:'#eff6ff', borderLeft:'3px solid #3b82f6'}}
                        >
                          <MapPin className="w-2.5 h-2.5 print:w-3 print:h-3 shrink-0 text-blue-500" />
                          <span className="text-blue-700" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{cell?.venue || '点击添加场所'}</span>
                        </button>
                      </div>

                      {/* ===== 备注/提醒 — 绿色突出（始终显示） ===== */}
                      <div>
                        {/* 编辑用 textarea（屏幕显示） */}
                        <textarea
                          defaultValue={cell?.note || ''}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val !== (cell?.note || '')) {
                              doUpdateCell(slotId, day as Weekday, { note: val });
                            }
                          }}
                          placeholder="提醒..."
                          rows={2}
                          className={`w-full text-center text-xs leading-tight px-1 py-0.5 rounded resize-vertical outline-none break-words no-print ${
                            outdoor ? 'text-red-600 font-semibold' : 'text-warm-500'
                          }`}
                          style={{
                            minHeight: '24px',
                            backgroundColor: outdoor ? '#fef2f2' : '#f0fdf4',
                            borderLeft: outdoor ? '3px solid #ef4444' : '3px solid #22c55e',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        />
                        {/* 打印用纯文本（完整显示） */}
                        {cell?.note && (
                          <div
                            className="hidden print:block text-xs leading-snug px-1 py-0.5 text-center"
                            style={{
                              backgroundColor: outdoor ? '#fef2f2' : '#f0fdf4',
                              borderLeft: outdoor ? '3px solid #ef4444' : '3px solid #22c55e',
                              overflowWrap: 'break-word',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {cell.note}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* ===== 天气变化提醒 ===== */}
        {templ?.hasWeather !== false && (
        <div className="mt-3">
          {/* 天气预设 — 只在屏幕显示 */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-2 no-print">
            {[
              '晴好☀️ 气温15-22°C，适宜户外活动',
              '多云⛅ 注意早晚温差，及时添衣',
              '阴雨🌧️ 备好雨具，户外活动注意防滑',
              '降温❄️ 最低8°C，注意老人保暖',
              '升温🔥 最高28°C，户外注意防晒补水',
              '大风🌬️ 注意防风，减少户外活动',
              '雾霾😷 空气质量不佳，减少外出',
            ].map((w) => (
              <button key={w} onClick={async () => {
                if (currentPlan) {
                  const { putItem } = await import('../db');
                  await putItem('weeklyPlans', { ...currentPlan, weatherReminder: w });
                  useWeeklyPlanStore.getState().loadOrCreatePlan(currentPlan.weekStart);
                }
              }}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  currentPlan?.weatherReminder === w
                    ? 'bg-warm-500 text-white border-warm-500'
                    : 'bg-white text-warm-600 border-warm-200 hover:bg-warm-50'
                }`}>
                {w}
              </button>
            ))}
          </div>
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              if (currentPlan) {
                import('../db').then(({ putItem }) => {
                  putItem('weeklyPlans', { ...currentPlan, weatherReminder: e.currentTarget.textContent || '' }).then(() => {
                    useWeeklyPlanStore.getState().loadOrCreatePlan(currentPlan.weekStart);
                  });
                });
              }
            }}
            className="w-full text-center text-xl print:text-base font-bold text-warm-700 outline-none"
            style={{fontFamily:'SimSun,serif', minHeight:'1.5em'}}
          >
            {currentPlan?.weatherReminder || '点击此处添加天气变化提醒...'}
          </div>
        </div>
        )}
      </div>

      {/* ===== 活动选择弹窗（主活动） ===== */}
      {pickSlot && renderActivityPicker({
        title: `${WEEKDAY_NAMES[pickSlot.weekday as Weekday]} · ${SLOT_LABELS[pickSlot.slotId as SlotId]}`,
        onPick: handlePickActivity,
        onCustom: (name, venue) => {
          doUpdateCell(pickSlot.slotId, pickSlot.weekday as Weekday, { customText: name, venue });
          setPickSlot(null); setSearchQuery('');
        },
        onClear: () => handleClearCell(pickSlot.slotId, pickSlot.weekday),
        onClose: () => { setPickSlot(null); setSearchQuery(''); },
      })}

      {/* ===== 活动选择弹窗（额外活动） ===== */}
      {extraPickSlot && renderActivityPicker({
        title: `${WEEKDAY_NAMES[extraPickSlot.weekday as Weekday]} · ${SLOT_LABELS[extraPickSlot.slotId as SlotId]}（第二活动）`,
        onPick: handlePickExtraActivity,
        onCustom: (name, venue) => {
          const cell = getCell(extraPickSlot.slotId, extraPickSlot.weekday);
          const extras = cell?.extraActivities || [];
          const startTime = prompt('第二活动开始时间（可选）：', '') || undefined;
          const endTime = prompt('第二活动结束时间（可选）：', '') || undefined;
          doUpdateCell(extraPickSlot.slotId, extraPickSlot.weekday as Weekday, {
            extraActivities: [...extras, { activityId: name, venue, startTime, endTime }],
          });
          setExtraPickSlot(null); setSearchQuery('');
        },
        onClear: () => { setExtraPickSlot(null); setSearchQuery(''); },
        onClose: () => { setExtraPickSlot(null); setSearchQuery(''); },
      })}


      {/* 活动详情弹窗 */}
      {detailActivity && (
        <ActivityDetailModal activity={detailActivity} open={!!detailActivity}
          onClose={() => setDetailActivity(null)} />
      )}

      {/* ===== 场所选择弹窗 ===== */}
      {/* ===== 场所选择弹窗 ===== */}
      {venueStore.editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => venueStore.closeVenueEditor()}>
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-warm-800 mb-3">
              选择场所 — {venueStore.editing.slotLabel}
            </h3>

            {/* 当前值输入 */}
            <input
              type="text"
              value={venueEditValue}
              onChange={(e) => setVenueEditValue(e.target.value)}
              placeholder="输入场所名称..."
              autoFocus
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-warm-400 mb-3"
            />

            {/* 建议列表 */}
            <div className="max-h-48 overflow-y-auto space-y-0.5 mb-3">
              {[
                ...new Set([
                  ...activities.map((a) => a.venue).filter(Boolean),
                  ...venueStore.suggestions,
                ]),
              ].map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    venueStore.editing?.onSave(v);
                    venueStore.closeVenueEditor();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    venueEditValue === v
                      ? 'bg-warm-100 text-warm-800 font-medium'
                      : 'hover:bg-warm-50 text-warm-600'
                  }`}
                >
                  <MapPin className="w-3 h-3 inline mr-1.5" />
                  {v}
                </button>
              ))}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const val = venueEditValue.trim();
                  if (val) {
                    venueStore.addSuggestion(val);
                    venueStore.editing?.onSave(val);
                    venueStore.closeVenueEditor();
                  }
                }}
                className="flex-1 px-3 py-2 bg-warm-500 text-white rounded-lg text-sm hover:bg-warm-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" />
                确认
              </button>
              <button onClick={() => venueStore.closeVenueEditor()}
                className="px-3 py-2 border border-warm-200 rounded-lg text-sm text-warm-600 hover:bg-warm-50 transition-colors">
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 图片库选择弹窗 ===== */}
      {showImageGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowImageGallery(null)}>
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-warm-800">从图库选择图片</h3>
              <button onClick={() => setShowImageGallery(null)}
                className="p-1 hover:bg-warm-50 rounded-lg">
                <X className="w-4 h-4 text-warm-400" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {PRESET_IMAGES.map((img, i) => (
                <button
                  key={i}
                  onClick={() => handlePickPresetImage(img.data)}
                  className="p-1 rounded-lg border border-warm-200 hover:border-warm-500 hover:shadow-sm transition-all"
                >
                  <img src={img.data} alt={img.name}
                    className="w-full h-14 object-cover rounded" />
                  <p className="text-[10px] text-warm-600 text-center mt-0.5">{img.name}</p>
                </button>
              ))}
            </div>

            <p className="text-[10px] text-warm-400 text-center mt-3">
              点击图片选择，也可以返回点击「上传」从本地上传
            </p>
          </div>
        </div>
      )}

      {/* ===== 重置确认弹窗 ===== */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowResetConfirm(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-warm-800 mb-2">重置活动内容</h3>
            <p className="text-sm text-warm-600 mb-1">将清空本周所有活动选择、场所、备注和图片。</p>
            <p className="text-sm text-warm-500 mb-4">⏰ 时间段设置不会改变。</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border border-warm-200 rounded-lg text-sm text-warm-600 hover:bg-warm-50">
                取消
              </button>
              <button onClick={async () => {
                if (currentPlan) {
                  const { putItem } = await import('../db');
                  const updated = { ...currentPlan, cells: {} };
                  await putItem('weeklyPlans', updated);
                  useWeeklyPlanStore.getState().loadOrCreatePlan(currentPlan.weekStart);
                }
                setShowResetConfirm(false);
              }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 图片裁剪弹窗 ===== */}
      {cropSlot && cellHasActivity(getCell(cropSlot.slotId, cropSlot.weekday)) && (() => {
        const cell = getCell(cropSlot.slotId, cropSlot.weekday);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setCropSlot(null)}>
            <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-lg mx-4"
              onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-warm-800 mb-3">调整图片显示区域</h3>

              {/* 预览区 */}
              <div className="relative w-full h-48 overflow-hidden rounded-lg border border-warm-200 mb-3 bg-gray-100">
                {cell?.imageBase64 && (
                  <img src={cell.imageBase64} alt=""
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: `${cropPos.x}% ${cropPos.y}%`,
                      transition: 'object-position 0.05s',
                    }}
                    draggable
                    onDragStart={(e) => {
                      const startX = cropPos.x;
                      const startY = cropPos.y;
                      const startMX = e.clientX;
                      const startMY = e.clientY;
                      const onMove = (ev: DragEvent) => {
                        if (!ev.clientX) return;
                        const dx = (ev.clientX - startMX) / 2;
                        const dy = (ev.clientY - startMY) / 2;
                        setCropPos({
                          x: Math.max(0, Math.min(100, startX + dx)),
                          y: Math.max(0, Math.min(100, startY + dy)),
                        });
                      };
                      const onEnd = () => {
                        document.removeEventListener('drag', onMove);
                        document.removeEventListener('dragend', onEnd);
                      };
                      document.addEventListener('drag', onMove);
                      document.addEventListener('dragend', onEnd);
                    }}
                  />
                )}
              </div>

              {/* 拖拽提示 */}
              <p className="text-[10px] text-warm-400 text-center mb-3">← 拖拽图片调整显示区域 →</p>

              {/* 方向按钮 */}
              <div className="flex justify-center gap-2 mb-3">
                <button onClick={() => setCropPos(p => ({ x: Math.max(0, p.x - 5), y: p.y }))}
                  className="px-3 py-1 border border-warm-200 rounded text-xs hover:bg-warm-50">←</button>
                <button onClick={() => setCropPos(p => ({ x: p.x, y: Math.max(0, p.y - 5) }))}
                  className="px-3 py-1 border border-warm-200 rounded text-xs hover:bg-warm-50">↑</button>
                <button onClick={() => setCropPos(p => ({ x: p.x, y: Math.min(100, p.y + 5) }))}
                  className="px-3 py-1 border border-warm-200 rounded text-xs hover:bg-warm-50">↓</button>
                <button onClick={() => setCropPos(p => ({ x: Math.min(100, p.x + 5), y: p.y }))}
                  className="px-3 py-1 border border-warm-200 rounded text-xs hover:bg-warm-50">→</button>
                <button onClick={() => setCropPos({ x: 50, y: 50 })}
                  className="px-3 py-1 border border-warm-200 rounded text-xs hover:bg-warm-50">居中</button>
              </div>

              <div className="flex gap-2 justify-end">
                <button onClick={() => setCropSlot(null)}
                  className="px-4 py-2 border border-warm-200 rounded-lg text-sm text-warm-600 hover:bg-warm-50">取消</button>
                <button onClick={() => {
                  doUpdateCell(cropSlot.slotId, cropSlot.weekday as Weekday, {
                    imageOffsetX: cropPos.x,
                    imageOffsetY: cropPos.y,
                  });
                  // 同步裁剪到活动库记忆
                  const cell = getCell(cropSlot.slotId, cropSlot.weekday);
                  if (cell?.activityId) {
                    venueStore.setActivityVenue(cell.activityId + '_ox', String(cropPos.x));
                    venueStore.setActivityVenue(cell.activityId + '_oy', String(cropPos.y));
                  }
                  setCropSlot(null);
                }}
                  className="px-4 py-2 bg-warm-500 text-white rounded-lg text-sm hover:bg-warm-600">确认</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
