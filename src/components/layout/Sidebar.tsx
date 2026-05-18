import { NavLink } from 'react-router-dom';
import { CalendarDays, Library, Users, Settings } from 'lucide-react';

const navItems = [
  { to: '/', label: '周计划', icon: CalendarDays },
  { to: '/activities', label: '活动库', icon: Library },
  { to: '/elderly', label: '老人管理', icon: Users },
  { to: '/settings', label: '设置', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-warm-100 shrink-0 hidden md:flex flex-col">
      <div className="h-14 flex items-center px-5 border-b border-warm-100">
        <span className="text-lg font-bold text-warm-700">🏡 颐活</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-warm-100 text-warm-700 font-medium'
                  : 'text-warm-600 hover:bg-warm-50 hover:text-warm-700'
              }`
            }
            end={to === '/'}
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-warm-100">
        <p className="text-xs text-warm-400">颐活 v1.0</p>
        <p className="text-xs text-warm-300">数据仅存于本地</p>
      </div>
    </aside>
  );
}
