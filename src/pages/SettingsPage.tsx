import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { Download, Trash2, AlertTriangle, Database, Shield, HardDrive, Link2, Link2Off, CheckCircle2, Loader2, Image as ImageIcon, X, Plus, RotateCcw, Monitor, FolderOpen, RefreshCw, Cloud, Upload, LogIn, User } from 'lucide-react';
import { useLazyAuth } from '../hooks/useLazyAuth';
import { getAll, clearStore } from '../db';
import { useActivityRecordStore } from '../store/activityRecordStore';
import { exportToExcel } from '../utils/helpers';
import ConfirmDialog from '../components/common/ConfirmDialog';
import type { ActivityRecord } from '../types';
import { useFileStore, pickFileLocation, disconnectFile } from '../fileStore';
import { isElectron, useDesktopStore } from '../electronFileStore';
import { useBrandStore } from '../store/brandStore';
import { useTemplateStore } from '../store/templateStore';

export default function SettingsPage() {
  const { cleanupOldRecords } = useActivityRecordStore();
  const { fileHandle, syncStatus, lastSyncTime } = useFileStore();
  const brand = useBrandStore();
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [newTplDesc, setNewTplDesc] = useState('');
  const [newTplSlots, setNewTplSlots] = useState(['morning', 'afternoon']);
  const [newTplCustomSlots, setNewTplCustomSlots] = useState<{ id: string; label: string }[]>([]);
  const [customSlotInput, setCustomSlotInput] = useState('');
  const [newTplNotes, setNewTplNotes] = useState(true);
  const [newTplWeather, setNewTplWeather] = useState(true);
  const templateStore = useTemplateStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!brand.loaded) brand.loadConfig();
    if (!templateStore.loaded) templateStore.loadTemplates();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('文件大小不能超过 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      brand.uploadLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  const [recordCount, setRecordCount] = useState(0);
  const [cleanupCount, setCleanupCount] = useState(0);
  const [showCleanup, setShowCleanup] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const records = await getAll<ActivityRecord>('activityRecords');
    setRecordCount(records.length);

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const old = records.filter((r) => new Date(r.date) < oneYearAgo);
    setCleanupCount(old.length);
  };

  const handleExport = async () => {
    const records = await getAll<ActivityRecord>('activityRecords');
    if (records.length === 0) {
      setMessage('暂无活动记录可导出');
      return;
    }
    const data = records.map((r) => ({
      长者ID: r.elderlyId,
      日期: r.date,
      时间段ID: r.timeSlotId,
      活动名称: r.activityName,
      参与状态: r.status === 'participated' ? '已参加' : r.status === 'not_participated' ? '未参加' : '未标记',
    }));
    exportToExcel(data, `悦活活动记录备份_${new Date().toISOString().split('T')[0]}`);
    setMessage('导出成功！');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCleanup = async () => {
    const count = await cleanupOldRecords();
    setShowCleanup(false);
    setMessage(`已清理 ${count} 条过期记录`);
    setTimeout(() => setMessage(''), 3000);
    loadStats();
  };

  const desktopStore = isElectron() ? useDesktopStore() : null;

  const DesktopStorageSection = () => (
    <div className="bg-white rounded-xl border border-warm-100 p-5">
      <h2 className="font-bold text-warm-800 flex items-center gap-2 mb-4">
        <Monitor className="w-5 h-5 text-warm-500" />
        本地数据存储
      </h2>
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <FolderOpen className="w-5 h-5 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-700">桌面版数据已自动保存</p>
            <p className="text-xs text-green-500">
              {desktopStore?.syncStatus === 'saving' ? '保存中...' : `上次同步：${desktopStore?.lastSyncTime || '首次运行'}`}
              {desktopStore?.syncStatus === 'saving' && ' · 保存中...'}
            </p>
          </div>
          {desktopStore?.syncStatus === 'saving' && <Loader2 className="w-4 h-4 text-green-500 animate-spin" />}
          {desktopStore?.syncStatus === 'saved' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        </div>
        <p className="text-xs text-warm-500 leading-relaxed">
          所有数据自动保存在应用内部目录，无需手动操作。
          换电脑或重装系统前请使用「导出活动记录」功能备份数据。
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs text-warm-400">
          <div className="p-2 bg-warm-50 rounded">
            <span className="font-medium">数据总量：</span>
            <span>{((desktopStore?.fileSize ?? 0) / 1024).toFixed(1)} KB</span>
          </div>
          <div className="p-2 bg-warm-50 rounded">
            <span className="font-medium">活动记录：</span>
            <span>{desktopStore?.recordsCount || 0} 条</span>
          </div>
        </div>
      </div>
    </div>
  );

  const BrowserStorageSection = () => (
    <div className="bg-white rounded-xl border border-warm-100 p-5">
      <h2 className="font-bold text-warm-800 flex items-center gap-2 mb-4">
        <HardDrive className="w-5 h-5 text-warm-500" />
        文件持久化存储
      </h2>
      {fileHandle ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-700">已连接到本地文件</p>
              <p className="text-xs text-green-500 truncate">
                {lastSyncTime ? `上次同步：${lastSyncTime}` : '等待首次同步'}
                {syncStatus === 'saving' && ' · 保存中...'}
              </p>
            </div>
            {syncStatus === 'saving' && <Loader2 className="w-4 h-4 text-green-500 animate-spin" />}
            {syncStatus === 'saved' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
          </div>
          <button
            onClick={disconnectFile}
            className="flex items-center gap-2 px-3 py-2 border border-warm-200 rounded-lg text-sm text-warm-600 hover:bg-warm-50 transition-colors"
          >
            <Link2Off className="w-4 h-4" />
            断开文件连接
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-warm-500 leading-relaxed">
            将数据保存到电脑上的本地文件（如桌面），即使清理浏览器缓存也不会丢失数据。
            支持 Chrome / Edge 浏览器。
          </p>
          <button
            onClick={pickFileLocation}
            className="flex items-center gap-2 px-4 py-2.5 bg-warm-500 text-white rounded-lg text-sm font-medium hover:bg-warm-600 transition-colors"
          >
            <Link2 className="w-4 h-4" />
            选择存储位置
          </button>
        </div>
      )}
    </div>
  );

  const handleClearAll = async () => {
    if (!confirm('确定要清空所有数据吗？此操作不可撤销！')) return;
    await clearStore('activityRecords');
    await clearStore('weeklyPlans');
    await clearStore('weeklyPlanCells');
    await clearStore('elderly');
    await clearStore('elderlyGroups');
    await clearStore('activities');
    await clearStore('staff');
    await clearStore('staffSchedules');
    setMessage('已清空所有数据');
    setTimeout(() => setMessage(''), 3000);
    loadStats();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Message toast */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm">
          {message}
        </div>
      )}

      {/* Data Stats */}
      <div className="bg-white rounded-xl border border-warm-100 p-5">
        <h2 className="font-bold text-warm-800 flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-warm-500" />
          数据概览
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-warm-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-warm-700">{recordCount}</p>
            <p className="text-xs text-warm-500 mt-1">活动记录总数</p>
          </div>
          <div className="bg-warm-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-warm-700">{cleanupCount}</p>
            <p className="text-xs text-warm-500 mt-1">超过1年的记录</p>
          </div>
        </div>
      </div>

      {/* 数据存储 — Electron 桌面版 vs 浏览器版 */}
      {isElectron() ? (
        <DesktopStorageSection />
      ) : (
        <BrowserStorageSection />
      )}

      {/* Brand Logo */}
      <div className="bg-white rounded-xl border border-warm-100 p-5">
        <h2 className="font-bold text-warm-800 flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-warm-500" />
          自定义打印 Logo
        </h2>
        <p className="text-xs text-warm-500 mb-4">
          上传您机构的 Logo，打印周计划表和活动记录时自动显示。仅打印可见，不影响屏幕显示。
        </p>

        <div className="space-y-4">
          {/* Preview */}
          {brand.config.base64 ? (
            <div className="flex items-center gap-4 p-3 bg-warm-50 rounded-lg">
              <div className="w-16 h-16 flex items-center justify-center bg-white rounded-lg border border-warm-200 p-1">
                <img src={brand.config.base64} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-warm-700">已上传</p>
                <p className="text-xs text-warm-400">支持 PNG / SVG，最大 2MB</p>
              </div>
              <button onClick={brand.removeLogo}
                className="flex items-center gap-1 px-3 py-1.5 border border-red-200 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors">
                <X className="w-3 h-3" /> 移除
              </button>
            </div>
          ) : (
            <div className="p-4 border-2 border-dashed border-warm-200 rounded-lg text-center">
              <ImageIcon className="w-8 h-8 mx-auto text-warm-300 mb-2" />
              <p className="text-sm text-warm-500 mb-2">尚未上传 Logo</p>
              <input ref={fileInputRef} type="file" accept="image/png,image/svg+xml,image/jpeg"
                className="hidden" onChange={handleLogoUpload} />
              <button onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-warm-500 text-white rounded-lg text-sm font-medium hover:bg-warm-600 transition-colors">
                选择图片上传
              </button>
            </div>
          )}

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-warm-500 mb-1.5">打印尺寸</label>
              <div className="flex gap-1">
                {(['small', 'medium', 'large'] as const).map(s => (
                  <button key={s}
                    onClick={() => brand.updateConfig({ size: s })}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      brand.config.size === s
                        ? 'bg-warm-500 text-white'
                        : 'bg-warm-50 text-warm-600 hover:bg-warm-100'
                    }`}>
                    {s === 'small' ? '小' : s === 'medium' ? '中' : '大'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-warm-500 mb-1.5">位置</label>
              <div className="flex gap-1">
                {([{id:'left',label:'左侧'}, {id:'right',label:'右侧'}] as const).map(p => (
                  <button key={p.id}
                    onClick={() => brand.updateConfig({ position: p.id })}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      brand.config.position === p.id
                        ? 'bg-warm-500 text-white'
                        : 'bg-warm-50 text-warm-600 hover:bg-warm-100'
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={brand.config.enabled}
              onChange={(e) => brand.updateConfig({ enabled: e.target.checked })}
              className="w-4 h-4 rounded border-warm-300 text-warm-600 focus:ring-warm-500" />
            <span className="text-sm text-warm-700">打印时显示 Logo</span>
          </label>

          {/* Preview */}
          {brand.config.base64 && brand.config.enabled && (
            <div className="p-3 bg-white border border-warm-200 rounded-lg">
              <p className="text-[10px] text-warm-400 mb-2">打印预览效果：</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600">悦活</span>
                <span className="text-[10px] text-warm-300">|</span>
                <img src={brand.config.base64} alt="Logo" className="h-5 w-auto" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Management */}
      <div className="bg-white rounded-xl border border-warm-100 p-5">
        <h2 className="font-bold text-warm-800 flex items-center gap-2 mb-4">
          <RotateCcw className="w-5 h-5 text-warm-500" />
          周计划模板
        </h2>
        <p className="text-xs text-warm-500 mb-4">
          管理周计划表的模板，预设模板不可删除。自定义模板可在周计划页切换使用。
        </p>

        <div className="space-y-2">
          {templateStore.templates.map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-warm-800">{t.name}</p>
                  {t.isPreset && <span className="text-[10px] text-warm-400 bg-warm-100 px-1.5 py-0.5 rounded">预设</span>}
                </div>
                <p className="text-xs text-warm-400">{t.description}</p>
                <p className="text-[10px] text-warm-300 mt-0.5">
                  {t.timeSlots.map(s => s.label).join(' · ')} · {t.weekdays}天
                  {t.hasNotes && ' · 有备注'}
                  {t.groupLabels?.length ? ` · 分组: ${t.groupLabels.join('/')}` : ''}
                </p>
              </div>
              {!t.isPreset && (
                <button onClick={() => templateStore.deleteTemplate(t.id)}
                  className="shrink-0 px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* New template form */}
        {showNewTemplateForm ? (
          <div className="mt-4 p-4 border border-warm-200 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-warm-500 mb-1">模板名称 *</label>
                <input type="text" value={newTplName} onChange={e => setNewTplName(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-warm-500" />
              </div>
              <div>
                <label className="block text-xs text-warm-500 mb-1">描述</label>
                <input type="text" value={newTplDesc} onChange={e => setNewTplDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-warm-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-warm-500 mb-1.5">时间段</label>
              <div className="flex gap-2 flex-wrap">
                {['morning', 'afternoon', 'evening'].map(sid => (
                  <label key={sid} className="flex items-center gap-1.5 px-3 py-1.5 border border-warm-200 rounded-lg cursor-pointer hover:bg-warm-50">
                    <input type="checkbox" checked={newTplSlots.includes(sid)}
                      onChange={() => setNewTplSlots(prev => prev.includes(sid) ? prev.filter(s => s !== sid) : [...prev, sid])}
                      className="w-3.5 h-3.5 text-warm-600 focus:ring-warm-500" />
                    <span className="text-sm text-warm-700">{{morning:'上午',afternoon:'下午',evening:'晚上'}[sid]}</span>
                  </label>
                ))}
                {/* 自定义时间段 */}
                {newTplCustomSlots.map(cs => (
                  <div key={cs.id} className="flex items-center gap-0.5 px-2 py-1 border border-purple-200 rounded-lg bg-purple-50">
                    <span className="text-sm text-purple-700">{cs.label}</span>
                    <button onClick={() => setNewTplCustomSlots(prev => prev.filter(s => s.id !== cs.id))}
                      className="text-[10px] text-purple-400 hover:text-red-400 ml-0.5">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="text" value={customSlotInput} onChange={e => setCustomSlotInput(e.target.value)}
                  placeholder="自定义时间段（如：早班、夜班）"
                  className="flex-1 px-2 py-1.5 text-xs border border-purple-200 rounded-lg outline-none focus:ring-2 focus:ring-warm-400"
                  onKeyDown={e => { if (e.key === 'Enter' && customSlotInput.trim()) {
                    setNewTplCustomSlots(prev => [...prev, { id: 'custom_' + Date.now(), label: customSlotInput.trim() }]);
                    setCustomSlotInput('');
                  }}} />
                <button onClick={() => {
                  if (customSlotInput.trim()) {
                    setNewTplCustomSlots(prev => [...prev, { id: 'custom_' + Date.now(), label: customSlotInput.trim() }]);
                    setCustomSlotInput('');
                  }
                }}
                  className="px-2.5 py-1.5 text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors whitespace-nowrap">
                  ＋ 添加
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={newTplNotes} onChange={e => setNewTplNotes(e.target.checked)}
                  className="w-3.5 h-3.5 text-warm-600 focus:ring-warm-500" />
                <span className="text-sm text-warm-700">有备注行</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={newTplWeather} onChange={e => setNewTplWeather(e.target.checked)}
                  className="w-3.5 h-3.5 text-warm-600 focus:ring-warm-500" />
                <span className="text-sm text-warm-700">有天气提醒</span>
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowNewTemplateForm(false)}
                className="px-4 py-2 border border-warm-200 rounded-lg text-sm text-warm-600 hover:bg-warm-50">取消</button>
              <button onClick={async () => {
                if (!newTplName.trim() || (newTplSlots.length === 0 && newTplCustomSlots.length === 0)) return;
                const slotMap: Record<string, string> = { morning: '上午', afternoon: '下午', evening: '晚上' };
                const timeSlots = [
                  ...newTplSlots.map(s => ({ label: slotMap[s], slotId: s })),
                  ...newTplCustomSlots.map(cs => ({ label: cs.label, slotId: cs.id })),
                ];
                await templateStore.addTemplate({
                  name: newTplName.trim(),
                  description: newTplDesc || timeSlots.map(s => s.label).join('+'),
                  timeSlots,
                  weekdays: 7,
                  hasNotes: newTplNotes,
                  hasWeather: newTplWeather,
                });
                setNewTplName('');
                setNewTplDesc('');
                setNewTplSlots(['morning', 'afternoon']);
                setNewTplCustomSlots([]);
                setCustomSlotInput('');
                setNewTplNotes(true);
                setNewTplWeather(true);
                setShowNewTemplateForm(false);
              }}
                className="px-4 py-2 bg-warm-500 text-white rounded-lg text-sm hover:bg-warm-600">创建模板</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowNewTemplateForm(true)}
            className="mt-3 flex items-center gap-1.5 px-3 py-2 border border-dashed border-warm-300 rounded-lg text-sm text-warm-500 hover:bg-warm-50 transition-colors w-full justify-center">
            <Plus className="w-4 h-4" /> 新建自定义模板
          </button>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h2 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5" />
          隐私说明
        </h2>
        <p className="text-sm text-amber-700 leading-relaxed">
          所有数据仅存储于当前浏览器的 IndexedDB 和您指定的本地文件中，不上传任何服务器。
          应用完全离线可用。长者个人信息请在打印纸质件时妥善保管。
        </p>
      </div>

      {/* 数据持久化状态 */}
      <DataBackupStatus />

      {/* 云同步 */}
      <CloudSyncSection />

      {/* 账号管理 */}
      <AccountSection />

      {/* Data Management */}
      <div className="bg-white rounded-xl border border-warm-100 p-5">
        <h2 className="font-bold text-warm-800 mb-4">数据管理</h2>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-3 bg-warm-50 rounded-lg hover:bg-warm-100 transition-colors text-left"
          >
            <Download className="w-5 h-5 text-warm-500" />
            <div>
              <p className="text-sm font-medium text-warm-700">导出活动记录</p>
              <p className="text-xs text-warm-400">将所有活动记录导出为 Excel 文件</p>
            </div>
          </button>

          {cleanupCount > 0 && (
            <button
              onClick={() => setShowCleanup(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors text-left"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-700">清理过期记录 ({cleanupCount} 条)</p>
                <p className="text-xs text-amber-500">删除超过1年的活动记录以释放空间</p>
              </div>
            </button>
          )}

          <button
            onClick={handleClearAll}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-700">清空所有数据</p>
              <p className="text-xs text-red-400">此操作不可撤销，建议先导出备份</p>
            </div>
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl border border-warm-100 p-5">
        <h2 className="font-bold text-warm-800 mb-2">关于</h2>
        <p className="text-sm text-warm-500">
          悦活 - 养老院活动管理系统 v1.0
          {isElectron() ? ' 桌面版' : ' 网页版'}
        </p>
        <p className="text-xs text-warm-400 mt-1">
          {isElectron()
            ? '所有数据存储在电脑本地。完全离线使用，不上传任何服务器。'
            : '数据全部存储在本地浏览器中，不上传任何服务器。'}
        </p>
      </div>

      <ConfirmDialog
        open={showCleanup}
        title="清理过期记录"
        message={`确定要删除 ${cleanupCount} 条超过1年的记录吗？建议先导出备份。`}
        confirmText="清理"
        cancelText="先导出备份"
        onConfirm={handleCleanup}
        onCancel={() => setShowCleanup(false)}
        danger
      />
    </div>
  );
}

/** 数据持久化状态卡片 */
function DataBackupStatus() {
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [backupTime, setBackupTime] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      if (navigator.storage?.persisted) {
        setPersisted(await navigator.storage.persisted());
      }
    } catch {}
    const { getBackupTime } = await import('../persistence');
    const t = getBackupTime();
    setBackupTime(t ? t.toLocaleString('zh-CN') : '暂无备份');
  };

  const handleManualBackup = async () => {
    setSaving(true);
    const { backupToLocalStorage } = await import('../persistence');
    await backupToLocalStorage();
    setSaving(false);
    await checkStatus();
  };

  return (
    <div className="bg-white rounded-xl border border-warm-100 p-5">
      <h2 className="font-bold text-warm-800 mb-4 flex items-center gap-2">
        <Database className="w-5 h-5 text-warm-500" />
        数据持久化
      </h2>
      <div className="space-y-3 text-sm">
        {/* 持久存储状态 */}
        <div className="flex items-center justify-between py-2 px-3 bg-warm-50 rounded-lg">
          <span className="text-warm-600">浏览器持久存储</span>
          {persisted === null ? (
            <span className="text-warm-400">检测中...</span>
          ) : persisted ? (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              已启用
            </span>
          ) : (
            <span className="text-amber-600">未启用（数据可能被清除）</span>
          )}
        </div>

        {/* 自动备份到 localStorage */}
        <div className="flex items-center justify-between py-2 px-3 bg-warm-50 rounded-lg">
          <div>
            <span className="text-warm-600">localStorage 备份</span>
            <p className="text-xs text-warm-400 mt-0.5">上次备份: {backupTime}</p>
          </div>
          <button
            onClick={handleManualBackup}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-warm-500 text-white rounded-lg hover:bg-warm-600 disabled:opacity-50 text-xs font-medium transition-colors"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {saving ? '备份中...' : '手动备份'}
          </button>
        </div>

        <p className="text-xs text-warm-400 leading-relaxed">
          ⚡ 每次修改数据时会自动备份到 localStorage。如 IndexedDB 数据丢失，
          刷新页面后会自动从 localStorage 恢复数据。建议定期手动备份以防万一。
        </p>
      </div>
    </div>
  );
}

/** 云同步卡片 */
function CloudSyncSection() {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [connected, setConnected] = useState<boolean | null>(null);
  const { user, loading: authLoading, signOut } = useLazyAuth();

  useEffect(() => {
    import('../syncService').then(({ checkConnection }) => {
      checkConnection().then(setConnected);
    });
  }, []);

  const handleSync = async () => {
    if (!user) {
      setStatus('error');
      setMsg('请先登录后再同步');
      return;
    }
    setStatus('syncing');
    setMsg('正在同步...');
    try {
      const { syncAll } = await import('../syncService');
      const result = await syncAll((m) => setMsg(m));
      setStatus('success');
      setMsg(`同步完成！推送 ${result.pushed} 条，拉取 ${result.pulled} 条`);
    } catch (e: any) {
      setStatus('error');
      setMsg(`同步失败: ${e.message}`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setStatus('idle');
    setMsg('');
  };

  return (
    <div className="bg-white rounded-xl border border-warm-100 p-5 hidden">
      <h2 className="font-bold text-warm-800 mb-4 flex items-center gap-2">
        <Cloud className="w-5 h-5 text-warm-500" />
        云同步
      </h2>

      {/* 登录状态 */}
      <div className="flex items-center justify-between py-2 px-3 bg-warm-50 rounded-lg mb-3">
        <span className="text-sm text-warm-600">
          {authLoading ? '加载中...' : user ? user.email : '未登录'}
        </span>
        {authLoading ? (
          <Loader2 className="w-4 h-4 text-warm-400 animate-spin" />
        ) : user ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogIn className="w-3 h-3 rotate-180" />
            退出
          </button>
        ) : (
          <NavLink
            to="/auth"
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-warm-500 hover:bg-warm-100 rounded-lg transition-colors"
          >
            <LogIn className="w-3 h-3" />
            登录
          </NavLink>
        )}
      </div>

      {/* Supabase 连接状态 */}
      <div className="flex items-center justify-between py-2 px-3 bg-warm-50 rounded-lg mb-3">
        <span className="text-sm text-warm-600">Supabase 连接</span>
        {connected === null ? (
          <span className="text-xs text-warm-400">检测中...</span>
        ) : connected ? (
          <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            已连接
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-600 text-sm font-medium">
            <Link2Off className="w-4 h-4" />
            未连接
          </span>
        )}
      </div>

      {/* 同步按钮 & 状态 */}
      <button
        onClick={handleSync}
        disabled={status === 'syncing' || connected === false || !user}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left disabled:opacity-50"
        style={{
          backgroundColor: status === 'error' ? '#fef2f2' : status === 'success' ? '#f0fdf4' : '#fffbeb',
        }}
      >
        {status === 'syncing' ? (
          <Loader2 className="w-5 h-5 text-warm-500 animate-spin" />
        ) : (
          <Upload className="w-5 h-5 text-warm-500" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-warm-700">
            {status === 'syncing' ? '同步中...' : !user ? '请先登录' : '开始同步'}
          </p>
          <p className="text-xs text-warm-400 truncate">
            {msg || (connected === false
              ? 'Supabase 未连接'
              : !user
                ? '点击上方「登录」按钮注册/登录账号'
                : '将本地数据同步到你的个人云端空间')}
          </p>
        </div>
      </button>

      <p className="text-xs text-warm-400 mt-2 leading-relaxed">
        登录后数据将同步到你的账号，不同账号数据完全隔离。
        换设备只需登录同一账号即可恢复数据。
      </p>
    </div>
  );
}

/** 账号管理卡片 */
function AccountSection() {
  const { user, signOut, updateProfile, updatePassword } = useLazyAuth();
  const [editing, setEditing] = useState<'username' | 'password' | null>(null);
  const [username, setUsername] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (user?.user_metadata?.username) {
      setUsername(user.user_metadata.username);
    }
  }, [user]);

  const handleSaveUsername = async () => {
    if (!username.trim()) return;
    setLoading(true);
    const { error } = await updateProfile({ username: username.trim() });
    setLoading(false);
    if (error) {
      setMsgType('error');
      setMsg(error);
    } else {
      setMsgType('success');
      setMsg('用户名已更新');
      setEditing(null);
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleChangePassword = async () => {
    if (newPass !== confirmPass) {
      setMsgType('error');
      setMsg('两次密码不一致');
      return;
    }
    if (newPass.length < 6) {
      setMsgType('error');
      setMsg('密码至少 6 位');
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(newPass);
    setLoading(false);
    if (error) {
      setMsgType('error');
      setMsg(error);
    } else {
      setMsgType('success');
      setMsg('密码已更新');
      setEditing(null);
      setNewPass('');
      setConfirmPass('');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  if (!user) {
    return (
      <div className="bg-white rounded-xl border border-warm-100 p-5">
        <h2 className="font-bold text-warm-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-warm-500" />
          账号管理
        </h2>
        <div className="flex items-center gap-3 px-4 py-3 bg-warm-50 rounded-lg">
          <LogIn className="w-5 h-5 text-warm-400" />
          <p className="text-sm text-warm-600">
            登录后可管理账号信息
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-warm-100 p-5">
      <h2 className="font-bold text-warm-800 mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-warm-500" />
        账号管理
      </h2>

      {/* 邮箱（只读） */}
      <div className="flex items-center justify-between py-2 px-3 bg-warm-50 rounded-lg mb-2">
        <div>
          <p className="text-xs text-warm-400">邮箱</p>
          <p className="text-sm font-medium text-warm-700">{user.email}</p>
        </div>
        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">已验证</span>
      </div>

      {/* 用户名 */}
      <div className="py-2 px-3 bg-warm-50 rounded-lg mb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-warm-400">用户名</p>
            {editing === 'username' ? (
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full mt-1 px-2 py-1 border border-warm-200 rounded text-sm outline-none focus:ring-2 focus:ring-warm-400"
                autoFocus
              />
            ) : (
              <p className="text-sm font-medium text-warm-700">
                {user.user_metadata?.username || '未设置'}
              </p>
            )}
          </div>
          {editing === 'username' ? (
            <div className="flex gap-1">
              <button onClick={handleSaveUsername} disabled={loading}
                className="px-2.5 py-1 text-xs bg-warm-500 text-white rounded-lg hover:bg-warm-600 disabled:opacity-50">
                {loading ? '保存中...' : '保存'}
              </button>
              <button onClick={() => setEditing(null)}
                className="px-2.5 py-1 text-xs text-warm-500 hover:bg-warm-100 rounded-lg">取消</button>
            </div>
          ) : (
            <button onClick={() => setEditing('username')}
              className="text-xs text-warm-500 hover:text-warm-700">修改</button>
          )}
        </div>
      </div>

      {/* 修改密码 */}
      <div className="py-2 px-3 bg-warm-50 rounded-lg mb-2">
        {editing === 'password' ? (
          <div className="space-y-2">
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
              placeholder="新密码（至少6位）"
              className="w-full px-2 py-1.5 border border-warm-200 rounded text-sm outline-none focus:ring-2 focus:ring-warm-400" />
            <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
              placeholder="确认新密码"
              className="w-full px-2 py-1.5 border border-warm-200 rounded text-sm outline-none focus:ring-2 focus:ring-warm-400" />
            <div className="flex gap-2">
              <button onClick={handleChangePassword} disabled={loading}
                className="px-3 py-1.5 text-xs bg-warm-500 text-white rounded-lg hover:bg-warm-600 disabled:opacity-50">
                {loading ? '修改中...' : '确认修改'}
              </button>
              <button onClick={() => setEditing(null)}
                className="px-3 py-1.5 text-xs text-warm-500 hover:bg-warm-100 rounded-lg">取消</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-warm-400">密码</p>
              <p className="text-sm font-medium text-warm-700">••••••••</p>
            </div>
            <button onClick={() => setEditing('password')}
              className="text-xs text-warm-500 hover:text-warm-700">修改</button>
          </div>
        )}
      </div>

      {/* 提示消息 */}
      {msg && (
        <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs mt-2 ${
          msgType === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {msgType === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {msg}
        </div>
      )}
    </div>
  );
}
