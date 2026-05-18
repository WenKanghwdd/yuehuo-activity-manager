import React, { useRef, useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Calendar,
  List,
  Clock,
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import type { Elderly } from '../../types';
import { WEEKDAY_NAMES, DEFAULT_TIME_SLOTS } from '../../types';
import { useActivityRecordStore } from '../../store/activityRecordStore';
import { getMonday, getWeekDates, formatDate } from '../../utils/helpers';

type ViewMode = 'week' | 'day' | 'month';

interface ActivityRecordPanelProps {
  elderly: Elderly;
  onClose: () => void;
}

export const ActivityRecordPanel: React.FC<ActivityRecordPanelProps> = ({
  elderly,
  onClose,
}) => {
  const { getElderlyRecords } = useActivityRecordStore();
  const printRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(today.toISOString().split('T')[0]);

  const weekStart = useMemo(() => getMonday(new Date(currentDate)), [currentDate]);
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  // Get records for current view range
  const records = useMemo(() => {
    let startDate: string, endDate: string;
    if (viewMode === 'week') {
      startDate = weekDates[0];
      endDate = weekDates[6];
    } else if (viewMode === 'day') {
      startDate = currentDate;
      endDate = currentDate;
    } else {
      const d = new Date(currentDate);
      startDate = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    }
    return getElderlyRecords(elderly.id, startDate, endDate);
  }, [elderly.id, currentDate, viewMode, weekDates, getElderlyRecords]);

  const navigate = (direction: -1 | 1) => {
    const d = new Date(currentDate);
    if (viewMode === 'week') {
      d.setDate(d.getDate() + direction * 7);
    } else if (viewMode === 'day') {
      d.setDate(d.getDate() + direction);
    } else {
      d.setMonth(d.getMonth() + direction);
      d.setDate(1);
    }
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page { size: A4 landscape; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
    `,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'participated':
        return <span className="inline-block w-3 h-3 rounded-full bg-green-500" title="已参加" />;
      case 'not_participated':
        return <span className="inline-block w-3 h-3 rounded-full bg-red-400" title="未参加" />;
      default:
        return <span className="inline-block w-3 h-3 rounded-full bg-gray-300" title="未标记" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'participated':
        return 'bg-green-100 text-green-800';
      case 'not_participated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const getMonthDays = () => {
    const d = new Date(currentDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    // Fill in leading days from previous month
    const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = startPad - 1; i >= 0; i--) {
      const prev = new Date(year, month, -i);
      days.push({
        date: prev.toISOString().split('T')[0],
        day: prev.getDate(),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dayDate = new Date(year, month, i);
      days.push({
        date: dayDate.toISOString().split('T')[0],
        day: i,
        isCurrentMonth: true,
      });
    }

    // Fill trailing days
    while (days.length % 7 !== 0) {
      const next = new Date(year, month, days.length - startPad + 1);
      days.push({
        date: next.toISOString().split('T')[0],
        day: next.getDate(),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const monthDays = useMemo(getMonthDays, [currentDate]);
  const weekRows = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  // Group records by date for month view
  const recordsByDate = useMemo(() => {
    const map: Record<string, typeof records> = {};
    for (const r of records) {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    }
    return map;
  }, [records]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-warm-200 overflow-hidden">
      {/* Panel header */}
      <div className="p-4 border-b border-warm-100 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{elderly.name}</h3>
            {elderly.roomNumber && (
              <p className="text-sm text-gray-500">房间 {elderly.roomNumber}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode tabs */}
          <div className="flex bg-warm-50 rounded-lg p-0.5">
            {(['week', 'day', 'month'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${viewMode === mode
                    ? 'bg-white text-warm-700 shadow-sm'
                    : 'text-gray-500 hover:text-warm-700'}`}
              >
                {mode === 'week' ? '周记录' : mode === 'day' ? '日记录' : '月记录'}
              </button>
            ))}
          </div>
          <button
            onClick={() => handlePrint()}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-warm-700 transition-colors"
            title="打印"
          >
            <Printer size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div ref={printRef}>
        {/* Date navigation */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 no-print">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <span className="font-semibold text-gray-700">
            {viewMode === 'week'
              ? `${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}`
              : viewMode === 'day'
              ? formatDate(currentDate)
              : `${new Date(currentDate).getFullYear()}年${new Date(currentDate).getMonth() + 1}月`}
          </span>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Week view */}
        {viewMode === 'week' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left text-gray-600 font-medium border-b-2 border-warm-200 w-28">时间段</th>
                  {weekDates.map((date, i) => (
                    <th key={date} className={`p-2 text-center border-b-2 border-warm-200 font-medium ${
                      date === today.toISOString().split('T')[0] ? 'text-warm-600' : 'text-gray-600'
                    }`}>
                      <div>{WEEKDAY_NAMES[(i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7]}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(date).getDate()}日
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEFAULT_TIME_SLOTS.map((slot) => (
                  <tr key={slot.id}>
                    <td className="p-2 text-xs text-gray-500 border border-gray-100 font-medium whitespace-nowrap">
                      {slot.label}
                    </td>
                    {weekDates.map((date) => {
                      const record = records.find(
                        (r) => r.date === date && r.timeSlotId === slot.id
                      );
                      return (
                        <td key={date} className="p-2 border border-gray-100 text-center">
                          {record ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs text-gray-700">{record.activityName}</span>
                              {getStatusBadge(record.status)}
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Day view */}
        {viewMode === 'day' && (
          <div className="p-4">
            <div className="text-center mb-4">
              <h4 className="text-lg font-bold text-gray-700">
                {formatDate(currentDate)} 活动记录
              </h4>
            </div>
            {records.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar size={40} className="mx-auto mb-2 opacity-50" />
                <p>当天无活动记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {DEFAULT_TIME_SLOTS.map((slot) => {
                  const record = records.find((r) => r.timeSlotId === slot.id);
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-gray-100"
                    >
                      <div className="w-36 shrink-0 flex items-center gap-2 text-sm text-gray-500">
                        <Clock size={14} />
                        <span>{slot.label}</span>
                      </div>
                      {record ? (
                        <>
                          <span className="flex-1 text-gray-700 font-medium">
                            {record.activityName}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBg(record.status)}`}>
                            {record.status === 'participated' ? '已参加' : record.status === 'not_participated' ? '未参加' : '未标记'}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-300 text-sm">未安排活动</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Month view */}
        {viewMode === 'month' && (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {weekRows.map((day) => (
                <div key={day} className="bg-warm-50 p-2 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
              {monthDays.map(({ date, day, isCurrentMonth }) => {
                const dayRecords = recordsByDate[date] || [];
                const hasParticipated = dayRecords.some((r) => r.status === 'participated');
                const hasMissed = dayRecords.some((r) => r.status === 'not_participated');
                const hasUnmarked = dayRecords.some((r) => r.status === 'unmarked');
                const isToday = date === today.toISOString().split('T')[0];

                let bgColor = 'bg-white';
                if (dayRecords.length > 0) {
                  if (hasParticipated && !hasMissed && !hasUnmarked) bgColor = 'bg-green-50';
                  else if (hasMissed && !hasParticipated) bgColor = 'bg-red-50';
                  else bgColor = 'bg-yellow-50';
                } else if (!isCurrentMonth) {
                  bgColor = 'bg-gray-50';
                }

                return (
                  <div
                    key={date}
                    className={`${bgColor} p-2 min-h-[70px] relative ${isToday ? 'ring-2 ring-warm-400 ring-inset' : ''}`}
                  >
                    <span className={`text-sm ${isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                      {day}
                    </span>
                    {dayRecords.length > 0 && (
                      <div className="mt-1 flex gap-0.5 flex-wrap">
                        {hasParticipated && <span className="w-2 h-2 rounded-full bg-green-500" />}
                        {hasMissed && <span className="w-2 h-2 rounded-full bg-red-400" />}
                        {hasUnmarked && <span className="w-2 h-2 rounded-full bg-gray-300" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Privacy notice */}
        <div className="px-4 py-3 border-t border-warm-100 text-center">
          <p className="text-xs text-gray-400">
            🔒 请妥善保管纸质件，涉及老人个人信息
          </p>
        </div>
      </div>
    </div>
  );
};
