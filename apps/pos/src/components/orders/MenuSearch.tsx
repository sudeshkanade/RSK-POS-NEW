'use client';

import React, { useState, useRef, useEffect } from 'react';

interface MenuItem {
  id: string;
  name: string;
  shortcutKey: string | null;
  price: number;
}

interface MenuSearchProps {
  items: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  autoFocus?: boolean;
}

export const MenuSearch: React.FC<MenuSearchProps> = ({ items, onItemSelect, autoFocus }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Trigger focus when autoFocus goes true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = query.trim()
    ? items.filter(
        i =>
          i.name.toLowerCase().includes(query.toLowerCase()) ||
          (i.shortcutKey && i.shortcutKey.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const select = (item: MenuItem) => {
    onItemSelect(item);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = query.trim().toLowerCase();
      if (!trimmed) return;

      // 1. Try to match exact shortcut key
      const exactMatch = items.find(
        i => i.shortcutKey && i.shortcutKey.toLowerCase() === trimmed
      );
      if (exactMatch) {
        select(exactMatch);
        e.preventDefault();
        return;
      }

      // 2. Fallback: Select the first filtered option
      if (filtered.length > 0) {
        select(filtered[0]);
        e.preventDefault();
      }
    }
  };

  return (
    <div className="relative w-full" ref={wrapRef}>
      {/* Input */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(e.target.value.trim().length > 0); }}
          onKeyDown={handleKeyDown}
          placeholder="Search item or shortcut (B1, F2...)"
          className="block w-full pl-16 pr-6 py-5 rounded-2xl font-bold text-sm bg-zinc-950/50 border border-white/5 text-white focus:outline-none focus:border-emerald-500/30 transition-all placeholder:text-zinc-700 placeholder:uppercase placeholder:tracking-widest placeholder:text-[10px]"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-3 rounded-3xl bg-zinc-900/90 backdrop-blur-xl border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden z-[500]">
          {filtered.length > 0 ? (
            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
              {filtered.map(item => (
                <button
                  key={item.id}
                  onClick={() => select(item)}
                  className="w-full flex justify-between items-center px-8 py-5 text-white hover:bg-emerald-500/10 hover:text-emerald-400 border-b border-white/5 transition-all last:border-0 group"
                >
                  <div className="flex items-center gap-4">
                    {item.shortcutKey && (
                      <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-zinc-800 text-zinc-500 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                        {item.shortcutKey}
                      </span>
                    )}
                    <span className="font-bold text-sm tracking-tight">{item.name}</span>
                  </div>
                  <span className="font-bold text-sm italic">₹{item.price}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-8 py-10 text-center">
              <p className="text-zinc-600 font-bold uppercase tracking-[0.3em] text-[10px]">No items matching "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
