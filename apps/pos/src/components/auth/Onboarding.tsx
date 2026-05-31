'use client';
import React, { useState } from 'react';

interface OnboardingProps {
  onActivate: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onActivate }) => {
  const [key, setKey] = useState('');
  const [hardwareId, setHardwareId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    fetch('/api/license')
      .then(res => res.json())
      .then(data => {
        if (data.hardwareId) {
          setHardwareId(data.hardwareId);
        }
      })
      .catch(() => {});
  }, []);

  const activate = async (licenseKey: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: licenseKey }),
      });
      const data = await res.json();
      if (data.success && (data.status === 'ACTIVE' || data.status === 'TRIAL')) {
        onActivate();
      } else {
        setError(data.error || 'Activation failed. Please try again.');
      }
    } catch {
      setError('Connection error. Ensure the app server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateWithKey = async () => {
    if (!key || key.length < 8) {
      setError('Enter a valid license key (e.g. RSK-XXXX-XXXX-XXXX)');
      return;
    }
    await activate(key.trim().toUpperCase());
  };

  const handleStartTrial = async () => {
    // Start a trial by writing a trial marker to the license file via the API.
    // The license/route.ts GET handler automatically creates a trial file on first call.
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/license');
      const data = await res.json();
      if (data.status === 'TRIAL' || data.status === 'ACTIVE') {
        onActivate();
      } else if (data.status === 'EXPIRED') {
        setError('Your 30-day trial has expired. Please enter a license key to continue.');
        setLoading(false);
      } else {
        setError('Could not start trial. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Connection error. Check that the app is running correctly.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-black text-white p-6">
      <div className="w-full max-w-md p-10 rounded-sm bg-[#111] border border-zinc-800 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-emerald-500 rounded-sm flex items-center justify-center font-bold text-black text-4xl shadow-lg mb-6">R</div>
          <h1 className="text-3xl font-bold tracking-tighter uppercase text-center">Activate RestroOS</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Enterprise POS Terminal</p>
        </div>

        <div className="space-y-6">
          {/* License Key Input */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
              License Key
            </label>
            <input
              type="text"
              value={key}
              onChange={e => setKey(e.target.value.toUpperCase())}
              placeholder="RSK-XXXX-XXXX-XXXX"
              className="w-full bg-[#222] border-2 border-zinc-800 rounded-sm p-5 text-xl font-mono tracking-widest text-emerald-500 focus:outline-none focus:border-emerald-500 transition-all text-center"
            />
            {hardwareId && (
              <div className="flex justify-between items-center mt-3 px-1 text-[10px] font-bold tracking-wider text-zinc-500">
                <span className="uppercase">Your Hardware ID:</span>
                <span className="font-mono text-emerald-500 select-all cursor-pointer hover:underline" title="Click to copy or share">{hardwareId}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-sm">
              <p className="text-rose-500 text-xs font-bold text-center">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-4 mt-4">
            <button
              onClick={handleStartTrial}
              disabled={loading}
              className={`w-full py-3 rounded-sm font-bold uppercase tracking-widest text-sm transition-all border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black active:scale-[0.98] ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              🚀 Start 30-Day Free Trial
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-800/60" />
              <span className="flex-shrink mx-4 text-[9px] font-bold uppercase tracking-widest text-zinc-600">Or Activate Full License</span>
              <div className="flex-grow border-t border-zinc-800/60" />
            </div>

            <button
              onClick={handleActivateWithKey}
              disabled={loading || !key}
              className={`w-full py-3 rounded-sm font-bold uppercase tracking-widest text-sm transition-all shadow-lg ${
                loading || !key ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black active:scale-[0.98]'
              }`}
            >
              {loading ? 'Verifying...' : '✓ Activate Terminal'}
            </button>
          </div>

          <p className="text-center text-[10px] text-zinc-500 font-medium pt-4">
            Contact support@rsksolutions.com to purchase a license.
          </p>
        </div>
      </div>
    </div>
  );
};
