import { Image, ShoppingBag, Shield, MapPin, Users } from 'lucide-react';
import type { Activity } from '../../types';

interface ActivityCardProps {
  activity: Activity;
  onSelect?: () => void;
  showSelect?: boolean;
}

export default function ActivityCard({ activity, onSelect, showSelect }: ActivityCardProps) {
  return (
    <div className="bg-white rounded-xl border border-warm-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="h-36 bg-warm-50 overflow-hidden">
        {activity.images[0] ? (
          <img src={activity.images[0]} alt={activity.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-10 h-10 text-warm-300" />
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Title & Tags */}
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-1.5">{activity.name}</h3>
          <div className="flex flex-wrap gap-1">
            {activity.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-xs bg-orange-50 text-orange-600 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>

        {/* Conditions */}
        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{activity.venue}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>最少组织人员：{activity.minStaff} 人</span>
          </div>
        </div>

        {/* Safety tips */}
        {activity.safetyTips && (
          <div className="flex items-start gap-1.5 p-2 bg-blue-50 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">{activity.safetyTips}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {showSelect && onSelect && (
            <button
              onClick={onSelect}
              className="flex-1 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              选择此活动
            </button>
          )}
          <a
            href={activity.buyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-white border border-warm-200 text-gray-600 rounded-lg hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            购买素材
          </a>
        </div>

        {/* Equipment list */}
        {activity.equipment.length > 0 && (
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">所需器具 ({activity.equipment.length})</summary>
            <ul className="mt-1 space-y-0.5 pl-4 list-disc">
              {activity.equipment.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
