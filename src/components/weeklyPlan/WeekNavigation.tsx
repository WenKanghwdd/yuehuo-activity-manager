import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonday, formatDate } from '../../utils/helpers';

interface WeekNavigationProps {
  weekStart: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onGoToToday: () => void;
}

export default function WeekNavigation({
  weekStart,
  onPrevWeek,
  onNextWeek,
  onGoToToday,
}: WeekNavigationProps) {
  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const isCurrentWeek = weekStart === getMonday();

  return (
    <div className="flex items-center gap-3 no-print">
      <button
        onClick={onPrevWeek}
        className="p-2 rounded-lg hover:bg-warm-100 text-gray-600 transition-colors"
        title="上一周"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="text-base font-medium text-gray-700 min-w-[200px] text-center">
        {formatDate(startDate.toISOString().split('T')[0])} — {formatDate(endDate.toISOString().split('T')[0])}
      </div>

      <button
        onClick={onNextWeek}
        className="p-2 rounded-lg hover:bg-warm-100 text-gray-600 transition-colors"
        title="下一周"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {!isCurrentWeek && (
        <button
          onClick={onGoToToday}
          className="px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
        >
          回到本周
        </button>
      )}
    </div>
  );
}
