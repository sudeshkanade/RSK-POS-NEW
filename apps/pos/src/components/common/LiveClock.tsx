'use client';
import React, { useState, useEffect } from 'react';

export const LiveClock: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const date = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });

  return (
    <div className="text-right select-none">
      <div className="text-2xl font-bold tracking-tighter leading-none tabular-nums">{time}</div>
      <div style={{ color: 'var(--text-secondary)' }} className="text-[10px] font-bold uppercase tracking-widest mt-0.5">{date}</div>
    </div>
  );
};
