import { useState, useEffect } from 'react';
import { Download, Trash2, AlertTriangle, Database, Shield, HardDrive, Link2, Link2Off, CheckCircle2, Loader2 } from 'lucide-react';
import { getAll, clearStore } from '../db';
import { useActivityRecordStore } from '../store/activityRecordStore';
import { exportToExcel } from '../utils/helpers';
import ConfirmDialog from '../components/common/ConfirmDialog';
import type { ActivityRecord } from '../types';
import { useFileStore, pickFileLocation, disconnectFile } from '../fileStore';

export default function SettingsPage() {
  const { cleanupOldRecords } = useActivityRecordStore();
  const { fileHandle, syncStatus, lastSyncTime } = useFileStore();
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
      老人ID: r.elderlyId,
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

  const handleClearAll = async () => {
    if (!confirm('确定要清空所有数据吗？此操作不可撤销！')) return;
    await clearStore('activityRecords');
    await clearStore('weeklyPlans');
    await clearStore('weeklyPlanCells');
    await clearStore('elderly');
    await clearStore('elderlyGroups');
    await clearStore('activities');
    setMessage('已清空所有数据');
    setTimeout(() => setMessage(''), 3000);
    loadStats();
  };

  return (
    <div className="max-w-2xl space-y-6">
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

      {/* File Storage */}
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

      {/* Privacy Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h2 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5" />
          隐私说明
        </h2>
        <p className="text-sm text-amber-700 leading-relaxed">
          所有数据仅存储于当前浏览器的 IndexedDB 和您指定的本地文件中，不上传任何服务器。
          应用完全离线可用。老人个人信息请在打印纸质件时妥善保管。
        </p>
      </div>

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
        </p>
        <p className="text-xs text-warm-400 mt-1">
          数据全部存储在本地浏览器中，不上传任何服务器。
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
