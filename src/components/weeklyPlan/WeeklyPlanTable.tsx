import { useState } from 'react';
import { AlertTriangle, FileText, Image } from 'lucide-react';
import type { Weekday } from '../../types';
import { DEFAULT_TIME_SLOTS, WEEKDAY_NAMES, THEME_CONFIGS } from '../../types';
import { useWeeklyPlanStore } from '../../store/weeklyPlanStore';
import { useThemeStore } from '../../store/themeStore';
import { useActivityLibraryStore } from '../../store/activityLibraryStore';
import { getWeekDates, hasOutdoorKeyword } from '../../utils/helpers';
import ActivityCellEditor from './ActivityCellEditor';

interface WeeklyPlanTableProps {
  weekStart: string;
}

export default function WeeklyPlanTable({ weekStart }: WeeklyPlanTableProps) {
  const { currentPlan } = useWeeklyPlanStore();
  const { currentTheme } = useThemeStore();
  const { activities } = useActivityLibraryStore();
  const weekDates = getWeekDates(weekStart);
  const theme = THEME_CONFIGS[currentPlan?.theme || currentTheme];

  const [editingCell, setEditingCell] = useState<{
    timeSlotId: string;
    weekday: Weekday;
  } | null>(null);

  const getCell = (timeSlotId: string, weekday: Weekday) => {
    if (!currentPlan) return undefined;
    return currentPlan.cells[`${timeSlotId}-${weekday}`];
  };

  const getActivity = (activityId: string | null) => {
    if (!activityId) return null;
    return activities.find((a) => a.id === activityId) || null;
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: theme.border }}>
        <table className="w-full border-collapse min-w-[800px]" style={{ backgroundColor: theme.bg }}>
          {/* Header */}
          <thead>
            <tr>
              <th
                className="sticky left-0 z-10 p-2 text-xs font-medium text-center border-r border-b w-24"
                style={{
                  backgroundColor: theme.headerBg,
                  color: theme.headerText,
                  borderColor: theme.border,
                }}
              >
                时段
              </th>
              {([1, 2, 3, 4, 5, 6, 7] as Weekday[]).map((day) => {
                const date = new Date(weekDates[day - 1]);
                return (
                  <th
                    key={day}
                    className="p-2 text-sm font-medium text-center border-b"
                    style={{
                      backgroundColor: theme.headerBg,
                      color: theme.headerText,
                      borderColor: theme.border,
                    }}
                  >
                    <div>{WEEKDAY_NAMES[day]}</div>
                    <div className="text-xs opacity-80">
                      {date.getMonth() + 1}/{date.getDate()}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {DEFAULT_TIME_SLOTS.map((slot) => (
              <tr key={slot.id}>
                <td
                  className="sticky left-0 z-10 p-2 text-xs font-medium text-center border-r border-b"
                  style={{
                    backgroundColor: theme.headerBg,
                    color: theme.headerText,
                    borderColor: theme.border,
                  }}
                >
                  {slot.label}
                </td>
                {([1, 2, 3, 4, 5, 6, 7] as Weekday[]).map((day) => {
                  const cell = getCell(slot.id, day);
                  const activity = getActivity(cell?.activityId || null);
                  const displayText = cell?.customText || activity?.name || '';
                  const outdoorWarning = hasOutdoorKeyword(displayText + (cell?.note || ''));

                  return (
                    <td
                      key={day}
                      onClick={() => setEditingCell({ timeSlotId: slot.id, weekday: day })}
                      className="p-2 border-b border-r cursor-pointer align-top transition-colors hover:opacity-90"
                      style={{
                        backgroundColor: outdoorWarning ? '#fef2f2' : theme.cellBg,
                        color: theme.cellText,
                        borderColor: outdoorWarning ? '#fecaca' : theme.border,
                      }}
                    >
                      {cell ? (
                        <div className="space-y-1.5 min-h-[100px]">
                          {/* Image thumbnail */}
                          {cell.imageBase64 ? (
                            <div className="w-full h-[80px] rounded overflow-hidden bg-gray-100">
                              <img
                                src={cell.imageBase64}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-[80px] rounded flex items-center justify-center"
                              style={{ backgroundColor: theme.border + '40' }}>
                              {activity?.images[0] ? (
                                <img src={activity.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Image className="w-6 h-6 opacity-30" />
                              )}
                            </div>
                          )}

                          {/* Activity name */}
                          <div className="flex items-start gap-1">
                            {outdoorWarning && (
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <p className={`text-xs leading-tight line-clamp-2 ${outdoorWarning ? 'text-red-700 font-medium' : ''}`}>
                              {displayText || <span className="opacity-30">点击添加</span>}
                            </p>
                          </div>

                          {/* Note indicator */}
                          {cell.note && (
                            <div className="flex items-center gap-1 mt-1">
                              <FileText className="w-3 h-3 text-gray-400" />
                              <p className="text-[10px] text-gray-500 truncate">{cell.note}</p>
                            </div>
                          )}

                          {/* Outdoor warning */}
                          {outdoorWarning && displayText && (
                            <p className="text-[10px] text-red-600 mt-1 leading-tight">
                              ⚠️ 外出活动需提前报名并获得家属同意
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="min-h-[100px] flex items-center justify-center">
                          <p className="text-xs opacity-30">点击添加活动</p>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editor modal */}
      {editingCell && (
        <ActivityCellEditor
          open={true}
          onClose={() => setEditingCell(null)}
          timeSlotId={editingCell.timeSlotId}
          weekday={editingCell.weekday}
          timeSlotLabel={
            DEFAULT_TIME_SLOTS.find((s) => s.id === editingCell.timeSlotId)?.label || ''
          }
          weekdayLabel={WEEKDAY_NAMES[editingCell.weekday]}
        />
      )}
    </>
  );
}
