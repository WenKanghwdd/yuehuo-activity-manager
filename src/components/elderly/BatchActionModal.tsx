import React, { useState } from 'react';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import type { ParticipationStatus } from '../../types';
import { DEFAULT_TIME_SLOTS } from '../../types';
import { useActivityRecordStore } from '../../store/activityRecordStore';

interface BatchActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  elderlyIds: string[];
}

export const BatchActionModal: React.FC<BatchActionModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  elderlyIds,
}) => {
  const { batchSetStatus } = useActivityRecordStore();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlotId, setTimeSlotId] = useState(DEFAULT_TIME_SLOTS[0]?.id || '');
  const [activityName, setActivityName] = useState('');
  const [action, setAction] = useState<ParticipationStatus>('participated');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!date || !timeSlotId) return;
    setLoading(true);
    try {
      await batchSetStatus(elderlyIds, date, timeSlotId, activityName || `活动（${DEFAULT_TIME_SLOTS.find((s) => s.id === timeSlotId)?.label || ''}）`, action);
      onClose();
    } catch {
      // silently fail, user can retry
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-warm-100">
          <h2 className="text-xl font-bold text-gray-800">批量标记</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Affected count */}
          <div className="p-3 bg-warm-50 rounded-lg text-center">
            <p className="text-warm-700 font-medium">
              将对 <span className="text-xl font-bold">{selectedCount}</span> 位老人进行标记
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-warm-500 focus:ring-1 focus:ring-warm-500 outline-none"
            />
          </div>

          {/* Time slot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">时间段</label>
            <select
              value={timeSlotId}
              onChange={(e) => setTimeSlotId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-warm-500 focus:ring-1 focus:ring-warm-500 outline-none"
            >
              {DEFAULT_TIME_SLOTS.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>

          {/* Activity name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">活动名称</label>
            <input
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="例如：太极晨练（留空自动生成）"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-warm-500 focus:ring-1 focus:ring-warm-500 outline-none"
            />
          </div>

          {/* Action toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">标记状态</label>
            <div className="flex gap-3">
              <button
                onClick={() => setAction('participated')}
                className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all
                  ${action === 'participated'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                <CheckCircle2 size={20} />
                <span className="font-medium">已参加</span>
              </button>
              <button
                onClick={() => setAction('not_participated')}
                className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all
                  ${action === 'not_participated'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                <XCircle size={20} />
                <span className="font-medium">未参加</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-warm-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-6 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2
              ${action === 'participated'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                处理中...
              </>
            ) : (
              <>
                {action === 'participated' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                确认标记（{selectedCount}人）
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
