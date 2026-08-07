import { Outlet, useLocation } from 'react-router-dom';
import TabBar from './TabBar';

export default function AppShell() {
  const { pathname } = useLocation();
  const isReview = pathname === '/review';

  return (
    <div className="flex min-h-dvh flex-col items-center bg-[var(--bg-app)] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] md:justify-center md:bg-transparent md:py-6">
      <div
        className={[
          'relative flex min-h-0 w-full max-w-md flex-1 flex-col',
          'md:h-[874px] md:max-h-[calc(100dvh-3rem)] md:flex-none',
          'bg-[var(--bg-app)] text-[var(--text-1)] overflow-hidden',
          'md:rounded-[28px] md:shadow-2xl md:border md:border-[var(--border-soft)]',
          '[transform:translateZ(0)]',
        ].join(' ')}
      >
        <main className={`flex-1 overflow-y-auto ${isReview ? 'pb-4' : 'pb-24'} [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
          <Outlet />
        </main>
        {!isReview && <TabBar />}
      </div>
    </div>
  );
}
