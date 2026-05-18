import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { readExcelFile } from '../../utils/helpers';
import { useElderlyStore } from '../../store/elderlyStore';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { groups, importElderly } = useElderlyStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [groupName, setGroupName] = useState(groups[0]?.name || '默认分组');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnMapping, setColumnMapping] = useState<{ name: string; room: string }>({
    name: '',
    room: '',
  });

  const handleFile = useCallback(async (f: File) => {
    setError(null);
    setPreview(null);
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      setError('请选择 .xlsx 或 .xls 格式的Excel文件');
      return;
    }
    setFile(f);
    try {
      const data = await readExcelFile(f);
      if (data.length === 0) {
        setError('Excel文件为空');
        return;
      }
      setPreview(data.slice(0, 5)); // Show first 5 rows as preview

      // Auto-detect columns
      const headers = Object.keys(data[0]);
      const nameKey = headers.find(
        (k) => k.includes('姓名') || k.toLowerCase().includes('name')
      );
      const roomKey = headers.find(
        (k) => k.includes('房间') || k.includes('房号') || k.toLowerCase().includes('room')
      );

      setColumnMapping({
        name: nameKey || headers[0] || '',
        room: roomKey || '',
      });
    } catch (err) {
      setError('文件读取失败，请确认格式正确');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleImport = async () => {
    if (!file || !preview) return;
    if (!columnMapping.name) {
      setError('请选择包含"老人姓名"的列');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fullData = await readExcelFile(file);
      await importElderly(fullData, groupName);
      setLoading(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-warm-100">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-warm-600" size={22} />
            <h2 className="text-xl font-bold text-gray-800">导入Excel名单</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
              ${dragOver ? 'border-warm-500 bg-warm-50' : 'border-gray-300 hover:border-warm-400 hover:bg-warm-50'}`}
          >
            <Upload className="mx-auto mb-3 text-warm-500" size={36} />
            <p className="text-gray-600 mb-1">
              {file ? file.name : '点击或拖拽文件到此处'}
            </p>
            <p className="text-sm text-gray-400">支持 .xlsx / .xls 格式</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {/* Column mapping */}
          {preview && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">列映射</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">老人姓名列</label>
                  <select
                    value={columnMapping.name}
                    onChange={(e) => setColumnMapping((m) => ({ ...m, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-warm-500 focus:ring-1 focus:ring-warm-500"
                  >
                    <option value="">请选择</option>
                    {Object.keys(preview[0] || {}).map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">房间号列（可选）</label>
                  <select
                    value={columnMapping.room}
                    onChange={(e) => setColumnMapping((m) => ({ ...m, room: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-warm-500 focus:ring-1 focus:ring-warm-500"
                  >
                    <option value="">请选择</option>
                    {Object.keys(preview[0] || {}).map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview table */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">预览（前5行）</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(preview[0] || {}).map((k) => (
                          <th key={k} className="px-3 py-2 text-left text-gray-600 font-medium whitespace-nowrap">
                            {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                              {String(val || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Group select */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">分配到组</label>
                <select
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-warm-500 focus:ring-1 focus:ring-warm-500"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                  <option value="__new__">+ 新建分组...（在页面中创建）</option>
                </select>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
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
            onClick={handleImport}
            disabled={!file || !preview || loading}
            className="px-6 py-2 bg-warm-600 text-white rounded-lg hover:bg-warm-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                导入中...
              </>
            ) : (
              '导入'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
