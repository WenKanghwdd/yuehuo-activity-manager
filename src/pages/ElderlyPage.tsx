import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Upload,
  Plus,
  UserPlus,
  CheckSquare,
  Square,
  Check,
  Printer,
  Search,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useElderlyStore } from '../store/elderlyStore';
import { useActivityRecordStore } from '../store/activityRecordStore';
import { useWeeklyPlanStore } from '../store/weeklyPlanStore';
import { useActivityLibraryStore } from '../store/activityLibraryStore';
import type { Elderly, ParticipationStatus, Weekday } from '../types';
import { WEEKDAY_NAMES, DEFAULT_TIME_SLOTS } from '../types';
import { getMonday, getWeekDates, readExcelFile, formatDate } from '../utils/helpers';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable card wrapper
function SortableCard({
  elderly,
  selected,
  onToggle,
  onClick,
}: {
  elderly: Elderly;
  selected: boolean;
  onToggle: (id: string) => void;
  onClick: (elderly: Elderly) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: elderly.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
        selected
          ? 'border-warm-500 ring-2 ring-warm-500/30'
          : 'border-warm-100 hover:border-warm-300'
      }`}
      onClick={() => onClick(elderly)}
    >
      <div className="flex items-center gap-3">
        <label onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(elderly.id)}
            className="w-4 h-4 rounded border-warm-300 text-warm-600 focus:ring-warm-500"
          />
        </label>
        <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center text-warm-600 font-bold text-sm">
          {elderly.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-warm-800 truncate">{elderly.name}</p>
          <p className="text-xs text-warm-400">
            {elderly.roomNumber ? `${elderly.roomNumber} · ` : ''}
            {elderly.groupName}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ElderlyPage() {
  const {
    elderlyList,
    groups,
    selectedIds,
    loaded,
    loading,
    loadElderly,
    addElderly,
    importElderly,
    setSortOrder,
    toggleSelect,
    selectAll,
    deselectAll,
  } = useElderlyStore();
  const { records, loadRecords, setStatus, batchSetStatus, cleanupOldRecords } =
    useActivityRecordStore();
  const { currentPlan, loadOrCreatePlan } = useWeeklyPlanStore();
  const { activities, loadActivities } = useActivityLibraryStore();

  const [selectedElderly, setSelectedElderly] = useState<Elderly | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [recordView, setRecordView] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [cleanupCount, setCleanupCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (!loaded) loadElderly();
    loadRecords();
    loadOrCreatePlan();
    loadActivities();
  }, [loaded, loadElderly, loadRecords, loadOrCreatePlan, loadActivities]);

  useEffect(() => {
    // Check for old records on first load
    if (records.length > 0) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const oldRecords = records.filter((r) => new Date(r.date) < oneYearAgo);
      if (oldRecords.length > 0) {
        setCleanupCount(oldRecords.length);
        setShowCleanupConfirm(true);
      }
    }
  }, [records.length]);

  const weekStart = getMonday(currentDate);
  const weekDates = getWeekDates(weekStart);

  const filteredElderly = elderlyList.filter((e) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'default') return e.groupId === 'default';
    return e.groupId === statusFilter;
  }).filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.roomNumber.toLowerCase().includes(q);
  });

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await readExcelFile(file);
      const groupName = prompt('请为这批老人输入分组名称：') || '默认分组';
      await importElderly(data, groupName);
      setShowImport(false);
    } catch (err) {
      alert('导入失败：' + (err instanceof Error ? err.message : '文件格式有误'));
    }
  };

  const handleAddElderly = async () => {
    if (!newName.trim()) return;
    let groupId = 'default';
    let groupName = '默认分组';
    if (newGroup.trim()) {
      const g = groups.find((g) => g.name === newGroup.trim());
      if (g) {
        groupId = g.id;
        groupName = g.name;
      } else {
        const store = useElderlyStore.getState();
        const newG = await store.addGroup(newGroup.trim());
        groupId = newG.id;
        groupName = newG.name;
      }
    }
    await addElderly({
      name: newName.trim(),
      roomNumber: newRoom.trim(),
      groupId,
      groupName,
    });
    setNewName('');
    setNewRoom('');
    setNewGroup('');
    setShowAddForm(false);
  };

  const handleBatchStatus = async (status: ParticipationStatus) => {
    if (selectedIds.length === 0) return;
    // Mark for today
    const today = new Date().toISOString().split('T')[0];
    await batchSetStatus(selectedIds, today, 'morning-1', '批量标记', status);
    deselectAll();
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredElderly.findIndex((e) => e.id === active.id);
    const newIndex = filteredElderly.findIndex((e) => e.id === over.id);
    const reordered = [...filteredElderly];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setSortOrder(reordered);
  };

  const handleCleanup = async () => {
    const count = await cleanupOldRecords();
    setShowCleanupConfirm(false);
  };

  const getElderlyRecords = (elderlyId: string) => {
    const startDate = weekDates[0];
    const endDate = weekDates[6];
    return records.filter(
      (r) => r.elderlyId === elderlyId && r.date >= startDate && r.date <= endDate
    );
  };

  const getActivityForSlot = (date: string, timeSlotId: string): string => {
    if (!currentPlan) return '';
    const dateObj = new Date(date);
    const startOfWeek = new Date(weekStart);
    const dayDiff = Math.floor((dateObj.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
    const weekday = dayDiff + 1;
    if (weekday < 1 || weekday > 7) return '';
    const cell = currentPlan.cells[`${timeSlotId}-${weekday}`];
    if (!cell) return '';
    if (cell.customText) return cell.customText;
    if (cell.activityId) {
      const act = activities.find((a) => a.id === cell.activityId);
      return act?.name || '';
    }
    return '';
  };

  const statusBadge = (status: ParticipationStatus) => {
    switch (status) {
      case 'participated':
        return <span className="inline-block w-5 h-5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center">✓</span>;
      case 'not_participated':
        return <span className="inline-block w-5 h-5 rounded-full bg-red-400 text-white text-[10px] flex items-center justify-center">✗</span>;
      case 'unmarked':
        return <span className="inline-block w-5 h-5 rounded-full bg-gray-200 text-gray-400 text-[10px] flex items-center justify-center">-</span>;
    }
  };

  if (loading && !loaded) {
    return <LoadingSpinner text="加载老人数据..." />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-warm-200 rounded-lg hover:bg-warm-50 text-sm text-warm-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          导入Excel
        </button>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-warm-500 text-white rounded-lg hover:bg-warm-600 text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          新增老人
        </button>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-warm-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索姓名/房号..."
            className="pl-8 pr-3 py-1.5 border border-warm-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-warm-500 w-40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2 py-1.5 border border-warm-200 rounded-lg text-xs text-warm-700 bg-white"
        >
          <option value="all">全部</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-warm-500/10 border border-warm-200 rounded-lg px-4 py-2 flex items-center gap-3">
          <span className="text-sm text-warm-700">已选 {selectedIds.length} 人</span>
          <button
            onClick={() => batchSetStatus(selectedIds, new Date().toISOString().split('T')[0], 'morning-1', '批量标记', 'participated')}
            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition-colors"
          >
            标记已参加
          </button>
          <button
            onClick={() => batchSetStatus(selectedIds, new Date().toISOString().split('T')[0], 'morning-1', '批量标记', 'not_participated')}
            className="px-3 py-1.5 bg-red-400 text-white rounded-lg text-xs hover:bg-red-500 transition-colors"
          >
            标记未参加
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1.5 border border-warm-200 rounded-lg text-xs text-warm-600 hover:bg-warm-50 transition-colors"
          >
            取消选择
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Elderly Grid */}
        <div className="lg:w-1/3 xl:w-1/4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-warm-500">
              共 {filteredElderly.length} 位老人
            </p>
            <button
              onClick={selectedIds.length > 0 ? deselectAll : selectAll}
              className="flex items-center gap-1 text-xs text-warm-600 hover:text-warm-700"
            >
              {selectedIds.length > 0 ? (
                <X className="w-3 h-3" />
              ) : (
                <CheckSquare className="w-3 h-3" />
              )}
              {selectedIds.length > 0 ? '取消全选' : '全选'}
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredElderly.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredElderly.map((elderly) => (
                  <SortableCard
                    key={elderly.id}
                    elderly={elderly}
                    selected={selectedIds.includes(elderly.id)}
                    onToggle={toggleSelect}
                    onClick={setSelectedElderly}
                  />
                ))}
              </SortableContext>
            </DndContext>
            {filteredElderly.length === 0 && (
              <div className="text-center py-8 text-warm-400 text-sm">
                {elderlyList.length === 0 ? '暂无老人数据，请导入或新增' : '无匹配结果'}
              </div>
            )}
          </div>
        </div>

        {/* Activity Record Panel */}
        <div className="flex-1 bg-white rounded-xl border border-warm-100 p-4">
          {selectedElderly ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-warm-800">{selectedElderly.name}</h3>
                  <p className="text-xs text-warm-400">
                    {selectedElderly.roomNumber} · {selectedElderly.groupName}
                  </p>
                </div>
                <div className="flex gap-1">
                  {(['daily', 'weekly', 'monthly'] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => setRecordView(view)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        recordView === view
                          ? 'bg-warm-500 text-white'
                          : 'bg-warm-50 text-warm-600 hover:bg-warm-100'
                      }`}
                    >
                      {view === 'daily' ? '日记录' : view === 'weekly' ? '周记录' : '月记录'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly Record Table */}
              {recordView === 'weekly' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-warm-50">
                        <th className="p-2 border border-warm-100 text-left text-warm-600">日期</th>
                        {DEFAULT_TIME_SLOTS.map((slot) => (
                          <th key={slot.id} className="p-2 border border-warm-100 text-warm-600 whitespace-nowrap">
                            {slot.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weekDates.map((date) => {
                        const records = getElderlyRecords(selectedElderly.id).filter(
                          (r) => r.date === date
                        );
                        return (
                          <tr key={date}>
                            <td className="p-2 border border-warm-100 font-medium text-warm-700 whitespace-nowrap">
                              {formatDate(date).slice(5)}
                            </td>
                            {DEFAULT_TIME_SLOTS.map((slot) => {
                              const record = records.find((r) => r.timeSlotId === slot.id);
                              const activityName = record?.activityName || getActivityForSlot(date, slot.id);
                              return (
                                <td
                                  key={slot.id}
                                  className="p-2 border border-warm-100 text-center"
                                >
                                  <div className="flex flex-col items-center gap-1">
                                    {record ? (
                                      <button
                                        onClick={async () => {
                                          const nextStatus: Record<string, ParticipationStatus> = {
                                            participated: 'not_participated',
                                            not_participated: 'unmarked',
                                            unmarked: 'participated',
                                          };
                                          await setStatus(
                                            selectedElderly.id,
                                            date,
                                            slot.id,
                                            activityName,
                                            nextStatus[record.status]
                                          );
                                        }}
                                        className="cursor-pointer"
                                        title="点击切换状态"
                                      >
                                        {statusBadge(record.status)}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          setStatus(selectedElderly.id, date, slot.id, activityName, 'participated')
                                        }
                                        className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 hover:border-warm-500 text-[9px] text-gray-300 hover:text-warm-500 flex items-center justify-center"
                                        title="标记已参加"
                                      >
                                        +
                                      </button>
                                    )}
                                    {activityName && (
                                      <span className="text-[9px] text-warm-500 truncate max-w-[80px] block">
                                        {activityName}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Daily Record */}
              {recordView === 'daily' && (
                <div className="space-y-3">
                  {DEFAULT_TIME_SLOTS.map((slot) => {
                    const today = new Date().toISOString().split('T')[0];
                    const record = records.find(
                      (r) =>
                        r.elderlyId === selectedElderly.id &&
                        r.date === today &&
                        r.timeSlotId === slot.id
                    );
                    const activityName = getActivityForSlot(today, slot.id);
                    return (
                      <div
                        key={slot.id}
                        className="flex items-center gap-3 p-3 bg-warm-50 rounded-lg"
                      >
                        <span className="text-xs text-warm-600 w-28 shrink-0">{slot.label}</span>
                        <span className="text-xs text-warm-700 flex-1">
                          {activityName || '暂未安排活动'}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              setStatus(selectedElderly.id, today, slot.id, activityName, 'participated')
                            }
                            className={`px-2 py-1 rounded text-[10px] ${
                              record?.status === 'participated'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-green-100'
                            }`}
                          >
                            已参加
                          </button>
                          <button
                            onClick={() =>
                              setStatus(selectedElderly.id, today, slot.id, activityName, 'not_participated')
                            }
                            className={`px-2 py-1 rounded text-[10px] ${
                              record?.status === 'not_participated'
                                ? 'bg-red-400 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-red-100'
                            }`}
                          >
                            未参加
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Monthly Record */}
              {recordView === 'monthly' && (
                <div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                      <div key={d} className="text-[10px] text-warm-400 py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 42 }, (_, i) => {
                      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                      const startDay = firstDay.getDay();
                      const day = i - startDay + 1;
                      const dateStr = day > 0 && day <= new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
                        ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        : null;
                      const dayRecords = dateStr
                        ? records.filter((r) => r.elderlyId === selectedElderly.id && r.date === dateStr)
                        : [];
                      const participated = dayRecords.filter((r) => r.status === 'participated').length;
                      const total = dayRecords.length;

                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] ${
                            dateStr
                              ? dayRecords.length > 0
                                ? participated === total && total > 0
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                                : 'bg-warm-50 text-warm-400'
                              : 'bg-transparent'
                          }`}
                        >
                          {dateStr && (
                            <>
                              <span className="font-medium">{day}</span>
                              {total > 0 && (
                                <span className="text-[8px]">{participated}/{total}</span>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[10px] text-warm-500">
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-green-100" /> 全部参加
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-amber-100" /> 部分参加
                    </div>
                  </div>
                </div>
              )}

              {/* Print Button for Records */}
              <div className="mt-4 flex justify-end no-print">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-warm-200 rounded-lg text-xs text-warm-600 hover:bg-warm-50 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  打印记录
                </button>
              </div>
              <p className="text-[10px] text-warm-300 mt-2 text-right no-print">
                ⚠️ 请妥善保管纸质件，老人信息请注意隐私保护
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-warm-400">
              <Users className="w-12 h-12 mb-3" />
              <p className="text-sm">请从左侧选择一位老人查看活动记录</p>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-warm-800 mb-2">导入老人名单</h3>
            <p className="text-xs text-warm-500 mb-4">
              请上传 .xlsx 文件，要求包含「老人姓名」「房间号」列
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportFile}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-warm-200 rounded-lg text-sm text-warm-500 hover:border-warm-400 hover:text-warm-600 transition-colors"
            >
              点击选择 Excel 文件
            </button>
            <button
              onClick={() => setShowImport(false)}
              className="mt-3 w-full py-2 text-sm text-warm-500 hover:text-warm-700"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Add Elderly Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-bold text-warm-800 mb-4">新增老人</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-warm-600 block mb-1">姓名 *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-warm-500"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="text-xs text-warm-600 block mb-1">房间号</label>
                <input
                  type="text"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-warm-500"
                  placeholder="如：A栋301"
                />
              </div>
              <div>
                <label className="text-xs text-warm-600 block mb-1">分组</label>
                <input
                  type="text"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-warm-500"
                  placeholder="输入分组名称（可选）"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-warm-200 rounded-lg text-sm text-warm-600 hover:bg-warm-50"
              >
                取消
              </button>
              <button
                onClick={handleAddElderly}
                className="px-4 py-2 bg-warm-500 text-white rounded-lg text-sm hover:bg-warm-600"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Confirm */}
      <ConfirmDialog
        open={showCleanupConfirm}
        title="发现过期记录"
        message={`发现 ${cleanupCount} 条超过1年的活动记录。建议清理以释放存储空间，清理前可导出备份。`}
        confirmText="立即清理"
        cancelText="稍后再说"
        onConfirm={handleCleanup}
        onCancel={() => setShowCleanupConfirm(false)}
      />
    </div>
  );
}

// Need to import Users for the empty state
function Users(props: any) {
  return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>;
}

function X(props: any) {
  return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>;
}
