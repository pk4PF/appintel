'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    {
      href: '/dashboard',
      label: 'Gaps',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      href: '/saved',
      label: 'Saved',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )
    }
  ];

  return (
    <aside className="w-64 bg-[#121212] border-r border-white/5 flex flex-col sticky top-0 h-screen shrink-0">
      {/* Logo */}
      <div className="p-8">
        <Link href="/dashboard" className="flex items-center gap-3 group active:scale-95 transition-transform">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#8b5cf6]/20 group-hover:scale-110 transition-transform">
            <span className="text-xl">🚀</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tighter leading-tight">App Gap</h1>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group active:scale-[0.98] ${isActive
                    ? 'bg-white/5 text-white border border-white/10 shadow-2xl shadow-black'
                    : 'text-[#86868b] hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className={isActive ? 'text-[#a78bfa]' : 'group-hover:text-[#a78bfa] transition-colors duration-300'}>
                    {item.icon}
                  </div>
                  <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign Out */}
      <div className="px-4 pb-2">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[#86868b] hover:text-[#ff453a] hover:bg-[#ff453a]/10 transition-all duration-300 group active:scale-[0.98]"
        >
          <div className="group-hover:text-[#ff453a] transition-colors duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <span className="font-bold text-xs uppercase tracking-widest">Sign Out</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-6 pt-2">
        <div className="px-5 py-5 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#8b5cf6]/10 blur-2xl pointer-events-none" />
          <p className="text-[10px] text-[#86868b] font-black uppercase tracking-widest mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse" />
            <p className="text-xs text-white font-bold uppercase tracking-tighter">Live Market Data</p>
          </div>
          <p className="text-[9px] text-[#48484a] mt-3 font-bold uppercase tracking-widest">Updated hourly</p>
        </div>
      </div>
    </aside>
  );
}
