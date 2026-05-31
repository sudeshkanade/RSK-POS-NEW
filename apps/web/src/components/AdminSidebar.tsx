'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Control Center', href: '/admin/dashboard', icon: '📊' },
  { name: 'Inventory', href: '/admin/inventory', icon: '📦' },
  { name: 'Reports', href: '/admin/reports', icon: '📈' },
  { name: 'Menu Editor', href: '/admin/menu', icon: '🍴' },
  { name: 'Staff Management', href: '/admin/staff', icon: '👥' },
  { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-80 h-screen bg-black border-r border-white/5 flex flex-col p-10 fixed left-0 top-0 z-50">
      <div className="mb-20">
        <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">
          Restro<span className="text-emerald-500">OS</span>
        </h1>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] mt-2">RSK Solutions</p>
      </div>

      <nav className="flex-1 space-y-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-6 px-8 py-5 rounded-[2rem] transition-all group ${
                isActive 
                  ? 'bg-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.2)]' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-10 border-t border-white/5">
        <button className="flex items-center gap-6 px-8 py-5 text-zinc-500 hover:text-rose-500 transition-colors w-full">
          <span className="text-xl">🚪</span>
          <span className="text-xs font-black uppercase tracking-widest">Logout</span>
        </button>
      </div>
    </aside>
  );
};
