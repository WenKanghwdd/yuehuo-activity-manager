import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Calendar, Library, Users, Settings, Menu, X } from 'lucide-react';

const navItems = [
  { path: '/', label: '周计划表', icon: Calendar },
  { path: '/activities', label: '活动库', icon: Library },
  { path: '/elderly', label: '老人管理', icon: Users },
  { path: '/settings', label: '设置', icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-warm-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`no-print
          fixed inset-y-0 left-0 z-30 flex w-56 flex-col bg-gradient-to-b from-red-700 to-red-900 text-white
          transition-transform duration-300 lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo area */}
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/30 text-amber-200 text-xl font-bold">
            颐
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-amber-100">颐活</h1>
            <p className="text-xs text-amber-300/70">活动管理平台</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="mt-2 flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-400/20 text-amber-200 shadow-sm'
                    : 'text-red-100/80 hover:bg-red-800/50 hover:text-amber-200'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-amber-800/30 px-5 py-3 text-xs text-amber-300/50">
          颐活 v1.0 · 本地数据
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar (mobile) */}
        <header className="no-print flex h-14 items-center gap-3 border-b border-warm-200 bg-white px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1.5 text-warm-600 hover:bg-warm-100"
            aria-label="切换菜单"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <span className="text-lg font-bold text-warm-700">颐活</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
