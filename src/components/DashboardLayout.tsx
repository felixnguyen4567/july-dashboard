'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <Toaster theme="dark" position="bottom-right" richColors />
      <CommandPalette />
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
