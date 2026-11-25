'use client';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/components/providers/AuthProvider';
import { redirect } from 'next/navigation';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--cf-bg)]">Loading...</div>;
  }
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[var(--cf-bg)] text-[var(--cf-text)] flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <header className="h-16 border-b border-[var(--cf-border)] flex items-center justify-end px-6 sticky top-0 bg-[var(--cf-bg)]/80 backdrop-blur-md z-10">
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
