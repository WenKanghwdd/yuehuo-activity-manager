import { useEffect, useState, useCallback, useRef } from 'react';
import { Printer, Palette, Plus, X, ImagePlus, AlertTriangle } from 'lucide-react';
import { useWeeklyPlanStore } from '../store/weeklyPlanStore';
import { useThemeStore } from '../store/themeStore';
import { THEME_CONFIGS, DEFAULT_TIME_SLOTS, WEEKDAY_NAMES } from '../types';
import type { ThemeType, WeeklyPlanCell, Activity } from '../types';
import ActivityDetailModal from '../components/activityLibrary/ActivityDetailModal';
import { hasOutdoorKeyword } from '../utils/helpers';
import { useReactToPrint } from 'react-to-print';
import { useActivityLibraryStore } from '../store/activityLibraryStore';

export default function WeeklyPlanPage() {
  const { currentPlan, loaded, loading, loadOrCreatePlan, updateCell, setTheme, clearCell } =
    useWeeklyPlanStore();
  const { currentTheme, setTheme: setAppTheme } = useThemeStore();
  const { activities, loaded: libLoaded, loadActivities } = useActivityLibraryStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ timeSlotId: string; weekday: number } | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [editingCell, setEditingCell] = useState<{ timeSlotId: string; weekday: number } | null>(null);
  const [editText, setEditText] = useState('');
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);

  useEffect(() => {
    if (!libLoaded) loadActivities();
    loadOrCreatePlan();
  }, [loadOrCreatePlan, loadActivities, libLoaded]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `@page { size: A4 landscape; margin: 10mm; }`,
  });

  const getCell = (timeSlotId: string, weekday: number): WeeklyPlanCell | undefined => {
    return currentPlan?.cells[`${timeSlotId}-${weekday}`];
  };

  const getActivityName = (cell?: WeeklyPlanCell): string => {
    if (cell?.customText) return cell.customText;
    if (cell?.activityId) {
      const act = activities.find((a) => a.id === cell.activityId);
      return act?.name || '';
    }
    return '';
  };

  const getActivity = (cell?: WeeklyPlanCell): Activity | undefined => {
    if (cell?.activityId) {
      return activities.find((a) => a.id === cell.activityId);
    }
    return undefined;
  };

  const handleImageUpload = (timeSlotId: string, weekday: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          updateCell(timeSlotId, weekday as 1|2|3|4|5|6|7, {
            imageBase64: ev.target.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddToPlan = (activity: Activity) => {
    if (selectedSlot) {
      updateCell(selectedSlot.timeSlotId, selectedSlot.weekday as 1|2|3|4|5|6|7, {
        activityId: activity.id,
        customText: '',
      });
      setShowActivityPicker(false);
      setSelectedSlot(null);
    }
  };

  const theme = THEME_CONFIGS[currentTheme];

  if (loading && !loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-warm-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 no-print">
        <button
          onClick={() => setShowThemePicker(!showThemePicker)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-warm-200 rounded-lg hover:bg-warm-50 text-sm text-warm-700 transition-colors"
        >
          <Palette className="w-4 h-4" />
          风格模板
        </button>
        <button
          onClick={() => handlePrint?.()}
          className="flex items-center gap-1.5 px-3 py-2 bg-warm-500 text-white rounded-lg hover:bg-warm-600 text-sm font-medium transition-colors"
        >
          <Printer className="w-4 h-4" />
          打印
        </button>
        <div className="flex-1" />
        <select
          onChange={(e) => handlePrint?.()} // dummy for paper size
          className="px-3 py-2 border border-warm-200 rounded-lg text-sm text-warm-700 bg-white"
        >
          <option value="A4">A4 横向</option>
          <option value="A3">A3 横向</option>
        </select>
      </div>

      {/* Theme Picker */}
      {showThemePicker && (
        <div className="no-print bg-white rounded-xl border border-warm-100 p-4 shadow-sm">
          <h3 className="text-sm font-medium text-warm-700 mb-3">选择风格模板</h3>
          <div className="flex flex-wrap gap-2">
            {Object.values(THEME_CONFIGS).map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTheme(t.key as ThemeType);
                  setAppTheme(t.key as ThemeType);
                  setShowThemePicker(false);
                }}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentTheme === t.key
                    ? 'ring-2 ring-warm-500 font-medium'
                    : 'hover:bg-warm-50'
                }`}
                style={{
                  backgroundColor: t.bg,
                  color: t.cellText,
                  borderColor: t.border,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activity Picker */}
      {showActivityPicker && (
        <div className="no-print bg-white rounded-xl border border-warm-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-warm-700">从活动库选择</h3>
            <button
              onClick={() => {
                setShowActivityPicker(false);
                setSelectedSlot(null);
              }}
              className="text-warm-400 hover:text-warm-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
            {activities.map((act) => (
              <button
                key={act.id}
                onClick={() => handleAddToPlan(act)}
                className="px-3 py-2 bg-warm-50 hover:bg-warm-100 rounded-lg text-sm text-warm-700 transition-colors text-left"
              >
                {act.name}
                <span className="ml-2 text-[10px] text-warm-400">
                  {act.tags.join(', ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Plan Table */}
      <div
        ref={printRef}
        className="overflow-x-auto rounded-xl border"
        style={{ borderColor: theme.border }}
      >
        <table className="w-full min-w-[800px] border-collapse text-sm" style={{ backgroundColor: theme.bg }}>
          {/* Header Row */}
          <thead>
            <tr>
              <th
                className="sticky left-0 z-10 w-28 p-2 text-xs font-medium text-center border-r border-b"
                style={{
                  backgroundColor: theme.headerBg,
                  color: theme.headerText,
                  borderColor: theme.border,
                }}
              >
                时间段
              </th>
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <th
                  key={day}
                  className="p-2 font-medium text-center text-xs border-b"
                  style={{
                    backgroundColor: theme.headerBg,
                    color: theme.headerText,
                    borderColor: theme.border,
                  }}
                >
                  {WEEKDAY_NAMES[day as 1|2|3|4|5|6|7]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEFAULT_TIME_SLOTS.map((slot) => (
              <tr key={slot.id}>
                <td
                  className="sticky left-0 z-10 p-2 text-xs font-medium border-r border-b whitespace-nowrap"
                  style={{
                    backgroundColor: theme.bg,
                    color: theme.cellText,
                    borderColor: theme.border,
                  }}
                >
                  {slot.label}
                </td>
                {([1, 2, 3, 4, 5, 6, 7] as const).map((day) => {
                  const cell = getCell(slot.id, day);
                  const activityName = getActivityName(cell);
                  const act = getActivity(cell);
                  const outdoor = hasOutdoorKeyword(cell?.note || '') || hasOutdoorKeyword(activityName);

                  return (
                    <td
                      key={day}
                      className="relative p-1.5 border-b border-r align-top min-h-[80px]"
                      style={{
                        backgroundColor: theme.cellBg,
                        color: theme.cellText,
                        borderColor: theme.border,
                      }}
                      onClick={() => {
                        setSelectedSlot({ timeSlotId: slot.id, weekday: day });
                      }}
                    >
                      {/* Image */}
                      {cell?.imageBase64 && (
                        <div className="mb-1">
                          <img
                            src={cell.imageBase64}
                            alt="活动图片"
                            className="w-20 h-14 object-cover rounded border"
                            style={{ borderColor: theme.border }}
                          />
                        </div>
                      )}

                      {/* Activity Name */}
                      {activityName && (
                        <div
                          className="text-xs font-medium cursor-pointer hover:text-warm-600 mb-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (act) setDetailActivity(act);
                          }}
                        >
                          {activityName}
                        </div>
                      )}

                      {/* Note */}
                      {cell?.note && (
                        <div
                          className={`text-[10px] ${outdoor ? 'text-red-600 font-medium' : ''} mb-1`}
                        >
                          {outdoor && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                          {cell.note}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1 mt-1 opacity-0 hover:opacity-100 transition-opacity no-print">
                        <label
                          className="p-0.5 cursor-pointer text-warm-400 hover:text-warm-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ImagePlus className="w-3 h-3" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(slot.id, day, e)}
                          />
                        </label>
                        <button
                          className="p-0.5 text-warm-400 hover:text-warm-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCell({ timeSlotId: slot.id, weekday: day });
                            setEditText(cell?.customText || '');
                          }}
                          title="编辑文字"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          className="p-0.5 text-warm-400 hover:text-warm-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSlot({ timeSlotId: slot.id, weekday: day });
                            setShowActivityPicker(true);
                          }}
                          title="从活动库选择"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0l-4-4m4 4l-4 4" />
                          </svg>
                        </button>
                        {cell && (
                          <button
                            className="p-0.5 text-red-400 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearCell(slot.id, day);
                            }}
                            title="清空"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Inline edit input */}
                      {editingCell?.timeSlotId === slot.id && editingCell?.weekday === day && (
                        <div
                          className="absolute inset-0 z-20 bg-white/95 border-2 border-warm-500 rounded p-1 flex flex-col"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <textarea
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            placeholder="直接输入活动内容..."
                            className="w-full flex-1 text-xs p-1 border-0 outline-none resize-none bg-transparent"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.shiftKey) return;
                              if (e.key === 'Enter') {
                                updateCell(slot.id, day as 1|2|3|4|5|6|7, { customText: editText });
                                setEditingCell(null);
                              }
                            }}
                          />
                          <div className="flex gap-1 justify-end mt-1">
                            <button
                              onClick={() => {
                                updateCell(slot.id, day as 1|2|3|4|5|6|7, { customText: editText });
                                setEditingCell(null);
                              }}
                              className="px-2 py-0.5 text-[10px] bg-warm-500 text-white rounded"
                            >
                              确定
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              className="px-2 py-0.5 text-[10px] border border-warm-200 rounded"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Note input area below cell */}
                      <div className="mt-1 no-print">
                        <input
                          type="text"
                          placeholder="备注/提醒"
                          value={cell?.note || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            updateCell(slot.id, day as 1|2|3|4|5|6|7, {
                              note: e.target.value,
                            });
                          }}
                          className="w-full text-[10px] p-0.5 border-0 border-b border-dashed border-warm-200 outline-none bg-transparent focus:border-warm-500"
                          style={{ color: theme.cellText }}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <ActivityDetailModal
        activity={detailActivity!}
        open={!!detailActivity}
        onClose={() => setDetailActivity(null)}
      />
    </div>
  );
}
