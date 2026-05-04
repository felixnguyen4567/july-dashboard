'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Terminal, Settings, Inbox, Activity, Clock, Play } from 'lucide-react';
import { triggerHeartbeat } from '../app/actions';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  const runCommand = (command: () => void) => {
    command();
    setOpen(false);
    setQuery('');
  };

  const actions = [
    { id: 'home', name: 'Go to System Overview', icon: Activity, onSelect: () => runCommand(() => router.push('/')) },
    { id: 'inbox', name: 'Go to Task Inbox', icon: Inbox, onSelect: () => runCommand(() => router.push('/inbox')) },
    { id: 'cron', name: 'Go to Cron Monitor', icon: Clock, onSelect: () => runCommand(() => router.push('/cron')) },
    { id: 'logs', name: 'Go to Live Feed Logs', icon: Terminal, onSelect: () => runCommand(() => router.push('/logs')) },
    { id: 'settings', name: 'Go to Configuration Settings', icon: Settings, onSelect: () => runCommand(() => router.push('/settings')) },
    { id: 'restart', name: 'Action: Restart OpenClaw Agent', icon: Play, onSelect: () => runCommand(async () => {
      await triggerHeartbeat();
    }) },
  ];

  const filteredActions = query === '' 
    ? actions 
    : actions.filter(action => action.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-xl bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-4 border-b border-white/10 bg-white/5">
          <Search className="w-5 h-5 text-white/40 mr-3" />
          <input
            type="text"
            className="flex-1 bg-transparent text-white outline-none placeholder:text-white/30 text-lg"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <kbd className="text-xs text-white/40 font-mono px-2 py-1 bg-black/40 rounded border border-white/10">ESC</kbd>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-sm text-white/50">No results found.</div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="px-3 py-2 text-xs font-semibold text-white/30 uppercase tracking-wider">Suggestions</div>
              {filteredActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.onSelect}
                    className="w-full flex items-center px-4 py-3 text-sm text-left text-white/80 hover:bg-primary/20 hover:text-white rounded-xl transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors border border-white/5 group-hover:border-primary/30">
                      <Icon className="w-4 h-4 text-white/50 group-hover:text-primary transition-colors" />
                    </div>
                    {action.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
