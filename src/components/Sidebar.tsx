'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  Inbox, 
  TerminalSquare, 
  Clock, 
  Settings,
  Cpu,
  LogOut
} from 'lucide-react';

import { logout } from '../app/actions';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/', label: 'System Overview', icon: Activity },
  { href: '/inbox', label: 'Task Inbox', icon: Inbox },
  { href: '/cron', label: 'Cron Monitor', icon: Clock },
  { href: '/logs', label: 'Live Feed', icon: TerminalSquare },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 border-r border-white/10 glass flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">OpenClaw</h1>
            <p className="text-xs text-white/50">Control Center</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between px-3 py-2 bg-black/20 rounded-lg border border-white/5 text-xs text-white/50">
          <span>Command Menu</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">K</kbd>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-3">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                active 
                  ? 'bg-primary/15 text-white border border-primary/20' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-primary' : ''}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10 flex flex-col gap-1">
        <Link 
          href="/settings" 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
            isActive('/settings') 
              ? 'bg-primary/15 text-white border border-primary/20' 
              : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
          }`}
        >
          <Settings className={`w-4 h-4 ${isActive('/settings') ? 'text-primary' : ''}`} />
          <span className="font-medium text-sm">Settings</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 mt-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
