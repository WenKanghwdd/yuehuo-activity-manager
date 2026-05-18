import { useEffect, useState, useRef, useCallback } from 'react';
import { Printer, Palette, X, Clock, Search, MapPin, Plus } from 'lucide-react';
import { useWeeklyPlanStore } from '../store/weeklyPlanStore';
import { useThemeStore } from '../store/themeStore';
import { useActivityLibraryStore } from '../store/activityLibraryStore';
import { useVenueStore } from '../store/venueStore';
import { THEME_CONFIGS, WEEKDAY_NAMES } from '../types';
import type { ThemeType, WeeklyPlanCell, Activity, Weekday, SlotId } from '../types';
import { hasOutdoorKeyword } from '../utils/helpers';
import { useReactToPrint } from 'react-to-print';
import ActivityDetailModal from '../components/activityLibrary/ActivityDetailModal';

const SLOT_LABELS: Record<SlotId, string> = { morning: '上午', afternoon: '下午', evening: '晚上' };
const SLOT_ORDER: SlotId[] = ['morning', 'afternoon', 'evening'];

export default function WeeklyPlanPage() {
  const { currentPlan, loaded, loading, loadOrCreatePlan, updateCell, setTheme, setTimeRange, clearCell } =
    useWeeklyPlanStore();
  const { currentTheme, setTheme: setAppTheme } = useThemeStore();
  const { activities, loaded: libLoaded, loadActivities } = useActivityLibraryStore();
  const venueStore = useVenueStore();
  const [venueEditValue, setVenueEditValue] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [pickSlot, setPickSlot] = useState<{ slotId: string; weekday: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);
  const [showAllTimeEdit, setShowAllTimeEdit] = useState(false);

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
      evening: { start: tc.evening.startTime, end: tc.evening.endTime },
    });
  }, [currentPlan]);



  useEffect(() => {
    if (!libLoaded) loadActivities();
    if (!venueStore.loaded) venueStore.loadAll();
    loadOrCreatePlan();
  }, [loadOrCreatePlan, loadActivities, libLoaded, venueStore]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `@page { size: A4 landscape; margin: 5mm; }`,
  });

  const getCell = (slotId: string, weekday: number): WeeklyPlanCell | undefined =>
    currentPlan?.cells[`${slotId}-${weekday}`];

  const getActivityName = (cell?: WeeklyPlanCell): string => {
    if (cell?.customText) return cell.customText;
    if (cell?.activityId) {
      const act = activities.find((a) => a.id === cell.activityId);
      return act?.name || '';
    }
    return '';
  };

  const getActivity = (cell?: WeeklyPlanCell): Activity | undefined =>
    cell?.activityId ? activities.find((a) => a.id === cell.activityId) : undefined;

  const handlePickActivity = (activity: Activity) => {
    if (!pickSlot) return;
    // 检查是否有之前记住的场所
    const savedVenue = venueStore.getActivityVenue(activity.id);
    updateCell(pickSlot.slotId, pickSlot.weekday as Weekday, {
      activityId: activity.id,
      customText: '',
      venue: savedVenue || activity.venue || '',
    });
    setPickSlot(null);
    setSearchQuery('');
  };

  const handleClearCell = (slotId: string, weekday: number) => {
    clearCell(slotId, weekday as Weekday);
    setPickSlot(null);
    setSearchQuery('');
  };

  const applyTimeToAll = (slotId: SlotId, start: string, end: string) => {
    for (let d = 1; d <= 7; d++) setTimeRange(d as Weekday, slotId, start, end);
    setShowAllTimeEdit(false);
  };

  // Time editing is now only via the unified time editor

  const filteredActivities = activities.filter((a) =>
    !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const theme = THEME_CONFIGS[currentTheme];

  const cellHasActivity = (cell: WeeklyPlanCell | undefined): boolean => {
    if (!cell) return false;
    return !!cell.activityId || !!cell.customText;
  };

  if (loading && !loaded) {
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
          <Palette className="w-4 h-4" /> 风格模板
        </button>
        <button onClick={() => { syncUniTime(); setShowAllTimeEdit(true); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-warm-200 rounded-lg hover:bg-warm-50 text-sm text-warm-700 transition-colors">
          <Clock className="w-4 h-4" /> 统一设置时间
        </button>
        <div className="flex-1" />
        <select onChange={() => handlePrint?.()}
          className="px-3 py-2 border border-warm-200 rounded-lg text-sm text-warm-700 bg-white">
          <option value="A4">A4 横向</option>
          <option value="A3">A3 横向</option>
        </select>
        <button onClick={() => handlePrint?.()}
          className="flex items-center gap-1.5 px-4 py-2 bg-warm-500 text-white rounded-lg hover:bg-warm-600 text-sm font-medium transition-colors">
          <Printer className="w-4 h-4" /> 打印
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
              {SLOT_ORDER.map((slotId) => {
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

      {/* ===== 周计划表格 ===== */}
      <div ref={printRef}
        className="w-full max-w-[297mm] mx-auto"
        style={{ minWidth: '700px', backgroundColor: theme.bg }}>
        <table className="w-full border-collapse text-xs print:text-xs"
          style={{ backgroundColor: theme.bg, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '70px' }} />
            {[1, 2, 3, 4, 5, 6, 7].map((d) => <col key={d} style={{ width: 'auto' }} />)}
          </colgroup>
          <thead>
            <tr>
              <th className="p-1.5 text-center font-medium border"
                style={{ backgroundColor: theme.headerBg, color: theme.headerText, borderColor: theme.border }}>
                时段
              </th>
              {([1, 2, 3, 4, 5, 6, 7] as const).map((day) => (
                <th key={day} className="p-1.5 text-center font-medium border"
                  style={{ backgroundColor: theme.headerBg, color: theme.headerText, borderColor: theme.border }}>
                  {WEEKDAY_NAMES[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOT_ORDER.map((slotId) => (
              <tr key={slotId}>
                {/* 左侧时段标 — 只在这里显示时间 */}
                <td className="p-2 text-center border align-middle"
                  style={{ backgroundColor: theme.bg, color: theme.cellText, borderColor: theme.border }}>
                  <div className="font-semibold text-xs">{SLOT_LABELS[slotId]}</div>
                  <div className="text-[10px] text-warm-500 leading-tight">
                    {currentPlan?.timeConfig?.[1]?.[slotId]?.startTime || '?'}~{currentPlan?.timeConfig?.[1]?.[slotId]?.endTime || '?'}
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
                      className="relative p-1.5 border align-top cursor-pointer"
                      style={{
                        backgroundColor: theme.cellBg,
                        color: theme.cellText,
                        borderColor: theme.border,
                        height: '80px',
                        minHeight: '80px',
                      }}
                      onClick={() => { setPickSlot({ slotId, weekday: day }); setSearchQuery(''); }}
                    >
                      {/* 移除按钮 — 有活动时显示 */}
                      {occupied && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearCell(slotId, day as Weekday);
                          }}
                          className="absolute top-0.5 right-0.5 text-[9px] text-red-400 hover:text-red-600 print:hidden z-20"
                          title="移除活动"
                        >
                          ✕
                        </button>
                      )}

                      {/* ===== 活动名称 ===== */}
                      {activityName ? (
                        <div
                          className="text-sm font-medium leading-tight mb-0.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (act) setDetailActivity(act);
                          }}
                        >
                          {activityName}
                        </div>
                      ) : (
                        <div className="text-[10px] text-warm-300 italic leading-tight no-print">
                          点击选择活动
                        </div>
                      )}

                      {/* ===== 活动场所（点击选择/编辑） ===== */}
                      {(cell?.venue || activityName) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setVenueEditValue(cell?.venue || '');
                            venueStore.openVenueEditor(
                              `${WEEKDAY_NAMES[day as Weekday]} ${SLOT_LABELS[slotId as SlotId]}`,
                              cell?.venue || '',
                              (v) => updateCell(slotId, day as Weekday, { venue: v })
                            );
                          }}
                          className="w-full text-left text-[10px] text-warm-500 hover:text-warm-700 leading-tight flex items-center gap-0.5 print:no-underline"
                        >
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{cell?.venue || '点击选择场所'}</span>
                        </button>
                      )}

                      {/* 备注 */}
                      {cell?.note && (
                        <div className={`text-[9px] leading-tight ${outdoor ? 'text-red-600 font-semibold' : 'text-warm-500'}`}>
                          {outdoor && '⚠️ '}{cell.note}
                        </div>
                      )}

                      {/* 图片 */}
                      {cell?.imageBase64 && (
                        <img src={cell.imageBase64} alt="活动图片"
                          className="mt-0.5 w-full h-10 object-cover rounded border"
                          style={{ borderColor: theme.border }} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== 活动选择弹窗 ===== */}
      {pickSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => { setPickSlot(null); setSearchQuery(''); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>

            {/* 头 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-warm-100 shrink-0">
              <h3 className="text-base font-semibold text-warm-800">
                {WEEKDAY_NAMES[pickSlot.weekday as Weekday]} · {SLOT_LABELS[pickSlot.slotId as SlotId]}
              </h3>
              <button onClick={() => { setPickSlot(null); setSearchQuery(''); }}
                className="p-1 hover:bg-warm-50 rounded-lg">
                <X className="w-5 h-5 text-warm-400" />
              </button>
            </div>

            {/* 搜索 */}
            <div className="px-5 py-3 border-b border-warm-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                <input type="text" autoFocus value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索活动..."
                  className="w-full pl-9 pr-3 py-2 border border-warm-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-warm-400" />
              </div>
            </div>

            {/* 活动列表 */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-10 text-warm-400 text-sm">暂无活动</div>
              ) : (
                <div className="space-y-1">
                  {filteredActivities.map((act) => (
                    <button key={act.id} onClick={() => handlePickActivity(act)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-warm-50 transition-colors text-left border border-transparent hover:border-warm-200">
                      <div className="w-10 h-10 rounded-lg bg-warm-100 flex items-center justify-center text-warm-500 text-xs font-bold shrink-0">
                        {act.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-warm-800">{act.name}</p>
                        <p className="text-xs text-warm-400 truncate">{act.tags.join(' · ')}</p>
                      </div>
                      <span className="text-xs text-warm-300 shrink-0">选择 →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="px-5 py-3 border-t border-warm-100 flex gap-2 shrink-0">
              <button onClick={() => {
                const name = prompt('输入活动名称：');
                if (name?.trim()) {
                  const venue = prompt('活动场所（可选）：') || '';
                  updateCell(pickSlot.slotId, pickSlot.weekday as Weekday, { customText: name.trim(), venue });
                  setPickSlot(null); setSearchQuery('');
                }
              }}
                className="flex-1 px-3 py-2 border border-warm-200 rounded-lg text-sm text-warm-600 hover:bg-warm-50 transition-colors">
                手动输入
              </button>
              <button onClick={() => handleClearCell(pickSlot.slotId, pickSlot.weekday)}
                className="px-3 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors">
                清空
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
