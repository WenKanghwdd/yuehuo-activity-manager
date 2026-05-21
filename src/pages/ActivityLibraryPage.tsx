import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Palette, X, ArrowUp, Columns3 } from 'lucide-react';
import { useActivityLibraryStore } from '../store/activityLibraryStore';
import { useTagStore } from '../store/tagStore';
import { useVenueStore } from '../store/venueStore';
import { ACTIVITY_TAGS, type ActivityTag, type Activity } from '../types';
import ActivityCard from '../components/activityLibrary/ActivityCard';
import ActivityDetailModal from '../components/activityLibrary/ActivityDetailModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';

const TAG_COLORS = [
  '#dc2626', '#ea580c', '#d97706', '#16a34a', '#059669',
  '#2563eb', '#7c3aed', '#db2777', '#e91e63', '#0891b2',
];

export default function ActivityLibraryPage() {
  const { activities, loading, loaded, loadActivities, searchQuery, setSearchQuery, selectedTags, toggleTag, addActivity } = useActivityLibraryStore();
  const tagStore = useTagStore();
  const venueStore = useVenueStore();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#e67414');
  const [colorPickerTag, setColorPickerTag] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showHiddenTags, setShowHiddenTags] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', venue: '', equipment: '', minStaff: 1,
    safetyTips: '', buyLinks: [] as { label: string; url: string }[], tags: [] as ActivityTag[], images: [] as string[],
  });
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  useEffect(() => {
    if (!loaded) loadActivities();
    if (!tagStore.loaded) tagStore.loadTags();
    if (!venueStore.loaded) venueStore.loadAll();
  }, []);

  // 统计每种标签的活动数
  const tagCounts: Record<string, number> = {};
  activities.forEach(a => a.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));

  // 所有标签（预设 + 自定义），排除隐藏的预设标签
  const visibleTags = [...ACTIVITY_TAGS.filter(t => !tagStore.hiddenTags.includes(t)), ...tagStore.customTags.filter(t => !ACTIVITY_TAGS.includes(t as ActivityTag))];
  const hiddenPresetTags = ACTIVITY_TAGS.filter(t => tagStore.hiddenTags.includes(t));
  // 标签管理界面显示全部（含隐藏）
  const allTags = [...ACTIVITY_TAGS, ...tagStore.customTags.filter(t => !ACTIVITY_TAGS.includes(t as ActivityTag))];

  const filtered = activities.filter((a) => {
    const matchSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTags = selectedTags.length === 0 || selectedTags.some((tag) => a.tags.includes(tag));
    return matchSearch && matchTags;
  });

  const handleAddActivity = async () => {
    if (!formData.name.trim()) return;
    await addActivity({
      name: formData.name, description: formData.description, venue: formData.venue,
      equipment: formData.equipment.split('\n').filter(Boolean), minStaff: formData.minStaff,
      safetyTips: formData.safetyTips, buyLinks: formData.buyLinks,
      tags: formData.tags.length > 0 ? formData.tags : ['文娱欣赏'], images: formData.images,
    });
    setShowAdd(false);
    setFormData({ name: '', description: '', venue: '', equipment: '', minStaff: 1, safetyTips: '', buyLinks: [], tags: [], images: [] });
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    if (allTags.includes(newTagName.trim() as ActivityTag)) { alert('该标签已存在'); return; }
    await tagStore.addCustomTag(newTagName.trim(), newTagColor);
    setNewTagName('');
  };

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [columns, setColumns] = useState(3);
  const [showColPicker, setShowColPicker] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (loading) return <LoadingSpinner message="加载活动库..." />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">活动库</h2>
        <div className="flex gap-2">
          <button onClick={() => { tagStore.loadTags(); setShowTagManager(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-warm-200 text-sm rounded-lg hover:bg-warm-50 transition-colors">
            <Palette className="w-4 h-4" /> 标签管理
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors">
            <Plus className="w-4 h-4" /> 新增活动
          </button>
          {/* Columns toggle */}
          <div className="relative">
            <button onClick={() => setShowColPicker(!showColPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-warm-200 text-sm rounded-lg hover:bg-warm-50 transition-colors">
              <Columns3 className="w-4 h-4" /> {columns}列
            </button>
            {showColPicker && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-warm-200 rounded-lg shadow-lg p-1 flex"
                onMouseLeave={() => setShowColPicker(false)}>
                {[2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => { setColumns(n); setShowColPicker(false); }}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${columns === n ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-warm-50'}`}>
                    {n}列
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="搜索活动名称..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
      </div>

      {/* Tags with counts */}
      <div className="flex flex-wrap gap-2">
        {visibleTags.map((tag) => {
          const cfg = tagStore.getTagConfig(tag);
          const count = tagCounts[tag] || 0;
          const active = selectedTags.includes(tag as ActivityTag);
          return (
            <button key={tag} onClick={() => toggleTag(tag as ActivityTag)}
              className="px-3 py-1 text-sm rounded-full transition-colors flex items-center gap-1.5"
              style={{
                backgroundColor: active ? cfg.color : cfg.bgColor,
                color: active ? '#fff' : cfg.color,
                border: active ? 'none' : `1px solid ${cfg.color}40`,
              }}>
              {tagStore.getDisplayName(tag)}
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
        {selectedTags.length > 0 && (
          <button onClick={() => selectedTags.forEach((t) => toggleTag(t))}
            className="px-3 py-1 text-sm text-red-500 hover:bg-red-50 rounded-full transition-colors">
            清除筛选
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState title="暂无活动"
          description={searchQuery || selectedTags.length > 0 ? '换个搜索条件试试' : '点击"新增活动"添加第一个活动'} />
      ) : (
        <div className={`grid gap-4 ${
          columns === 2 ? 'grid-cols-1 sm:grid-cols-2' :
          columns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
          columns === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
        }`}>
          {filtered.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} onClick={() => setSelectedActivity(activity)} />
          ))}
        </div>
      )}

      {/* Add modal (unchanged) */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="新增活动" width="max-w-xl">
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">活动名称 *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">描述</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">标签</label>
            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map((tag) => {
                const cfg = tagStore.getTagConfig(tag);
                return (
                  <button key={tag} onClick={() => setFormData({
                    ...formData, tags: formData.tags.includes(tag as ActivityTag)
                      ? formData.tags.filter((t) => t !== tag) : [...formData.tags, tag as ActivityTag],
                  })}
                    className="px-2 py-0.5 text-xs rounded-full"
                    style={{
                      backgroundColor: formData.tags.includes(tag as ActivityTag) ? cfg.color : cfg.bgColor,
                      color: formData.tags.includes(tag as ActivityTag) ? '#fff' : cfg.color,
                    }}>
                    {tagStore.getDisplayName(tag)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">场地</label>
              <input type="text" value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="输入或选择..." />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {venueStore.suggestions.map((v) => (
                  <span key={v} className="inline-flex items-center gap-0.5">
                    <button onClick={() => setFormData({ ...formData, venue: v })}
                      className={`px-2 py-0.5 text-[10px] rounded-l-full border transition-colors ${
                        formData.venue === v
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                          : 'bg-white border-warm-200 text-gray-500 hover:bg-warm-50'
                      }`}>
                      {v}
                    </button>
                    <button onClick={() => venueStore.removeSuggestion(v)}
                      className="px-1 py-0.5 text-[10px] rounded-r-full border border-l-0 border-warm-200 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">最少组织人数</label>
              <input type="number" min={1} value={formData.minStaff}
                onChange={(e) => setFormData({ ...formData, minStaff: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">器具列表（每行一个）</label>
            <textarea value={formData.equipment} onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">安全提示</label>
            <textarea value={formData.safetyTips} onChange={(e) => setFormData({ ...formData, safetyTips: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">购买链接</label>
            {formData.buyLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-1 mb-1">
                <input type="text" value={link.label} onChange={(e) => {
                  const links = [...formData.buyLinks];
                  links[i] = { ...links[i], label: e.target.value };
                  setFormData({ ...formData, buyLinks: links });
                }}
                  placeholder="名称" className="w-20 px-2 py-1.5 border border-warm-200 rounded text-xs outline-none focus:ring-2 focus:ring-orange-400" />
                <input type="text" value={link.url} onChange={(e) => {
                  const links = [...formData.buyLinks];
                  links[i] = { ...links[i], url: e.target.value };
                  setFormData({ ...formData, buyLinks: links });
                }}
                  placeholder="https://..." className="flex-1 px-2 py-1.5 border border-warm-200 rounded text-xs outline-none focus:ring-2 focus:ring-orange-400" />
                <button onClick={() => setFormData({ ...formData, buyLinks: formData.buyLinks.filter((_, j) => j !== i) })}
                  className="px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded">✕</button>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <input type="text" value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)}
                placeholder="名称（如：淘宝）" className="w-20 px-2 py-1.5 border border-warm-200 rounded text-xs outline-none focus:ring-2 focus:ring-orange-400" />
              <input type="text" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)}
                placeholder="输入购买链接..." className="flex-1 px-2 py-1.5 border border-warm-200 rounded text-xs outline-none focus:ring-2 focus:ring-orange-400" />
              <button onClick={() => {
                const url = newLinkUrl.trim();
                if (!url) return;
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                  alert('请输入有效的链接（以 http:// 或 https:// 开头）');
                  return;
                }
                setFormData({ ...formData, buyLinks: [...formData.buyLinks, { label: newLinkLabel.trim() || '购买链接', url }] });
                setNewLinkLabel('');
                setNewLinkUrl('');
              }}
                className="px-2 py-1.5 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600">+</button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
            <button onClick={handleAddActivity} className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">添加</button>
          </div>
        </div>
      </Modal>

      {/* Tag Manager Modal */}
      <Modal open={showTagManager} onClose={() => setShowTagManager(false)} title="标签管理" width="max-w-md">
        <div className="space-y-4">
          {/* 新增标签 */}
          <div className="flex items-center gap-2">
            <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
              placeholder="新标签名称..." className="flex-1 px-3 py-2 border border-warm-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400" />
            <div className="flex gap-1">
              {TAG_COLORS.map(c => (
                <button key={c} onClick={() => setNewTagColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: newTagColor === c ? '#333' : 'transparent',
                    transform: newTagColor === c ? 'scale(1.2)' : 'scale(1)',
                  }} />
              ))}
            </div>
            <button onClick={handleAddTag} disabled={!newTagName.trim()}
              className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 disabled:opacity-50">添加</button>
          </div>

          {/* 标签列表 */}
          <div className="space-y-2">
            {allTags.map((tag) => {
              const cfg = tagStore.getTagConfig(tag);
              const isCustom = tagStore.customTags.includes(tag);
              const isHidden = tagStore.hiddenTags.includes(tag);
              const displayName = tagStore.getDisplayName(tag);
              if (isHidden) return null;
              return (
                <div key={tag} className="flex items-center justify-between p-2 rounded-lg bg-warm-50">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: cfg.color }} />
                    {editingTag === tag ? (
                      <input type="text" value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={async () => {
                          if (editName.trim() && editName.trim() !== tag) {
                            await tagStore.renameTag(tag, editName.trim());
                          }
                          setEditingTag(null);
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            if (editName.trim() && editName.trim() !== tag) {
                              await tagStore.renameTag(tag, editName.trim());
                            }
                            setEditingTag(null);
                          }
                          if (e.key === 'Escape') setEditingTag(null);
                        }}
                        className="px-2 py-0.5 text-sm border border-orange-400 rounded outline-none focus:ring-2 focus:ring-orange-300 w-28"
                        autoFocus />
                    ) : (
                      <span className="text-sm text-gray-700 truncate">{displayName}</span>
                    )}
                    {isCustom && <span className="text-[10px] text-warm-400 shrink-0">(自定义)</span>}
                    <span className="text-[10px] text-warm-400 shrink-0">({tagCounts[tag] || 0}个活动)</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {/* 重命名 */}
                    <button onClick={() => {
                      if (editingTag === tag) {
                        setEditingTag(null);
                      } else {
                        setEditingTag(tag);
                        setEditName(displayName);
                      }
                    }}
                      className="px-2 py-1 text-[10px] border border-warm-200 rounded hover:bg-warm-100">
                      {editingTag === tag ? '取消' : '重命名'}
                    </button>
                    {/* 改色 */}
                    <div className="relative">
                      <button onClick={() => setColorPickerTag(colorPickerTag === tag ? null : tag)}
                        className="px-2 py-1 text-[10px] border border-warm-200 rounded hover:bg-warm-100">改色</button>
                      {colorPickerTag === tag && (
                        <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-warm-200 rounded-lg shadow-lg p-2 flex gap-1"
                          onMouseLeave={() => setColorPickerTag(null)}>
                          {TAG_COLORS.map(c => (
                            <button key={c} onClick={async () => {
                              await tagStore.updateTagColor(tag, c, c + '20');
                              setColorPickerTag(null);
                            }}
                              className="w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                              style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      )}
                    </div>
                    {/* 预设标签：隐藏；自定义标签：删除 */}
                    {isCustom ? (
                      <button onClick={() => tagStore.removeCustomTag(tag)}
                        className="px-2 py-1 text-[10px] text-red-500 hover:bg-red-50 rounded">
                        <X className="w-3 h-3" />
                      </button>
                    ) : (
                      <button onClick={() => tagStore.toggleHiddenTag(tag)}
                        className="px-2 py-1 text-[10px] text-warm-500 hover:bg-warm-100 rounded">
                        隐藏
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 隐藏的预设标签 */}
          {hiddenPresetTags.length > 0 && (
            <div>
              <button onClick={() => setShowHiddenTags(!showHiddenTags)}
                className="flex items-center gap-1 text-xs text-warm-400 hover:text-warm-600 transition-colors">
                已隐藏标签 ({hiddenPresetTags.length})
                <span className={`transition-transform ${showHiddenTags ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {showHiddenTags && (
                <div className="mt-2 space-y-2">
                  {hiddenPresetTags.map((tag) => {
                    const cfg = tagStore.getTagConfig(tag);
                    return (
                      <div key={tag} className="flex items-center justify-between p-2 rounded-lg bg-warm-50 opacity-60">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: cfg.color }} />
                          <span className="text-sm text-gray-500">{tagStore.getDisplayName(tag)}</span>
                        </div>
                        <button onClick={() => tagStore.toggleHiddenTag(tag)}
                          className="px-2 py-1 text-[10px] text-indigo-600 hover:bg-indigo-50 rounded">
                          恢复显示
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Detail Modal */}
      <ActivityDetailModal activity={selectedActivity!} open={!!selectedActivity}
        onClose={() => setSelectedActivity(null)} />

      {/* Back to top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="no-print fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-indigo-500 text-white shadow-lg hover:bg-indigo-600 transition-all hover:scale-110 flex items-center justify-center"
          aria-label="回到顶部"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
