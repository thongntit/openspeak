import { NavLink } from 'react-router-dom';
import { Home, Mic, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/cn';

const ICON_PROPS = { size: 22, strokeWidth: 1.8 };

const TABS = [
  { to: '/', label: 'Home', icon: <Home {...ICON_PROPS} />, end: true },
  { to: '/practice', label: 'Practice', icon: <Mic {...ICON_PROPS} /> },
  { to: '/progress', label: 'Progress', icon: <BarChart3 {...ICON_PROPS} /> },
  { to: '/profile', label: 'Profile', icon: <User {...ICON_PROPS} /> },
];

export default function TabBar() {
  return (
    <nav
      className={cn(
        'absolute left-3 right-3 bottom-3 h-16 z-30',
        'bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-[22px]',
        'grid grid-cols-4 backdrop-blur-md',
        'shadow-[0_8px_32px_rgba(15,22,32,0.08),0_2px_8px_rgba(15,22,32,0.04)]',
        'dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
      )}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={cn(
            'flex flex-col items-center justify-center gap-[3px]',
            'text-[11px] font-semibold cursor-pointer text-[var(--text-2)]',
            'aria-[current=page]:text-[var(--primary-hex)]',
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
