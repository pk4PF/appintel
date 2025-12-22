'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      href: '/search',
      label: 'Search',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      href: '/saved',
      label: 'Saved Apps',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )
    }
  ];

  return (
    <aside className="w-64 bg-black border-r border-white/10 flex flex-col sticky top-0 h-screen shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center shadow-lg">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">App Intel</h1>
            <p className="text-xs text-[#86868b]">Market Intelligence</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                      ? 'bg-white/10 text-white shadow-xl translate-y-[-1px]'
                      : 'text-[#86868b] hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className={isActive ? 'text-[#007AFF]' : 'group-hover:text-[#007AFF]'}>
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="px-4 py-3 rounded-xl bg-[#1d1d1f]">
          <p className="text-xs text-[#86868b] mb-2">Powered by</p>
          <p className="text-sm text-white font-medium">iOS App Store Data</p>
          <p className="text-xs text-[#6e6e73] mt-1">Updated daily</p>
        </div>
      </div>
    </aside>
  );
}
