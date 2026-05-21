import { useState, useRef, useEffect } from 'react';
import { X, AlertTriangle, ShoppingCart, CalendarPlus, Edit3, Save, ImagePlus, Upload, Crop } from 'lucide-react';
import type { Activity, ActivityTag } from '../../types';
import { ACTIVITY_TAGS } from '../../types';
import { useActivityLibraryStore } from '../../store/activityLibraryStore';
import ImageCropper from '../common/ImageCropper';
import { useVenueStore } from '../../store/venueStore';

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
  const { updateActivity } = useActivityLibraryStore();
  const venueStore = useVenueStore();
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const safeAct = activity || { id:'', name:'', tags:[], images:[], description:'', venue:'', equipment:[], minStaff:1, safetyTips:'', buyLinks:[] };
  const [form, setForm] = useState({ ...safeAct, equipment: safeAct.equipment.join('\n') });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [croppingIndex, setCroppingIndex] = useState<number | null>(null);
  const [showVenuePicker, setShowVenuePicker] = useState(false);
  const [newVenue, setNewVenue] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  useEffect(() => {
    if (!venueStore.loaded) venueStore.loadAll();
    if (open) {
      setForm({ ...activity, equipment: activity.equipment.join('\n') });
      setEditing(false);
    }
  }, [open, activity]);

  const markDirty = (updater: any) => { setForm(updater); setDirty(true); };

  const handleSave = async () => {
    await updateActivity({
      ...form,
      equipment: form.equipment.split('\n').filter(Boolean),
    });
    setEditing(false);
    setDirty(false);
  };

  const handleClose = () => {
    if (dirty && editing) {
      if (!confirm('有未保存的修改，确定关闭吗？')) return;
    }
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (form.images.length >= 5) { alert('最多上传5张图片，请先删除后再添加'); return; }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          (setForm({ ...form, images: [...form.images, ev.target.result as string] }), setDirty(true));
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handlePaste = async () => {
    if (form.images.length >= 5) { alert('最多上传5张图片，请先删除后再添加'); return; }
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const reader = new FileReader();
            reader.onload = (ev) => {
              if (ev.target?.result) {
                (setForm({ ...form, images: [...form.images, ev.target.result as string] }), setDirty(true));
              }
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
    } catch {
      // clipboard not supported or no image
    }
  };

  const removeImage = (idx: number) => {
    (setForm({ ...form, images: form.images.filter((_, i) => i !== idx) }), setDirty(true));
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
          {editing ? (
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="text-xl font-bold text-warm-800 border-b-2 border-warm-400 outline-none flex-1 mr-3"
            />
          ) : (
            <h2 className="text-xl font-bold text-warm-800">{activity.name}</h2>
          )}
          <div className="flex items-center gap-2">
            {editing ? (
              <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
                <Save className="w-4 h-4" /> 保存
              </button>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-3 py-1.5 bg-warm-100 text-warm-700 rounded-lg text-sm hover:bg-warm-200">
                <Edit3 className="w-4 h-4" /> 编辑
              </button>
            )}
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-warm-50 text-warm-400 hover:text-warm-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Image Gallery */}
          <div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {form.images.map((img, i) => (
                <div key={i} className="relative shrink-0 group">
                  <img src={img} alt={`${form.name} 图片${i + 1}`} className="w-48 h-32 object-cover rounded-lg border border-warm-100" />
                  {editing && (
                    <div className="absolute top-1 right-1 flex gap-0.5">
                      <button onClick={() => setCroppingIndex(i)}
                        className="p-0.5 bg-indigo-500 text-white rounded-l text-[10px] hover:bg-indigo-600">
                        <Crop className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeImage(i)}
                        className="p-0.5 bg-red-500 text-white rounded-r text-[10px] hover:bg-red-600">
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {editing && (
                <div className="flex flex-col gap-1 items-center justify-center w-48 h-32 border-2 border-dashed border-warm-300 rounded-lg shrink-0">
                  <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 text-warm-400 hover:text-warm-600">
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-xs">点击上传</span>
                  </button>
                  <button onClick={handlePaste} className="flex items-center gap-1 text-[10px] text-warm-400 hover:text-warm-600">
                    <Upload className="w-3 h-3" /> 从剪贴板粘贴
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex flex-wrap gap-2">
              {(editing ? form.tags : activity.tags).map((tag) => (
                editing ? (
                  <button key={tag}
                    onClick={() => setForm({
                      ...form,
                      tags: form.tags.includes(tag)
                        ? form.tags.filter((t) => t !== tag)
                        : [...form.tags, tag],
                    })}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      form.tags.includes(tag) ? 'bg-warm-500 text-white' : 'bg-warm-100 text-warm-500'
                    }`}>
                    {tag}
                  </button>
                ) : (
                  <span key={tag} className="px-3 py-1 rounded-full bg-warm-100 text-warm-700 text-sm font-medium">{tag}</span>
                )
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-warm-700 mb-1">活动描述</h3>
            {editing ? (
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3} className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-warm-400 resize-none" />
            ) : (
              <p className="text-sm text-warm-600 leading-relaxed">{activity.description}</p>
            )}
          </div>

          {/* 开展条件 */}
          <div className="bg-warm-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-warm-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-warm-500" />
              开展条件
            </h3>
            <div className="text-sm text-warm-600 space-y-2">
              {editing ? (
                <>
                  <div className="relative">
                    <span className="font-medium text-warm-700">所需场所：</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input type="text" value={form.venue} onChange={(e) => { setForm({ ...form, venue: e.target.value }); setShowVenuePicker(true); }}
                        onFocus={() => setShowVenuePicker(true)}
                        className="flex-1 px-2 py-1 border border-warm-200 rounded text-sm outline-none focus:ring-2 focus:ring-warm-400"
                        placeholder="输入或选择场所..." />
                    </div>
                    {showVenuePicker && (
                      <div className="mt-1 flex flex-wrap gap-1" onMouseLeave={() => setShowVenuePicker(false)}>
                        {venueStore.suggestions.map((v) => (
                          <span key={v} className="inline-flex items-center gap-0">
                            <button onClick={() => { setForm({ ...form, venue: v }); setShowVenuePicker(false); }}
                              className={`px-2 py-0.5 text-xs rounded-l-full border transition-colors ${
                                form.venue === v
                                  ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                                  : 'bg-white border-warm-200 text-gray-600 hover:bg-warm-50'
                              }`}>
                              {v}
                            </button>
                            <button onClick={() => venueStore.removeSuggestion(v)}
                              className="px-1.5 py-0.5 text-xs rounded-r-full border border-l-0 border-warm-200 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                              ×
                            </button>
                          </span>
                        ))}
                        <div className="flex items-center gap-1">
                          <input type="text" value={newVenue} onChange={e => setNewVenue(e.target.value)}
                            placeholder="新增场所..." className="w-24 px-1.5 py-0.5 text-xs border border-warm-200 rounded outline-none focus:ring-1 focus:ring-orange-400" />
                          <button onClick={async () => {
                            if (newVenue.trim()) {
                              await venueStore.addSuggestion(newVenue.trim());
                              setForm({ ...form, venue: newVenue.trim() });
                              setNewVenue('');
                              setShowVenuePicker(false);
                            }
                          }}
                            className="px-2 py-0.5 text-[10px] bg-indigo-500 text-white rounded hover:bg-indigo-600">添加</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-warm-700">器具列表（每行一个）：</span>
                    <textarea value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                      rows={3} className="w-full mt-1 px-2 py-1 border border-warm-200 rounded text-sm outline-none focus:ring-2 focus:ring-warm-400 resize-none" />
                  </div>
                  <div><span className="font-medium text-warm-700">最低组织人员：</span>
                    <input type="number" min={1} value={form.minStaff}
                      onChange={(e) => setForm({ ...form, minStaff: parseInt(e.target.value) || 1 })}
                      className="ml-1 px-2 py-1 border border-warm-200 rounded text-sm outline-none focus:ring-2 focus:ring-warm-400 w-20" /> 人
                  </div>
                </>
              ) : (
                <>
                  <p><span className="font-medium text-warm-700">所需场所：</span>{activity.venue}</p>
                  <div>
                    <span className="font-medium text-warm-700">器具列表：</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {activity.equipment.map((item, i) => (<li key={i}>{item}</li>))}
                    </ul>
                  </div>
                  <p><span className="font-medium text-warm-700">最低组织人员：</span>{activity.minStaff} 人</p>
                </>
              )}
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              安全提示
            </h3>
            {editing ? (
              <textarea value={form.safetyTips} onChange={(e) => setForm({ ...form, safetyTips: e.target.value })}
                rows={3} className="w-full px-3 py-2 border border-amber-200 rounded text-sm outline-none focus:ring-2 focus:ring-amber-400 resize-none bg-white" />
            ) : (
              <p className="text-sm text-amber-700 leading-relaxed">{activity.safetyTips}</p>
            )}
          </div>

          {/* 购买链接 */}
          <div className="bg-warm-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-warm-700 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-warm-500" />
                购买链接
              </h3>
            </div>
            <div className="space-y-1.5">
              {(form.buyLinks || []).map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  {editing ? (
                    <>
                      <input type="text" value={link.label} onChange={(e) => {
                        const links = [...(form.buyLinks || [])];
                        links[i] = { ...links[i], label: e.target.value };
                        setForm({ ...form, buyLinks: links });
                        setDirty(true);
                      }}
                        className="w-16 px-1.5 py-1 text-xs border border-warm-200 rounded outline-none focus:ring-1 focus:ring-warm-400" />
                      <input type="text" value={link.url} onChange={(e) => {
                        const links = [...(form.buyLinks || [])];
                        links[i] = { ...links[i], url: e.target.value };
                        setForm({ ...form, buyLinks: links });
                        setDirty(true);
                      }}
                        className="flex-1 px-1.5 py-1 text-xs border border-warm-200 rounded outline-none focus:ring-1 focus:ring-warm-400" />
                      <button onClick={() => {
                        setForm({ ...form, buyLinks: (form.buyLinks || []).filter((_, j) => j !== i) });
                        setDirty(true);
                      }}
                        className="px-1.5 py-1 text-xs text-red-500 hover:bg-red-50 rounded">✕</button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-gray-500 w-14 shrink-0 truncate">{link.label}</span>
                      <span className="flex items-center gap-1">
                        {(() => {
                          const valid = link.url && (link.url.startsWith('http://') || link.url.startsWith('https://'));
                          return valid ? (
                            <a href={link.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 transition-colors shrink-0">
                              <ShoppingCart className="w-3 h-3" />
                              打开
                            </a>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded text-xs" title={link.url || '链接为空'}>
                              ⚠ 链接无效
                            </span>
                          );
                        })()}
                      </span>
                    </>
                  )}
                </div>
              ))}
              {editing && (
                <div className="flex items-center gap-1 pt-1">
                  <input type="text" value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)}
                    placeholder="名称" className="w-16 px-1.5 py-1 text-xs border border-warm-200 rounded outline-none focus:ring-1 focus:ring-orange-400" />
                  <input type="text" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)}
                    placeholder="输入新链接..." className="flex-1 px-1.5 py-1 text-xs border border-warm-200 rounded outline-none focus:ring-1 focus:ring-orange-400" />
                  <button onClick={() => {
                    const url = newLinkUrl.trim();
                    if (!url) return;
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                      alert('请输入有效的链接（以 http:// 或 https:// 开头）');
                      return;
                    }
                    setForm({ ...form, buyLinks: [...(form.buyLinks || []), { label: newLinkLabel.trim() || '链接', url }] });
                    setNewLinkLabel('');
                    setNewLinkUrl('');
                    setDirty(true);
                  }}
                    className="px-2 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600">+ 添加</button>
                </div>
              )}
            </div>
            {onAddToPlan && (
              <div className="mt-3 pt-3 border-t border-warm-200">
                <button onClick={() => onAddToPlan(activity)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50 transition-colors text-xs font-medium">
                  <CalendarPlus className="w-3 h-3" />
                  添加到周计划
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Cropper */}
      {croppingIndex !== null && form.images[croppingIndex] && (
        <ImageCropper
          image={form.images[croppingIndex]}
          onCrop={(cropped) => {
            const newImages = [...form.images];
            newImages[croppingIndex] = cropped;
            setForm({ ...form, images: newImages });
            setDirty(true);
            setCroppingIndex(null);
          }}
          onClose={() => setCroppingIndex(null)}
        />
      )}
    </div>
  );
}
