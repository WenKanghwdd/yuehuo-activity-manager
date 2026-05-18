import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import type { Elderly } from '../../types';
import { useElderlyStore } from '../../store/elderlyStore';

interface ElderlyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editElderly?: Elderly | null;
}

export const ElderlyFormModal: React.FC<ElderlyFormModalProps> = ({
  isOpen,
  onClose,
  editElderly,
}) => {
  const { groups, addElderly, updateElderly, addGroup } = useElderlyStore();
  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [groupId, setGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editElderly) {
      setName(editElderly.name);
      setRoomNumber(editElderly.roomNumber);
      setGroupId(editElderly.groupId);
    } else {
      setName('');
      setRoomNumber('');
      setGroupId(groups[0]?.id || 'default');
    }
    setNewGroupName('');
    setShowNewGroupInput(false);
    setError(null);
  }, [editElderly, isOpen, groups]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('请输入老人姓名');
      return;
    }

    let finalGroupId = groupId;
    if (showNewGroupInput && newGroupName.trim()) {
      const group = await addGroup(newGroupName.trim());
      finalGroupId = group.id;
    }

    try {
      if (editElderly) {
        await updateElderly({
          ...editElderly,
          name: name.trim(),
          roomNumber: roomNumber.trim(),
          groupId: finalGroupId,
          groupName: groups.find((g) => g.id === finalGroupId)?.name || '默认分组',
        });
      } else {
        await addElderly({
          name: name.trim(),
          roomNumber: roomNumber.trim(),
          groupId: finalGroupId,
          groupName: groups.find((g) => g.id === finalGroupId)?.name || '默认分组',
        });
      }
      onClose();
    } catch {
      setError('保存失败，请重试');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-warm-100">
          <div className="flex items-center gap-2">
            <UserPlus className="text-warm-600" size={22} />
            <h2 className="text-xl font-bold text-gray-800">
              {editElderly ? '编辑老人信息' : '添加老人'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              老人姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入姓名"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-warm-500 focus:ring-1 focus:ring-warm-500 outline-none"
              autoFocus
            />
          </div>

          {/* Room */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              房间号
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="例如：301"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-warm-500 focus:ring-1 focus:ring-warm-500 outline-none"
            />
          </div>

          {/* Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              所属分组
            </label>
            {!showNewGroupInput ? (
              <div className="flex gap-2">
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:border-warm-500 focus:ring-1 focus:ring-warm-500 outline-none"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewGroupInput(true)}
                  className="px-3 py-2 text-sm text-warm-600 hover:text-warm-800 border border-warm-300 rounded-lg hover:bg-warm-50 transition-colors whitespace-nowrap"
                >
                  + 新建
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="输入新分组名称"
                  className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:border-warm-500 focus:ring-1 focus:ring-warm-500 outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewGroupInput(false)}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
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
            onClick={handleSubmit}
            className="px-6 py-2 bg-warm-600 text-white rounded-lg hover:bg-warm-700 transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            {editElderly ? '保存修改' : '添加老人'}
          </button>
        </div>
      </div>
    </div>
  );
};
