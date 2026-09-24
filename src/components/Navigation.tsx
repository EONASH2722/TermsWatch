import { Clock3, FileSearch, ScanText, Settings, MessageCircle } from 'lucide-react';

export type NavKey = 'scan' | 'document' | 'ask' | 'history' | 'settings';

const items = [
  { id: 'scan' as const, label: 'Home', icon: ScanText },
  { id: 'document' as const, label: 'Document', icon: FileSearch },
  { id: 'ask' as const, label: 'Ask', icon: MessageCircle },
  { id: 'history' as const, label: 'History', icon: Clock3 },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
];

interface NavigationProps {
  active: NavKey;
  onChange: (key: NavKey) => void;
}

export function Navigation({ active, onChange }: NavigationProps) {
  return (
    <nav aria-label="Main navigation" className="grid grid-cols-5 border-b border-line/70 px-2">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
          className={`group relative flex min-w-0 flex-col items-center gap-1.5 px-1 py-3 text-[10px] font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan ${
            active === id ? 'text-cyan' : 'text-muted hover:text-slate-200'
          }`}
        >
          <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
          <span className="truncate">{label}</span>
          <span
            className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-cyan transition-opacity ${
              active === id ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </button>
      ))}
    </nav>
  );
}
