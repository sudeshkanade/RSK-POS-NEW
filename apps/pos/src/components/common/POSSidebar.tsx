'use client';

import React, { useState } from 'react';
import { usePOSStore } from '../../store/posStore';

type TabId = 'floor' | 'inventory' | 'sales' | 'menu' | 'staff' | 'settings';

const NAV_ITEMS: { name: string; id: TabId; icon: string; roles: string[] }[] = [
  { name: 'Floor',      id: 'floor',     icon: '📍', roles: ['ADMIN', 'MANAGER', 'STAFF', 'CASHIER'] },
  { name: 'Menu',       id: 'menu',      icon: '🍴', roles: ['ADMIN', 'MANAGER'] },
  { name: 'Inventory',  id: 'inventory', icon: '📦', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { name: 'Analytics',  id: 'sales',     icon: '📊', roles: ['ADMIN', 'MANAGER'] },
  { name: 'Control',    id: 'staff',     icon: '🛡️', roles: ['ADMIN'] },
  { name: 'Settings',   id: 'settings',  icon: '⚙️', roles: ['ADMIN'] },
];

interface POSSidebarProps {
  activeTab: string;
  onTabChange: (id: TabId) => void;
}

export const POSSidebar: React.FC<POSSidebarProps> = ({ activeTab, onTabChange }) => {
  const { activeUser, logout } = usePOSStore();
  const filteredNav = NAV_ITEMS; // ALL tabs available for all roles

  return (
    <>
      {/* ── Desktop Vertical Sidebar ── */}
      <aside className="hidden md:flex h-full w-24 shrink-0 bg-zinc-950/80 border-r border-theme-surface backdrop-blur-3xl z-[100] flex-col items-center py-10 noise-bg">
        {/* Brand Logo */}
        <div className="w-14 h-14 bg-emerald-500 text-black flex items-center justify-center rounded-2xl text-2xl font-bold mb-12 shadow-[0_0_30px_rgba(16,185,129,0.3)] shrink-0 cursor-pointer hover:rotate-6 transition-transform">
          R
        </div>

        <nav className="flex-1 w-full flex flex-col items-center gap-6 overflow-y-auto custom-scrollbar px-2">
          {filteredNav.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all relative group ${
                  isActive
                    ? 'bg-emerald-500 text-black shadow-[0_20px_40px_rgba(16,185,129,0.4)] scale-110'
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <div className="absolute -left-3 w-2 h-10 bg-emerald-500 rounded-full shadow-[0_0_15px_#10b981]" />
                )}
                <span className="text-2xl transition-transform group-hover:scale-110 group-active:scale-90">{item.icon}</span>
                <span className="text-[7px] font-bold uppercase tracking-widest leading-none">{item.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="mt-auto flex flex-col items-center gap-6 pt-6 border-t border-white/5 w-full">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 font-bold text-xs shadow-inner">
            {activeUser?.name?.charAt(0) || '?'}
          </div>
          <button onClick={logout}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all group">
            <svg className="w-6 h-6 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Mobile/Tablet Bottom Navigation Bar ── */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/95 border-t border-theme-surface backdrop-blur-3xl z-[100] justify-around items-center px-4 noise-bg">
        {filteredNav.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-all ${
                isActive ? 'text-emerald-500 scale-105' : 'text-zinc-500'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[8px] font-bold uppercase tracking-wider scale-90 leading-none">{item.name.split(' ')[0]}</span>
            </button>
          );
        })}
        <button onClick={logout}
          className="h-full flex items-center justify-center px-3 text-zinc-600 hover:text-rose-500 transition-colors">
          <span className="text-lg">🚪</span>
        </button>
      </nav>
    </>
  );
};
