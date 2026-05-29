import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Calendar, Library, Users, Settings, Menu, X, LogIn, User, Loader2, ClipboardList } from 'lucide-react';
import { useLazyAuth } from '../../hooks/useLazyAuth';

const navItems = [
  { path: '/', label: '活动计划', icon: Calendar },
  { path: '/activities', label: '活动库', icon: Library },
  { path: '/elderly', label: '长者管理', icon: Users },
  { path: '/schedule', label: '员工排班', icon: ClipboardList },
  { path: '/settings', label: '设置', icon: Settings },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading: authLoading } = useLazyAuth();

  return (
    <>
      {/* Top Navigation Bar — fixed at top */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'linear-gradient(135deg, #7B68EE 0%, #E6A8D7 100%)', height: 'calc(56px + env(safe-area-inset-top, 0px))' }} className="no-print safe-area-top flex items-center shadow-md px-4 lg:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <img src="./logo.svg" alt="悦活" className="h-8 w-auto brightness-0 invert" />
          <span className="text-base font-bold text-white hidden sm:inline tracking-wide">悦活</span>
        </div>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1 ml-8 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-lg text-base font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden rounded-lg p-1.5 text-white/60 hover:bg-white/10 ml-auto transition-colors"
          aria-label="切换菜单"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Login / User button */}
        <div className="ml-auto flex items-center">
          {authLoading ? (
            <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
          ) : user ? (
            <NavLink
              to="/auth"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline max-w-[100px] truncate">{user.user_metadata?.username || user.email}</span>
            </NavLink>
          ) : (
            <NavLink
              to="/auth"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">登录</span>
            </NavLink>
          )}
        </div>
      </header>

      {/* Mobile overlay + dropdown */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="fixed z-40 shadow-xl md:hidden" style={{top: 'calc(56px + env(safe-area-inset-top, 0px))', left: 0, right: 0, background: 'linear-gradient(180deg, #7B68EE 0%, #E6A8D7 100%)' }}>
            <nav className="flex flex-col p-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3.5 rounded-lg text-base font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
              {/* Mobile login button */}
              <NavLink
                to="/auth"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3.5 rounded-lg text-base font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {user ? <User className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                {user ? user.user_metadata?.username || user.email?.split('@')[0] || '已登录' : '登录'}
              </NavLink>
            </nav>
          </div>
        </>
      )}

      {/* Page content — offset for fixed header */}
      <main className="min-h-screen bg-gradient-to-b from-purple-50 to-warm-50 px-4 sm:px-6 lg:px-8 pb-4 print:p-0 print:bg-white" style={{paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))'}}>
        <Outlet />
      </main>
    </>
  );
}
