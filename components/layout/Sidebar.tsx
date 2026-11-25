'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Zap, LayoutDashboard, Film, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isLocalDevMode } from '@/lib/runtime';

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  
  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clips', label: 'Clip History', icon: Film },
    { href: '/account', label: 'Account', icon: User },
  ].filter((link) => !isLocalDevMode || link.href === '/dashboard');

  return (
    <div className="w-64 h-screen fixed top-0 left-0 border-r border-[var(--cf-border)] bg-[var(--cf-surface)] p-4 flex flex-col">
      <Link href="/" className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6EE7B7] to-[#34D399] flex items-center justify-center">
          <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-lg text-[var(--cf-text)]">ClipForge</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors', active ? 'bg-[var(--cf-accent)]/10 text-[var(--cf-accent)] font-medium' : 'text-[var(--cf-muted)] hover:bg-white/5 hover:text-[var(--cf-text)]')}>
              <link.icon className="w-4 h-4" /> {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-[var(--cf-border)]">
        <div className="px-3 mb-2">
          <p className="text-sm font-medium text-[var(--cf-text)] truncate">{profile?.displayName || 'User'}</p>
          <p className="text-xs text-[var(--cf-muted)] capitalize">{isLocalDevMode ? 'Local mode' : 'Workspace'}</p>
        </div>
        {!isLocalDevMode && (
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--cf-muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
