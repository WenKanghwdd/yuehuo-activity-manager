import { useState, useEffect, useRef } from 'react';
import { X, ImagePlus } from 'lucide-react';
import type { Activity, ActivityTag } from '../../types';
import { ACTIVITY_TAGS } from '../../types';

interface ActivityFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (activity: Omit<Activity, 'id'>) => void;
  editActivity?: Activity | null;
}

export default function ActivityFormModal({
  open,
  onClose,
  onSave,
  editActivity,
}: ActivityFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [equipmentInput, setEquipmentInput] = useState('');
  const [minStaff, setMinStaff] = useState(1);
  const [safetyTips, setSafetyTips] = useState('');
  const [buyLink, setBuyLink] = useState('');
  const [selectedTags, setSelectedTags] = useState<ActivityTag[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (editActivity) {
        setName(editActivity.name);
        setDescription(editActivity.description);
        setVenue(editActivity.venue);
        setEquipmentInput(editActivity.equipment.join(', '));
        setMinStaff(editActivity.minStaff);
        setSafetyTips(editActivity.safetyTips);
        setBuyLink(editActivity.buyLink);
        setSelectedTags([...editActivity.tags]);
        setImages([...editActivity.images]);
      } else {
        setName('');
        setDescription('');
        setVenue('');
        setEquipmentInput('');
        setMinStaff(1);
        setSafetyTips('');
        setBuyLink('');
        setSelectedTags([]);
        setImages([]);
      }
      setErrors({});
    }
  }, [open, editActivity]);

  const toggleTag = (tag: ActivityTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = (ev.target as FileReader)?.result;
        if (result) {
          setImages((prev) => [...prev, result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = '请输入活动名称';
    if (!description.trim()) errs.description = '请输入活动描述';
    if (!venue.trim()) errs.venue = '请输入所需场所';
    if (selectedTags.length === 0) errs.tags = '请至少选择一个标签';
    if (minStaff < 1) errs.minStaff = '至少需要1名组织人员';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const equipment = equipmentInput
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
    onSave({
      name: name.trim(),
      description: description.trim(),
      venue: venue.trim(),
      equipment,
      minStaff,
      safetyTips: safetyTips.trim(),
      buyLink: buyLink.trim(),
      tags: selectedTags,
      images,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-warm-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-warm-800">
            {editActivity ? '编辑活动' : '添加活动'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-warm-50 text-warm-400 hover:text-warm-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">活动名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:ring-2 focus:ring-warm-500 focus:border-warm-500 outline-none"
              placeholder="请输入活动名称"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">活动描述 *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:ring-2 focus:ring-warm-500 focus:border-warm-500 outline-none resize-none"
              placeholder="请描述活动内容"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">标签 *</label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-warm-500 text-white'
                      : 'bg-warm-50 text-warm-600 hover:bg-warm-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {errors.tags && <p className="text-red-500 text-xs mt-1">{errors.tags}</p>}
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">所需场所 *</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:ring-2 focus:ring-warm-500 focus:border-warm-500 outline-none"
              placeholder="如：活动大厅、户外广场"
            />
            {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue}</p>}
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              器具列表 <span className="text-warm-400 font-normal">（逗号分隔）</span>
            </label>
            <input
              type="text"
              value={equipmentInput}
              onChange={(e) => setEquipmentInput(e.target.value)}
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:ring-2 focus:ring-warm-500 focus:border-warm-500 outline-none"
              placeholder="如：彩纸, 剪刀, 胶水"
            />
          </div>

          {/* Min Staff */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">最低组织人员</label>
            <input
              type="number"
              value={minStaff}
              onChange={(e) => setMinStaff(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              className="w-24 px-3 py-2 border border-warm-200 rounded-lg text-sm focus:ring-2 focus:ring-warm-500 focus:border-warm-500 outline-none"
            />
            {errors.minStaff && <p className="text-red-500 text-xs mt-1">{errors.minStaff}</p>}
          </div>

          {/* Safety Tips */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">安全提示</label>
            <textarea
              value={safetyTips}
              onChange={(e) => setSafetyTips(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:ring-2 focus:ring-warm-500 focus:border-warm-500 outline-none resize-none"
              placeholder="依据《养老机构文娱服务安全规范》填写安全注意事项"
            />
          </div>

          {/* Buy Link */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">购买链接</label>
            <input
              type="text"
              value={buyLink}
              onChange={(e) => setBuyLink(e.target.value)}
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:ring-2 focus:ring-warm-500 focus:border-warm-500 outline-none"
              placeholder="https://s.taobao.com/search?q=..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">活动图片</label>
            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-warm-200">
                  <img src={img} alt={`图片${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 border-2 border-dashed border-warm-200 rounded-lg flex flex-col items-center justify-center text-warm-400 hover:text-warm-600 hover:border-warm-400 transition-colors"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-[10px] mt-1">上传图片</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-warm-100 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-warm-200 text-warm-700 hover:bg-warm-50 transition-colors text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-warm-500 text-white hover:bg-warm-600 transition-colors text-sm font-medium"
          >
            {editActivity ? '保存修改' : '添加活动'}
          </button>
        </div>
      </div>
    </div>
  );
}
