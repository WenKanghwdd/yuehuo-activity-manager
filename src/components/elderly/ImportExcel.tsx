import { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { readExcelFile } from '../../utils/helpers';
import { useElderlyStore } from '../../store/elderlyStore';

interface ImportExcelProps {
  onClose: () => void;
}

export default function ImportExcel({ onClose }: ImportExcelProps) {
  const { groups, addGroup, importElderly } = useElderlyStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [groupName, setGroupName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [status, setStatus] = useState<'idle' | 'preview' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setStatus('error');
      setMessage('请选择 .xlsx 或 .xls 文件');
      return;
    }

    try {
      const data = await readExcelFile(file);
      if (data.length === 0) {
        setStatus('error');
        setMessage('文件中没有数据');
        return;
      }
      setPreview(data.slice(0, 5));
      setStatus('preview');

      // Auto-detect name column
      const nameKey = Object.keys(data[0]).find(
        (k) => k.includes('姓名') || k.toLowerCase().includes('name')
      );
      if (!nameKey) {
        setStatus('error');
        setMessage('未找到"姓名"列，请确认Excel包含该列。当前列名：' + Object.keys(data[0]).join(', '));
        return;
      }
    } catch (err) {
      setStatus('error');
      setMessage('读取文件失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0) return;
    const name = groupName || newGroupName || '导入名单';
    try {
      const allData = await new Promise<Record<string, string>[]>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const data = await readExcelFile(new File([e.target?.result as Blob], ''));
          resolve(data);
        };
        reader.readAsArrayBuffer(fileRef.current?.files?.[0] as Blob);
      });
      await importElderly(allData, name);
      setStatus('success');
      setMessage(`成功导入 ${allData.length} 位老人到 "${name}" 分组`);
    } catch (err) {
      setStatus('error');
      setMessage('导入失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-warm-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-300 transition-colors"
      >
        <Upload className="w-12 h-12 text-warm-300 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-1">点击选择 Excel 文件</p>
        <p className="text-xs text-gray-400">支持 .xlsx / .xls 格式</p>
        <p className="text-xs text-gray-400 mt-1">要求包含"姓名"列（可选"房间号"列）</p>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {status === 'error' && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{message}</p>
        </div>
      )}

      {preview && (
        <>
          {/* Group selection */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">归属分组</label>
            <select
              value={groupName}
              onChange={(e) => { setGroupName(e.target.value); setNewGroupName(''); }}
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm mb-2"
            >
              <option value="">选择已有分组...</option>
              {groups.map((g) => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="或输入新的分组名称..."
              value={newGroupName}
              onChange={(e) => { setNewGroupName(e.target.value); setGroupName(''); }}
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm"
            />
          </div>

          {/* Preview */}
          <div>
            <p className="text-sm text-gray-600 mb-2">数据预览（前5行）</p>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    {Object.keys(preview[0]).map((key) => (
                      <th key={key} className="px-2 py-1 text-left text-gray-600 font-medium border-b">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-2 py-1 text-gray-700">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
            <button onClick={handleImport} className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              确认导入
            </button>
          </div>
        </>
      )}

      <a
        href="data:text/csv;charset=utf-8,%E5%A7%93%E5%90%8D,%E6%88%BF%E9%97%B4%E5%8F%B7%0A%E8%80%81%E4%BA%BA1,101%0A%E8%80%81%E4%BA%BA2,102"
        download="模板.csv"
        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors w-full"
      >
        <Download className="w-4 h-4" />
        下载模板（CSV）
      </a>
    </div>
  );
}
