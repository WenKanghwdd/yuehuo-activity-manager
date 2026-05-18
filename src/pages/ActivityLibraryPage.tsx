import { useEffect, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { useActivityLibraryStore } from '../store/activityLibraryStore';
import { ACTIVITY_TAGS, type ActivityTag } from '../types';
import ActivityCard from '../components/activityLibrary/ActivityCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';

export default function ActivityLibraryPage() {
  const { activities, loading, loaded, loadActivities, searchQuery, setSearchQuery, selectedTags, toggleTag, addActivity } = useActivityLibraryStore();
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venue: '',
    equipment: '',
    minStaff: 1,
    safetyTips: '',
    buyLink: '',
    tags: [] as ActivityTag[],
    images: [] as string[],
  });

  useEffect(() => {
    if (!loaded) loadActivities();
  }, []);

  const filtered = activities.filter((a) => {
    const matchSearch =
      !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => a.tags.includes(tag));
    return matchSearch && matchTags;
  });

  const handleAddActivity = async () => {
    if (!formData.name.trim()) return;
    await addActivity({
      name: formData.name,
      description: formData.description,
      venue: formData.venue,
      equipment: formData.equipment.split('\n').filter(Boolean),
      minStaff: formData.minStaff,
      safetyTips: formData.safetyTips,
      buyLink: formData.buyLink || 'https://s.taobao.com/search?q=老人活动素材',
      tags: formData.tags.length > 0 ? formData.tags : ['文娱欣赏'],
      images: formData.images,
    });
    setShowAdd(false);
    setFormData({
      name: '',
      description: '',
      venue: '',
      equipment: '',
      minStaff: 1,
      safetyTips: '',
      buyLink: '',
      tags: [],
      images: [],
    });
  };

  if (loading) return <LoadingSpinner message="加载活动库..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">活动库</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增活动
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="搜索活动名称..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {ACTIVITY_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              selectedTags.includes(tag)
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border border-warm-200 hover:border-orange-300'
            }`}
          >
            {tag}
          </button>
        ))}
        {selectedTags.length > 0 && (
          <button
            onClick={() => selectedTags.forEach((t) => toggleTag(t))}
            className="px-3 py-1 text-sm text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="暂无活动"
          description={searchQuery || selectedTags.length > 0 ? '换个搜索条件试试' : '点击"新增活动"添加第一个活动'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="新增活动" width="max-w-xl">
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">活动名称 *</label>
            <input
              type="text" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">标签</label>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITY_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFormData({
                    ...formData,
                    tags: formData.tags.includes(tag)
                      ? formData.tags.filter((t) => t !== tag)
                      : [...formData.tags, tag],
                  })}
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    formData.tags.includes(tag)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">场地</label>
              <input
                type="text" value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">最少组织人数</label>
              <input
                type="number" min={1} value={formData.minStaff}
                onChange={(e) => setFormData({ ...formData, minStaff: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">器具列表（每行一个）</label>
            <textarea
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">安全提示</label>
            <textarea
              value={formData.safetyTips}
              onChange={(e) => setFormData({ ...formData, safetyTips: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">购买链接</label>
            <input
              type="text" value={formData.buyLink}
              onChange={(e) => setFormData({ ...formData, buyLink: e.target.value })}
              placeholder="https://s.taobao.com/search?q=..."
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
            <button onClick={handleAddActivity} className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600">添加</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
