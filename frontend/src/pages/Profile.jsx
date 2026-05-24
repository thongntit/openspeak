import { useUser, useClerk } from '@clerk/clerk-react';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Bell,
  CreditCard,
  ChevronRight,
  Lock,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/lib/cn';

// TODO: backend — GET /me/stats should return { cardsReviewed, streak, retention }.
const STATS = [
  { value: '438', label: 'Cards' },
  { value: '12', label: 'Day streak' },
  { value: '87%', label: 'Retention' },
];

function initialsOf(user) {
  const first = user?.firstName?.[0] ?? '';
  const last = user?.lastName?.[0] ?? '';
  if (first || last) return `${first}${last}`.toUpperCase();
  const email = user?.primaryEmailAddress?.emailAddress;
  return email ? email.slice(0, 2).toUpperCase() : '?';
}

function ListRow({ icon, title, subtitle, right, danger, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors',
        'active:bg-black/[0.02] dark:active:bg-white/[0.03]',
        'border-b border-[var(--border-soft)] last:border-b-0',
        danger && 'text-[#e11d48]',
      )}
    >
      <span
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-[9px] bg-[var(--bg-app)]',
          danger ? 'text-[#e11d48]' : 'text-[var(--text-1)]',
        )}
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className={cn('block text-[15px] font-semibold', danger ? 'text-[#e11d48]' : 'text-[var(--text-1)]')}>
          {title}
        </span>
        {subtitle && (
          <span className="block text-xs text-[var(--text-2)]">{subtitle}</span>
        )}
      </span>
      {right ?? <ChevronRight size={16} className="text-[var(--text-2)]" />}
    </button>
  );
}

function Toggle({ on }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-block h-[26px] w-11 rounded-full transition-colors',
        on ? 'bg-[var(--primary-hex)]' : 'bg-[var(--border-soft)]',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-[22px] w-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-all',
          on ? 'left-5' : 'left-0.5',
        )}
      />
    </span>
  );
}

export default function Profile() {
  const { user } = useUser();
  const clerk = useClerk();
  const { isDark, toggleTheme } = useThemeStore();

  const name = user?.fullName || user?.firstName || user?.username || 'You';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  const openClerkProfile = () => clerk.openUserProfile();
  const handleSignOut = () => clerk.signOut();

  return (
    <div className="animate-screen-fade-in">
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--text-1)]">
          Profile
        </h1>
        <button
          type="button"
          onClick={openClerkProfile}
          aria-label="Account settings"
          className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-1)] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
        >
          <SettingsIcon size={18} />
        </button>
      </header>

      <div className="px-4 mb-[18px]">
        <Card className="flex items-center gap-3.5 p-[18px]">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#137fec] to-[#0a5fb5] text-[22px] font-extrabold tracking-tight text-white">
            {initialsOf(user)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[17px] font-bold tracking-snug text-[var(--text-1)] truncate">
              {name}
            </div>
            {email && (
              <div className="text-[13px] text-[var(--text-2)] mt-0.5 truncate">
                {email}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={openClerkProfile}>
            Edit
          </Button>
        </Card>
      </div>

      <div className="px-4 mb-[18px] grid grid-cols-3 gap-2">
        {STATS.map((s) => (
          <Card key={s.label} className="px-3.5 py-3.5 text-center">
            <div className="text-[22px] font-extrabold tracking-tight text-[var(--text-1)]">
              {s.value}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-eyebrow text-[var(--text-2)] mt-0.5">
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      <h2 className="px-5 mb-2.5 text-[12px] font-bold uppercase tracking-eyebrow text-[var(--text-2)]">
        Preferences
      </h2>
      <div className="px-4 mb-[18px]">
        <Card className="overflow-hidden">
          <ListRow
            icon={isDark ? <Moon size={18} /> : <Sun size={18} />}
            title="Appearance"
            subtitle={`${isDark ? 'Dark' : 'Light'} mode`}
            right={<Toggle on={isDark} />}
            onClick={toggleTheme}
          />
          <ListRow
            icon={<Bell size={18} />}
            title="Daily reminder"
            subtitle="9:00 AM"
            onClick={() => {}}
          />
          <ListRow
            icon={<CreditCard size={18} />}
            title="Daily new cards"
            subtitle="20 per day"
            onClick={() => {}}
          />
        </Card>
      </div>

      <h2 className="px-5 mb-2.5 text-[12px] font-bold uppercase tracking-eyebrow text-[var(--text-2)]">
        Account
      </h2>
      <div className="px-4 mb-[18px]">
        <Card className="overflow-hidden">
          <ListRow
            icon={<Lock size={18} />}
            title="Password & security"
            onClick={openClerkProfile}
          />
          <ListRow
            icon={<HelpCircle size={18} />}
            title="Help & support"
            onClick={() => {}}
          />
          <ListRow
            icon={<LogOut size={18} />}
            title="Sign out"
            danger
            right={<span />}
            onClick={handleSignOut}
          />
        </Card>
      </div>

      <div className="text-center text-[11px] text-[var(--text-2)] py-2 pb-4">
        OpenSpeak · v0.5.0
      </div>
    </div>
  );
}
