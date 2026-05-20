import { useState, useEffect } from 'react';
import { Key, Copy, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

interface ActivationState {
  activated: boolean;
  machineCode: string | null;
  verifying: boolean;
  error: string;
  success: string;
}

export default function ActivationDialog() {
  const [state, setState] = useState<ActivationState>({
    activated: false,
    machineCode: null,
    verifying: false,
    error: '',
    success: '',
  });
  const [userCode, setUserCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkActivation();
  }, []);

  const api = (window as any).electronAPI;

  const checkActivation = async () => {
    if (!api?.activation) return;
    const result = await api.activation.check();
    if (result.activated) {
      setState(prev => ({ ...prev, activated: true }));
      return;
    }
    // 获取机器码
    const mc = await api.activation.getMachineCode();
    setState(prev => ({ ...prev, machineCode: mc.machineCode }));
  };

  const handleActivate = async () => {
    if (!userCode.trim()) return;
    setState(prev => ({ ...prev, verifying: true, error: '', success: '' }));
    
    const result = await api.activation.activate(userCode.trim());
    
    if (result.ok) {
      setState(prev => ({ ...prev, verifying: false, success: result.message }));
      setTimeout(() => {
        setState(prev => ({ ...prev, activated: true }));
      }, 1500);
    } else {
      setState(prev => ({ ...prev, verifying: false, error: result.message }));
    }
  };

  const handleCopy = () => {
    if (state.machineCode) {
      navigator.clipboard.writeText(state.machineCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 已激活 → 不显示
  if (state.activated) return null;

  // 非 Electron 环境（网页版）→ 不显示
  if (!api?.activation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-center">
          <Shield className="w-10 h-10 text-white mx-auto mb-2" />
          <h2 className="text-lg font-bold text-white">悦活 - 软件激活</h2>
          <p className="text-sm text-amber-50 mt-1">输入激活码以解锁全部功能</p>
        </div>

        <div className="p-6 space-y-4">
          {/* 机器码 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              本机机器码（请复制后发送给管理员）
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 truncate select-all">
                {state.machineCode || '正在获取...'}
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 px-3 py-2.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                title="复制机器码"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 激活码输入 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              激活码
            </label>
            <input
              type="text"
              value={userCode}
              onChange={e => setUserCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleActivate()}
              placeholder="请输入管理员提供的激活码"
              maxLength={16}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono tracking-widest text-center outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              autoFocus
            />
          </div>

          {/* 错误 / 成功提示 */}
          {state.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {state.success}
            </div>
          )}

          {/* 激活按钮 */}
          <button
            onClick={handleActivate}
            disabled={!userCode.trim() || state.verifying}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-lg font-medium text-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state.verifying ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                验证中...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                激活
              </span>
            )}
          </button>

          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            每台电脑需要独立的激活码。<br />
            请联系管理员：发送「机器码」获取「激活码」
          </p>
        </div>
      </div>
    </div>
  );
}
