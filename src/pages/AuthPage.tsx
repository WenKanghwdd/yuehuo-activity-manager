import { useState } from 'react';
import { useAuth } from '../supabaseAuth';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthPage() {
  const { signIn, signUp, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const action = mode === 'login' ? signIn : signUp;
    const { error: err } = await action(email, password);

    if (err) {
      // 对中文用户友好的错误提示
      if (err.includes('Invalid login credentials')) {
        setError('邮箱或密码错误');
      } else if (err.includes('Email not confirmed')) {
        setError('邮箱未验证，请查收验证邮件');
      } else if (err.includes('User already registered')) {
        setError('该邮箱已注册，请直接登录');
      } else if (err.includes('Password should be at least 6 characters')) {
        setError('密码至少 6 位');
      } else {
        setError(err);
      }
    } else if (mode === 'signup') {
      setSuccess('注册成功！请查收验证邮件，然后登录');
      setMode('login');
    }
    setLoading(false);
  };

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white rounded-xl border border-warm-100 p-8 max-w-sm w-full mx-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-lg font-bold text-warm-800 mb-1">已登录</h2>
          <p className="text-sm text-warm-500 mb-4 break-all">{user.email}</p>
          <p className="text-xs text-warm-400">返回设置页即可使用云同步</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-xl border border-warm-100 p-8 max-w-sm w-full mx-4 shadow-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src="./logo.svg" alt="悦活" className="h-10 w-auto mx-auto" />
          <h1 className="text-xl font-bold text-warm-800 mt-3">
            {mode === 'login' ? '登录' : '注册'}
          </h1>
          <p className="text-sm text-warm-400 mt-1">
            悦活账号用于云端数据同步
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* 成功提示 */}
        {success && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <p className="text-xs text-green-600">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 邮箱 */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">邮箱</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-9 pr-3 py-2.5 border border-warm-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-warm-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位"
                required
                minLength={6}
                className="w-full pl-9 pr-3 py-2.5 border border-warm-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-warm-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7B68EE 0%, #E6A8D7 100%)' }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : mode === 'login' ? (
              '登录'
            ) : (
              '注册'
            )}
          </button>
        </form>

        {/* 切换登录/注册 */}
        <div className="text-center mt-4">
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
            className="text-sm text-warm-500 hover:text-warm-700 transition-colors"
          >
            {mode === 'login' ? '没有账号？点击注册' : '已有账号？点击登录'}
          </button>
        </div>

        <p className="text-xs text-warm-400 text-center mt-4 leading-relaxed">
          登录后数据将同步到你的个人云端空间。<br />
          不同账号之间数据完全隔离。
        </p>
      </div>
    </div>
  );
}
