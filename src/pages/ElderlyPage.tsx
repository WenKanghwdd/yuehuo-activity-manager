import { useEffect, useState, useRef } from 'react';
import {
  Upload,
  UserPlus,
  CheckSquare,
  Printer,
  Search,
  Users,
  X,
  Trash2,
  FileText,
} from 'lucide-react';
import { useElderlyStore } from '../store/elderlyStore';
import { useActivityRecordStore } from '../store/activityRecordStore';
import { useWeeklyPlanStore } from '../store/weeklyPlanStore';
import { useActivityLibraryStore } from '../store/activityLibraryStore';
import type { Elderly, ParticipationStatus } from '../types';
import { DEFAULT_TIME_SLOTS } from '../types';
import { getMonday, getWeekDates, readExcelFile, formatDate } from '../utils/helpers';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
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
            {elderly.roomNumber ? <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-medium mr-1">🏠 {elderly.roomNumber}</span> : ''}
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
    deleteElderly,
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
  const [currentDate] = useState(new Date());
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [cleanupCount, setCleanupCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchSlotMode, setBatchSlotMode] = useState<'morning' | 'afternoon' | 'both'>('morning');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printMode, setPrintMode] = useState<'separate' | 'combined'>('separate');
  const [printingElderly, setPrintingElderly] = useState<Elderly[]>([]);
  const [wkTotal, setWkTotal] = useState(0);
  const [wkDid, setWkDid] = useState(0);
  const [wkWording, setWkWording] = useState('');
  const [moTotal, setMoTotal] = useState(0);
  const [moDid, setMoDid] = useState(0);
  const [moWording, setMoWording] = useState('');
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

  // Weekly summary
  useEffect(() => {
    const t = weekDates.reduce((sum, date) => {
      const slots = DEFAULT_TIME_SLOTS.filter(s => getActivityForSlot(date, s.id));
      return sum + slots.length;
    }, 0);
    setWkTotal(t);
    if (selectedElderly && t) {
      const d = records.filter(
        r => r.elderlyId === selectedElderly.id && r.date >= weekDates[0] && r.date <= weekDates[6] && r.status === "participated"
      ).length;
      setWkDid(d);
      const p = Math.round(d / t * 100);
      if (p >= 80) setWkWording("，很积极呢 👏");
      else if (p >= 50) setWkWording("，继续加油呀 💪");
      else setWkWording("，慢慢来不着急 🌿");
    } else {
      setWkDid(0);
      setWkWording("");
    }
  }, [selectedElderly, records, weekDates, currentPlan, activities]);

  // Monthly summary
  useEffect(() => {
    if (!selectedElderly) { setMoTotal(0); setMoDid(0); setMoWording(""); return; }
    const td = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    let t = 0;
    let d = 0;
    for (let i = 1; i <= td; i++) {
      const ds = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(i).padStart(2, '0');
      const dr = records.filter(r => r.elderlyId === selectedElderly.id && r.date === ds);
      DEFAULT_TIME_SLOTS.forEach(s => {
        if (getActivityForSlot(ds, s.id) || dr.some(r => r.timeSlotId === s.id)) { t++; }
      });
      d += dr.filter(r => r.status === "participated").length;
    }
    setMoTotal(t);
    setMoDid(d);
    if (t > 0) {
      const p = Math.round(d / t * 100);
      if (p >= 80) setMoWording("，真棒呀 🎉");
      else if (p >= 50) setMoWording("，继续努力 💪");
      else setMoWording("，参加一下活动也挺好的 ☕");
    } else {
      setMoWording("");
    }
  }, [selectedElderly, records, currentDate, currentPlan, activities]);

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
    await cleanupOldRecords();
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
    return <LoadingSpinner message="加载老人数据..." />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 no-print">
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
        <div className="bg-warm-500/10 border border-warm-200 rounded-lg px-4 py-2 flex flex-wrap items-center gap-2 no-print">
          <span className="text-sm text-warm-700 font-medium">已选 {selectedIds.length} 人</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-warm-500">日期：</span>
            <input
              type="date"
              value={batchDate}
              onChange={(e) => setBatchDate(e.target.value)}
              className="px-2 py-1 border border-warm-200 rounded text-xs outline-none focus:ring-2 focus:ring-warm-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-warm-500">时段：</span>
            <button
              onClick={() => setBatchSlotMode('morning')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                batchSlotMode === 'morning'
                  ? 'bg-warm-500 text-white'
                  : 'bg-white border border-warm-200 text-warm-600 hover:bg-warm-50'
              }`}
            >上午</button>
            <button
              onClick={() => setBatchSlotMode('afternoon')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                batchSlotMode === 'afternoon'
                  ? 'bg-warm-500 text-white'
                  : 'bg-white border border-warm-200 text-warm-600 hover:bg-warm-50'
              }`}
            >下午</button>
            <button
              onClick={() => setBatchSlotMode('both')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                batchSlotMode === 'both'
                  ? 'bg-warm-500 text-white'
                  : 'bg-white border border-warm-200 text-warm-600 hover:bg-warm-50'
              }`}
            >全天</button>
          </div>
          <button
            onClick={() => {
              if (batchSlotMode === 'both') {
                batchSetStatus(selectedIds, batchDate, 'morning', '批量标记', 'participated');
                batchSetStatus(selectedIds, batchDate, 'afternoon', '批量标记', 'participated');
              } else {
                batchSetStatus(selectedIds, batchDate, batchSlotMode, '批量标记', 'participated');
              }
            }}
            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition-colors"
          >
            {batchSlotMode === 'both' ? '均已参加' : '已参加'}
          </button>
          <button
            onClick={() => {
              if (batchSlotMode === 'both') {
                batchSetStatus(selectedIds, batchDate, 'morning', '批量标记', 'not_participated');
                batchSetStatus(selectedIds, batchDate, 'afternoon', '批量标记', 'not_participated');
              } else {
                batchSetStatus(selectedIds, batchDate, batchSlotMode, '批量标记', 'not_participated');
              }
            }}
            className="px-3 py-1.5 bg-red-400 text-white rounded-lg text-xs hover:bg-red-500 transition-colors"
          >
            {batchSlotMode === 'both' ? '均未参加' : '未参加'}
          </button>
          <button
            onClick={() => {
              const selected = elderlyList.filter(e => selectedIds.includes(e.id));
              setPrintingElderly(selected);
              setPrintMode('separate');
              setShowPrintModal(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-warm-200 rounded-lg text-xs text-warm-600 hover:bg-warm-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            打印选中记录
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
        <div className="lg:w-1/3 xl:w-1/4 no-print">
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
        <div className="flex-1 bg-white rounded-xl border border-warm-100 p-4 print:max-w-none print:w-full">
          {selectedElderly ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-warm-800">{selectedElderly.name}</h3>
                  <p className="text-xs text-warm-400">
                    {selectedElderly.roomNumber ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[11px] font-medium">🏠 {selectedElderly.roomNumber}</span> : ''}
                    {selectedElderly.roomNumber && selectedElderly.groupName ? ' · ' : ''}
                    {selectedElderly.groupName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(selectedElderly.id)}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors no-print"
                    title="删除此老人"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除
                  </button>
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

                {wkTotal > 0 && <div className="mt-3 text-xs text-warm-500 leading-relaxed no-print">
                  这周一共安排了 <span className="text-warm-600 font-medium">{wkTotal}</span> 场活动，
                  老人家参加了 <span className={wkDid > 0 ? "text-green-600 font-medium" : "text-warm-500"}>{wkDid}</span> 场{wkWording}
                </div>}
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
                      const morningRecord = dayRecords.find(r => r.timeSlotId === 'morning');
                      const afternoonRecord = dayRecords.find(r => r.timeSlotId === 'afternoon');
                      const morningName = morningRecord?.activityName || (dateStr ? getActivityForSlot(dateStr, 'morning') : '');
                      const afternoonName = afternoonRecord?.activityName || (dateStr ? getActivityForSlot(dateStr, 'afternoon') : '');
                      const morningParticipated = morningRecord?.status === 'participated';
                      const afternoonParticipated = afternoonRecord?.status === 'participated';
                      const hasMorning = !!morningName || !!morningRecord;
                      const hasAfternoon = !!afternoonName || !!afternoonRecord;

                      return (
                        <div
                          key={i}
                          className={`rounded-lg p-1 flex flex-col items-center ${dateStr ? 'bg-warm-50' : 'bg-transparent'} min-h-[4.5rem]`}
                        >
                          {dateStr && (
                            <>
                              <span className="text-[9px] font-medium text-warm-500 mb-0.5">{day}</span>
                              <div className="w-full space-y-[1px]">
                                {hasMorning && (
                                  <div className={`text-[8px] leading-tight px-1 py-[1px] rounded truncate text-center ${
                                    morningParticipated
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-blue-50/50 text-blue-400'
                                  }`}>
                                    {morningName || '上午'}
                                  </div>
                                )}
                                {hasAfternoon && (
                                  <div className={`text-[8px] leading-tight px-1 py-[1px] rounded truncate text-center ${
                                    afternoonParticipated
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-orange-50/50 text-orange-400'
                                  }`}>
                                    {afternoonName || '下午'}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[9px] text-warm-500">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-blue-100" /> 上午已参加
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-blue-50/50 border border-blue-200" /> 上午未参加
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-orange-100" /> 下午已参加
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-orange-50/50 border border-orange-200" /> 下午未参加
                    </div>
                  </div>
                </div>
              )}

                {moTotal > 0 && <div className="mt-2 text-xs text-warm-500 leading-relaxed">
                  这个月一共安排了 <span className="text-warm-600 font-medium">{moTotal}</span> 场活动，
                  老人家参加了 <span className={moDid > 0 ? "text-green-600 font-medium" : "text-warm-500"}>{moDid}</span> 场{moWording}
                </div>}
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

      {/* Delete elderly confirm */}
      <ConfirmDialog
        open={showDeleteConfirm !== null}
        title="确认删除"
        message={`确定要删除老人「${elderlyList.find(e => e.id === showDeleteConfirm)?.name || ''}」吗？此操作不可撤销，关联的活动记录也将一并清除。`}
        confirmText="确认删除"
        cancelText="取消"
        onConfirm={async () => {
          if (showDeleteConfirm) {
            await deleteElderly(showDeleteConfirm);
            if (selectedElderly?.id === showDeleteConfirm) {
              setSelectedElderly(null);
            }
            setShowDeleteConfirm(null);
          }
        }}
        onCancel={() => setShowDeleteConfirm(null)}
        danger
      />

      {/* Multi-print modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 no-print">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-bold text-warm-800 mb-2">打印活动记录</h3>
            <p className="text-sm text-warm-500 mb-4">已选 {selectedIds.length} 位老人</p>
            <div className="space-y-2 mb-4">
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                printMode === 'separate' ? 'border-warm-500 bg-warm-50' : 'border-warm-200 hover:border-warm-300'
              }`}>
                <input
                  type="radio"
                  name="printMode"
                  checked={printMode === 'separate'}
                  onChange={() => setPrintMode('separate')}
                  className="text-warm-500 focus:ring-warm-500"
                />
                <div>
                  <p className="text-sm font-medium text-warm-700">每人一页</p>
                  <p className="text-[10px] text-warm-400">每页打印一位老人的记录</p>
                </div>
              </label>
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                printMode === 'combined' ? 'border-warm-500 bg-warm-50' : 'border-warm-200 hover:border-warm-300'
              }`}>
                <input
                  type="radio"
                  name="printMode"
                  checked={printMode === 'combined'}
                  onChange={() => setPrintMode('combined')}
                  className="text-warm-500 focus:ring-warm-500"
                />
                <div>
                  <p className="text-sm font-medium text-warm-700">打印在同一页</p>
                  <p className="text-[10px] text-warm-400">所有人记录打印在同一张纸上</p>
                </div>
              </label>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setPrintingElderly([]);
                }}
                className="px-4 py-2 border border-warm-200 rounded-lg text-sm text-warm-600 hover:bg-warm-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setTimeout(() => window.print(), 100);
                }}
                className="px-4 py-2 bg-warm-500 text-white rounded-lg text-sm hover:bg-warm-600"
              >
                确认打印
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print-only content: multi-person records */}
      {printingElderly.length > 0 && (
        <div className="hidden print:block">
          {printingElderly.map((elderly, idx) => (
            <div
              key={elderly.id}
              style={printMode === 'separate' && idx > 0 ? { pageBreakBefore: 'always' } : undefined}
              className="p-4"
            >
              <h2 className="text-base font-bold mb-1" style={{ fontFamily: 'serif' }}>
                {elderly.name}
                {elderly.roomNumber ? ` - ${elderly.roomNumber}` : ''}
              </h2>
              <p className="text-[10px] text-gray-500 mb-3">
                活动记录 · 当前周 ({weekDates[0]} ~ {weekDates[6]})
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f5f0eb' }}>
                    <th style={{ padding: '6px 8px', border: '1px solid #e0d5c8', textAlign: 'left' }}>日期</th>
                    {DEFAULT_TIME_SLOTS.map(s => (
                      <th key={s.id} style={{ padding: '6px 8px', border: '1px solid #e0d5c8', textAlign: 'center' }}>{s.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weekDates.map(date => {
                    const elderlyRecords = records.filter(
                      r => r.elderlyId === elderly.id && r.date === date
                    );
                    return (
                      <tr key={date}>
                        <td style={{ padding: '6px 8px', border: '1px solid #e0d5c8', fontWeight: 500 }}>
                          {formatDate(date).slice(5)}
                        </td>
                        {DEFAULT_TIME_SLOTS.map(slot => {
                          const record = elderlyRecords.find(r => r.timeSlotId === slot.id);
                          const activityName = record?.activityName || '';
                          const statusText = record?.status === 'participated' ? '✓ 已参加'
                            : record?.status === 'not_participated' ? '✗ 未参加'
                            : '-';
                          return (
                            <td key={slot.id} style={{ padding: '6px 8px', border: '1px solid #e0d5c8', textAlign: 'center' }}>
                              <div>{statusText}</div>
                              {activityName && (
                                <div style={{ fontSize: '9px', color: '#8b7355' }}>{activityName}</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


