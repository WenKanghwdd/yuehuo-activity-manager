import { X, AlertTriangle, ShoppingCart, CalendarPlus } from 'lucide-react';
import type { Activity } from '../../types';

interface ActivityDetailModalProps {
  activity: Activity;
  open: boolean;
  onClose: () => void;
  onAddToPlan?: (activity: Activity) => void;
}

export default function ActivityDetailModal({
  activity,
  open,
  onClose,
  onAddToPlan,
}: ActivityDetailModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-warm-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-warm-800">{activity.name}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-warm-50 text-warm-400 hover:text-warm-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image Gallery */}
          {activity.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {activity.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${activity.name} 图片${i + 1}`}
                  className="w-48 h-32 object-cover rounded-lg border border-warm-100 shrink-0"
                />
              ))}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {activity.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-warm-100 text-warm-700 text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-warm-700 mb-1">活动描述</h3>
            <p className="text-sm text-warm-600 leading-relaxed">{activity.description}</p>
          </div>

          {/* 开展条件 */}
          <div className="bg-warm-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-warm-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-warm-500" />
              开展条件
            </h3>
            <div className="text-sm text-warm-600 space-y-2">
              <p><span className="font-medium text-warm-700">所需场所：</span>{activity.venue}</p>
              <div>
                <span className="font-medium text-warm-700">器具列表：</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {activity.equipment.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <p><span className="font-medium text-warm-700">最低组织人员：</span>{activity.minStaff} 人</p>
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              安全提示
            </h3>
            <p className="text-sm text-amber-700 leading-relaxed">{activity.safetyTips}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={activity.buyLink || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-warm-500 text-white rounded-lg hover:bg-warm-600 transition-colors text-sm font-medium"
            >
              <ShoppingCart className="w-4 h-4" />
              一键购买素材
            </a>
            {onAddToPlan && (
              <button
                onClick={() => onAddToPlan(activity)}
                className="flex items-center gap-2 px-4 py-2.5 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50 transition-colors text-sm font-medium"
              >
                <CalendarPlus className="w-4 h-4" />
                添加到周计划
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
