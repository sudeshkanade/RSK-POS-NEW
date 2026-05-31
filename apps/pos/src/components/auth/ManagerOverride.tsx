'use client';

import React, { useState } from 'react';

interface ManagerOverrideProps {
  onSuccess: (approvedById: string) => void;
  onCancel: () => void;
  actionLabel: string;
}

export const ManagerOverride: React.FC<ManagerOverrideProps> = ({ onSuccess, onCancel, actionLabel }) => {
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDigit = (digit: string) => {
    setError(null);
    if (pin.length < 4) setPin(prev => prev + digit);
  };

  const handleVerify = async () => {
    if (pin.length !== 4) {
      setError('Enter 4-digit manager PIN');
      return;
    }
    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        const role = data.user.role as string;
        if (role === 'MANAGER' || role === 'ADMIN') {
          setTimeout(() => onSuccess(data.user.id), 300);
        } else {
          setError('Insufficient permission. Manager or Admin PIN required.');
          setPin('');
          setIsVerifying(false);
        }
      } else {
        setError(data.error || 'Invalid PIN. Try again.');
        setPin('');
        setIsVerifying(false);
      }
    } catch {
      setError('Connection error. Check server.');
      setPin('');
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xs p-10 rounded-sm bg-[#111] border border-zinc-800 shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-500 flex items-center justify-center rounded-2xl text-3xl mb-5 border border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.1)]">
          🔒
        </div>

        <h2 className="text-xl font-bold uppercase text-white tracking-tight mb-1">Manager Override</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6 text-center">
          Required for: <span className="text-zinc-300">{actionLabel}</span>
        </p>

        {/* PIN Dots */}
        <div className="flex gap-3 mb-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                pin.length > i ? 'bg-rose-500 border-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.5)]' : 'border-zinc-700'
              }`}
            >
              {pin.length > i && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
            </div>
          ))}
        </div>

        {error && <p className="text-rose-500 text-[10px] font-bold uppercase mb-3 animate-pulse text-center">{error}</p>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 w-full mb-4">
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button
              key={n}
              onClick={() => handleDigit(n.toString())}
              disabled={isVerifying}
              className="h-12 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 active:scale-95 text-lg font-bold text-white transition-all disabled:opacity-40"
            >
              {n}
            </button>
          ))}
          <button onClick={() => { setError(null); setPin(''); }} disabled={isVerifying}
            className="h-12 rounded-xl bg-zinc-800/60 hover:bg-rose-500/20 text-rose-400 font-bold transition-all disabled:opacity-40">
            C
          </button>
          <button onClick={() => handleDigit('0')} disabled={isVerifying}
            className="h-12 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 active:scale-95 text-lg font-bold text-white transition-all disabled:opacity-40">
            0
          </button>
          <button onClick={() => setPin(p => p.slice(0, -1))} disabled={isVerifying}
            className="h-12 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 font-bold transition-all disabled:opacity-40">
            ⌫
          </button>
        </div>

        <button
          onClick={handleVerify}
          disabled={isVerifying || pin.length !== 4}
          className="w-full py-3 rounded-sm font-bold uppercase tracking-widest text-xs transition-all bg-rose-500 text-white hover:scale-105 shadow-[0_10px_30px_rgba(244,63,94,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isVerifying ? 'Verifying...' : '✓ Authorize'}
        </button>

        <button
          onClick={onCancel}
          disabled={isVerifying}
          className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
