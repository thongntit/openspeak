import { Outlet, useLocation } from 'react-router-dom';
import TabBar from './TabBar';
import { cn } from '@/lib/cn';

export default function AppShell() {
  const { pathname } = useLocation();
  const isReview = pathname === '/review';

  return (
    <div className="min-h-screen flex justify-center md:items-center md:py-6">
      <div
        className={[
          'relative flex flex-col w-full max-w-md',
          'h-screen md:h-[874px] md:max-h-[calc(100vh-3rem)]',
          'bg-[var(--bg-app)] text-[var(--text-1)] overflow-hidden',
          'md:rounded-[28px] md:shadow-2xl md:border md:border-[var(--border-soft)]',
          '[transform:translateZ(0)]',
        ].join(' ')}
      >
        <main
          className={cn(
            'flex-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            isReview ? 'overflow-hidden flex flex-col' : 'overflow-y-auto pb-24',
          )}
        >
          <Outlet />
        </main>
        {!isReview && <TabBar />}
      </div>
    </div>
  );
}
