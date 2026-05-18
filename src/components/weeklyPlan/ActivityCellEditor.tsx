import { useState, useRef, useEffect } from 'react';
import { Search, Upload, Trash2, AlertTriangle, BookOpen, X } from 'lucide-react';
import type { Weekday, Activity } from '../../types';
import { ACTIVITY_TAGS } from '../../types';
import { hasOutdoorKeyword } from '../../utils/helpers';
import { useActivityLibraryStore } from '../../store/activityLibraryStore';
import { useWeeklyPlanStore } from '../../store/weeklyPlanStore';
import Modal from '../common/Modal';

interface ActivityCellEditorProps {
  open: boolean;
  onClose: () => void;
  timeSlotId: string;
  weekday: Weekday;
  timeSlotLabel: string;
  weekdayLabel: string;
}

export default function ActivityCellEditor({
  open,
  onClose,
  timeSlotId,
  weekday,
  timeSlotLabel,
  weekdayLabel,
}: ActivityCellEditorProps) {
  const { currentPlan, updateCell, clearCell } = useWeeklyPlanStore();
  const { activities, getFilteredActivities, setSearchQuery, toggleTag, selectedTags } = useActivityLibraryStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const cellKey = `${timeSlotId}-${weekday}`;
  const cell = currentPlan?.cells[cellKey];

  const [customText, setCustomText] = useState(cell?.customText || '');
  const [note, setNote] = useState(cell?.note || '');
  const [imageBase64, setImageBase64] = useState<string | null>(cell?.imageBase64 || null);
  const [activityId, setActivityId] = useState<string | null>(cell?.activityId || null);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [searchQuery, setLocalSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      setCustomText(cell?.customText || '');
      setNote(cell?.note || '');
      setImageBase64(cell?.imageBase64 || null);
      setActivityId(cell?.activityId || null);
      setShowActivityPicker(false);
      setLocalSearchQuery('');
    }
  }, [open, cell]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageBase64(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    await updateCell(timeSlotId, weekday, {
      activityId,
      customText,
      note,
      imageBase64,
    });
    onClose();
  };

  const handleClear = async () => {
    await clearCell(timeSlotId, weekday);
    onClose();
  };

  const selectActivity = (act: Activity) => {
    setActivityId(act.id);
    setCustomText(act.name);
    if (act.images.length > 0) {
      setImageBase64(act.images[0]);
    }
    // Auto-detect outdoor keywords for note
    if (hasOutdoorKeyword(act.name + act.description) && !note) {
      setNote('⚠️ 外出活动需提前报名并获得家属同意');
    }
    setShowActivityPicker(false);
  };

  const selectedActivity = activities.find((a) => a.id === activityId);
  const showOutdoorWarning = hasOutdoorKeyword(customText + (selectedActivity?.description || ''));

  return (
    <Modal open={open} onClose={onClose} title={`编辑活动 - ${weekdayLabel} ${timeSlotLabel}`} width="max-w-2xl">
      <div className="space-y-4">
        {/* Current activity display */}
        {selectedActivity && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              {selectedActivity.images[0] ? (
                <img src={selectedActivity.images[0]} alt="" className="w-16 h-12 object-cover rounded" />
              ) : (
                <div className="w-16 h-12 bg-orange-100 rounded flex items-center justify-center text-orange-400 text-xs">无图</div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-800">{selectedActivity.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{selectedActivity.tags.join('、')}</p>
              </div>
              <button onClick={() => { setActivityId(null); setCustomText(''); }} className="p-1 hover:bg-orange-200 rounded transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}

        {/* Activity search / picker */}
        <div>
          <button
            onClick={() => setShowActivityPicker(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-gray-600 hover:border-orange-300 transition-colors w-full"
          >
            <BookOpen className="w-4 h-4" />
            {selectedActivity ? '更换活动' : '从活动库选择'}
          </button>
        </div>

        {/* Activity picker panel */}
        {showActivityPicker && (
          <div className="border border-gray-200 rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 z-10 p-2 border-b">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索活动..."
                  value={searchQuery}
                  onChange={(e) => {
                    setLocalSearchQuery(e.target.value);
                    setSearchQuery(e.target.value);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {ACTIVITY_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-2 space-y-1">
              {getFilteredActivities().map((act) => (
                <button
                  key={act.id}
                  onClick={() => selectActivity(act)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                    act.id === activityId ? 'bg-orange-100 border border-orange-300' : 'hover:bg-white'
                  }`}
                >
                  <div className="w-10 h-10 bg-orange-100 rounded flex items-center justify-center text-orange-400 text-xs shrink-0 overflow-hidden">
                    {act.images[0] ? <img src={act.images[0]} alt="" className="w-full h-full object-cover" /> : '📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{act.name}</p>
                    <p className="text-xs text-gray-500 truncate">{act.tags.join('、')}</p>
                  </div>
                </button>
              ))}
              {getFilteredActivities().length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">暂无匹配活动</p>
              )}
            </div>
          </div>
        )}

        {/* Custom text */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">自定义活动名称</label>
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="输入活动名称..."
            className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Outdoor warning */}
        {showOutdoorWarning && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              ⚠️ 外出活动需提前报名并获得家属同意
            </p>
          </div>
        )}

        {/* Image upload */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">活动图片</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-warm-200 rounded-lg p-4 text-center cursor-pointer hover:border-orange-300 transition-colors"
          >
            {imageBase64 ? (
              <div className="relative inline-block">
                <img src={imageBase64} alt="活动图" className="h-24 object-contain rounded" />
                <button
                  onClick={(e) => { e.stopPropagation(); setImageBase64(null); }}
                  className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-8 h-8 text-warm-300" />
                <p className="text-sm text-gray-500">点击上传图片</p>
                <p className="text-xs text-gray-400">建议尺寸 120×80px</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">备注/提醒</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="输入备注信息..."
            rows={3}
            className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            清空此单元格
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}


