'use client';

import React, { useEffect, useState } from 'react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      const dark = saved !== 'light';
      setIsDark(dark);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, []);

  const toggle = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    const val = newDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', val);
    try { localStorage.setItem('theme', val); } catch { /* ignore */ }
  };

  return (
    <button
      onClick={toggle}
      style={{ backgroundColor: 'rgba(0,0,0,0.08)', border: '2px solid var(--surface-border)', color: 'var(--text-primary)' }}
      className="w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-sm"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light Mode' : 'Dark Mode'}
    >
      {isDark ? (
        // Sun icon
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="5" strokeWidth={2} />
          <path strokeLinecap="round" strokeWidth={2} d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        // Moon icon
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
};
