import React from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-900 h-screen sticky top-0 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-emerald-500 text-black flex items-center justify-center rounded-xl font-black italic text-xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">R</div>
            <div>
              <h1 className="font-black italic tracking-tighter uppercase text-lg leading-none">RestroOS</h1>
              <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-600 mt-1">Admin Panel</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {['Overview', 'Sales', 'Menu Engineering', 'Staff Audit', 'Settings'].map(item => (
              <a key={item} href="#" className={`block px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${item === 'Overview' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}>
                {item}
              </a>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800" />
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-200">Owner User</p>
                <p className="text-[8px] font-bold uppercase text-zinc-600">Restaurant ID: 001</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
