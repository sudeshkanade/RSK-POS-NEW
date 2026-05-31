'use client';
import React, { useState, useEffect } from 'react';

interface LicenseGuardProps {
  children: React.ReactNode;
}

export const LicenseGuard: React.FC<LicenseGuardProps> = ({ children }) => {
  // Start as TRIAL — never block the UI on startup.
  // The check runs in background and only kicks in if explicitly EXPIRED.
  const [status, setStatus] = useState<'ACTIVE' | 'TRIAL' | 'EXPIRED'>('TRIAL');
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [hardwareId, setHardwareId] = useState('FETCHING...');
  const [activationKey, setActivationKey] = useState('');
  const [error, setError] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    // Only the primary terminal (localhost) needs to verify the license.
    // Mobile/LAN clients are secondary — the server already holds the license.
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return; // Skip check entirely for mobile/LAN clients
      }
    }

    fetch('/api/license')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'EXPIRED') {
          setStatus('EXPIRED');
          setHardwareId(data.hardwareId || 'UNKNOWN');
        } else if (data.status === 'ACTIVE') {
          setStatus('ACTIVE');
          setDaysRemaining(data.daysRemaining || 0);
        }
        // TRIAL or anything else → keep as TRIAL (already the default)
      })
      .catch(() => {
        // Connection error → keep as TRIAL, never block
      });
  }, []);

  const handleActivate = async () => {
    setError('');
    setIsActivating(true);

    try {
      const res = await fetch('/api/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: activationKey.toUpperCase() })
      });
      const data = await res.json();

      if (data.success && data.status === 'ACTIVE') {
        setStatus('ACTIVE');
      } else {
        setError(data.error || 'Invalid Activation Key. Please check and try again.');
      }
    } catch (e) {
      setError('Connection error. Check your internet and try again.');
    }
    
    setIsActivating(false);
  };

  if (status === 'EXPIRED') {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div style={{ backgroundColor: 'var(--surface-color)', border: '2px solid var(--surface-border)' }} 
             className="w-full max-w-xl p-12 rounded-3xl shadow-2xl relative z-10 flex flex-col items-center text-center">
          
          <div className="w-20 h-20 bg-rose-500/10 text-rose-500 flex items-center justify-center rounded-2xl text-4xl mb-6 shadow-[0_0_40px_rgba(244,63,94,0.3)] border border-rose-500/20">
            🔒
          </div>
          
          <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2 text-white">License Expired</h1>
          <p className="text-zinc-400 font-bold text-sm mb-10">Your trial of RestroOS has ended. Please enter an activation key or contact support.</p>

          <div className="w-full relative mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 text-left">Activation Key</p>
            <input 
              type="text" 
              value={activationKey}
              onChange={e => setActivationKey(e.target.value.toUpperCase())}
              placeholder="RSK-XXXX-XXXX-XXXX"
              className="w-full bg-black/40 border-2 border-[var(--surface-border)] rounded-xl px-6 py-5 text-xl font-bold tracking-widest text-emerald-400 text-center placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {error && <p className="text-rose-500 font-bold text-xs mt-3">{error}</p>}
          </div>

          <button 
            onClick={handleActivate}
            disabled={isActivating || !activationKey}
            className={`w-full py-5 rounded-xl font-bold uppercase tracking-widest text-sm transition-all ${
              isActivating || !activationKey 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-emerald-500 text-black hover:scale-[1.02] shadow-[0_0_30px_rgba(16,185,129,0.3)]'
            }`}
          >
            {isActivating ? 'Verifying...' : 'Activate Terminal'}
          </button>
          
          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
              Hardware ID: {hardwareId}
            </p>
            <a href="mailto:support@rsk.solutions" className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hover:underline">
              Contact Support: support@rsk.solutions
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Trial banner removed - now handled within terminal header for better UI integration */}
      {children}
    </>
  );
};
