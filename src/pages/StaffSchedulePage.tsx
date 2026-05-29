import { useState, useEffect } from 'react';
import { useStaffStore } from '../store/staffStore';
import { ChevronLeft, ChevronRight, Copy, Plus, X, Users, Calendar } from 'lucide-react';
import { generateId } from '../utils/helpers';

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export default function StaffSchedulePage() {
  const { staffList, schedules, loaded, loadStaff, addStaff, deleteStaff, updateStaff, getSchedule, setDayShift, copyPrevMonth } = useStaffStore();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');

  useEffect(() => {
    if (!loaded) loadStaff();
  }, [loaded]);

  const daysInMonth = new Date(year, month, 0).getDate();

  const handleAddStaff = async () => {
    if (!newName.trim()) return;
    await addStaff({ name: newName.trim(), position: newPosition.trim() || '员工' });
    setNewName('');
    setNewPosition('');
    setShowAddStaff(false);
  };

  const handleSaveEdit = async (staff: typeof staffList[0]) => {
    await updateStaff({ ...staff, name: editName.trim() || staff.name, position: editPosition.trim() || staff.position });
    setEditingStaff(null);
  };

  const handleToggle = async (staffId: string, day: number) => {
    const schedule = getSchedule(staffId, year, month);
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const current = schedule?.schedule[dateKey];
    await setDayShift(staffId, year, month, day, current === '上班' ? '休息' : '上班');
  };

  const handleCopyPrev = async () => {
    for (const staff of staffList) {
      await copyPrevMonth(staff.id, year, month);
    }
  };

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 页头 + 操作 */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 rounded hover:bg-warm-100 text-warm-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xl font-black select-none text-warm-800">
            {year}年{MONTH_NAMES[month - 1]}排班
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded hover:bg-warm-100 text-warm-500 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={() => { const d = new Date(); setYear(d.getFullYear()); setMonth(d.getMonth() + 1); }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-warm-600 bg-white border border-warm-200 rounded-lg hover:bg-warm-50 transition-colors">
            <Calendar className="w-4 h-4" /> 今天
          </button>
        </div>
        <div className="flex items-center gap-2">
          {staffList.length > 0 && (
            <button onClick={handleCopyPrev}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-warm-600 bg-white border border-warm-200 rounded-lg hover:bg-warm-50 transition-colors">
              <Copy className="w-4 h-4" /> 复制上月排班
            </button>
          )}
          <button onClick={() => setShowAddStaff(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg transition-colors"
            style={{ background: 'linear-gradient(135deg, #7B68EE 0%, #E6A8D7 100%)' }}>
            <Plus className="w-4 h-4" /> 新增员工
          </button>
        </div>
      </div>

      {/* 新增员工弹窗 */}
      {showAddStaff && (
        <div className="bg-white rounded-xl border border-warm-100 p-5 shadow-sm max-w-sm mx-auto no-print">
          <h3 className="font-bold text-warm-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-warm-500" /> 新增员工
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">姓名</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="输入姓名" required autoFocus
                className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-warm-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">职位</label>
              <input type="text" value={newPosition} onChange={e => setNewPosition(e.target.value)}
                placeholder="经理 / 社工 / 实习生..."
                className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-warm-400" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddStaff}
                className="flex-1 py-2 text-sm font-bold text-white rounded-lg transition-colors"
                style={{ background: 'linear-gradient(135deg, #7B68EE 0%, #E6A8D7 100%)' }}>
                添加
              </button>
              <button onClick={() => setShowAddStaff(false)}
                className="px-4 py-2 text-sm text-warm-500 border border-warm-200 rounded-lg hover:bg-warm-50">
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {staffList.length === 0 && !showAddStaff && (
        <div className="text-center py-16 text-warm-400">
          <Users className="w-12 h-12 mx-auto mb-3 text-warm-300" />
          <p className="text-lg font-medium mb-1">暂无员工数据</p>
          <p className="text-sm">点击上方「新增员工」添加</p>
        </div>
      )}

      {/* 排班表 */}
      {staffList.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-warm-100 bg-white shadow-sm print:border-0 print:shadow-none">
          <table className="w-full text-sm" style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white border-r border-b border-warm-200 px-2 py-2 text-left text-xs font-bold text-warm-600" style={{ minWidth: '120px' }}>
                  姓名 <span className="text-[10px] text-warm-400 font-normal">(职位)</span>
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const date = new Date(year, month - 1, d);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <th key={d}
                      className={`px-1 py-1.5 text-center text-[11px] font-bold border-b border-warm-200 ${
                        isWeekend ? 'text-red-400 bg-red-50' : 'text-warm-500'
                      }`}
                      style={{ minWidth: '36px', borderRight: '1px solid #fde0b8' }}>
                      {d}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => {
                const schedule = getSchedule(staff.id, year, month);
                return (
                  <tr key={staff.id} className="border-b border-warm-100 last:border-b-0">
                    <td className="sticky left-0 z-10 bg-white border-r border-warm-200 px-2 py-1.5">
                      {editingStaff === staff.id ? (
                        <div className="flex flex-col gap-1">
                          <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                            className="w-20 px-1.5 py-0.5 border border-warm-200 rounded text-xs outline-none" />
                          <input type="text" value={editPosition} onChange={e => setEditPosition(e.target.value)}
                            className="w-20 px-1.5 py-0.5 border border-warm-200 rounded text-xs outline-none" />
                          <div className="flex gap-1">
                            <button onClick={() => handleSaveEdit(staff)}
                              className="text-[10px] text-green-600 hover:text-green-700">保存</button>
                            <button onClick={() => setEditingStaff(null)}
                              className="text-[10px] text-warm-400 hover:text-warm-600">取消</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-warm-800 truncate">{staff.name}</span>
                          <span className="text-[9px] text-warm-400 truncate">{staff.position}</span>
                          <button onClick={() => {
                            setEditingStaff(staff.id);
                            setEditName(staff.name);
                            setEditPosition(staff.position);
                          }}
                            className="ml-auto text-[9px] text-warm-300 hover:text-warm-500 print:hidden">✎</button>
                          <button onClick={async () => {
                            if (confirm(`确定删除员工「${staff.name}」吗？`)) {
                              await deleteStaff(staff.id);
                            }
                          }}
                            className="text-[9px] text-red-200 hover:text-red-400 print:hidden">✕</button>
                        </div>
                      )}
                    </td>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      const shift = schedule?.schedule[dateKey];
                      const isOn = shift === '上班';
                      const date = new Date(year, month - 1, d);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      return (
                        <td key={d}
                          onClick={() => handleToggle(staff.id, d)}
                          className={`text-center cursor-pointer transition-colors print:border print:border-gray-200 ${
                            isOn
                              ? 'bg-blue-50 hover:bg-blue-100'
                              : 'hover:bg-warm-50'
                          } ${isWeekend ? 'bg-red-50/30' : ''}`}
                          style={{ height: '36px', borderRight: '1px solid #fde0b8', borderBottom: '1px solid #fde0b8' }}>
                          <span className={`text-[11px] font-medium ${
                            isOn ? 'text-blue-600' : 'text-warm-300'
                          }`}>
                            {isOn ? '上班' : ''}
                          </span>
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

      {/* 图例 */}
      <div className="flex items-center gap-4 text-xs text-warm-500 no-print">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200"></div>
          <span>上班</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-white border border-warm-200"></div>
          <span>休息</span>
        </div>
      </div>
    </div>
  );
}
