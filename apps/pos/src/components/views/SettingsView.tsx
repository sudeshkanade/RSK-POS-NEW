'use client';
import React, { useState, useEffect } from 'react';
import { ThemeToggle } from '../common/ThemeToggle';

const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="glass-card border border-white/5 noise-bg rounded-xl overflow-hidden mb-10">
    <div className="flex items-center gap-4 px-10 py-6 border-b border-white/5 bg-white/[0.02]">
      <span className="text-2xl">{icon}</span>
      <span className="font-bold uppercase tracking-tight text-lg text-theme-primary">{title}</span>
    </div>
    <div className="p-10">{children}</div>
  </div>
);

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string }> = ({ label, value, onChange, type = 'text' }) => (
  <div className="mb-6 group">
    <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2 ml-2 group-focus-within:text-emerald-500 transition-colors">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold text-sm focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
    />
  </div>
);

export const SettingsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testPrinting, setTestPrinting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [printerIp, setPrinterIp] = useState('192.168.1.100:9100');
  const [paperWidth, setPaperWidth] = useState('80mm');
  const [terminalId, setTerminalId] = useState('POS-01');
  const [shiftStart, setShiftStart] = useState('10:00');
  const [gstRate, setGstRate] = useState('0');

  // Load settings on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setName(data.name || '');
          setAddress(data.address || '');
          setPhone(data.phone || '');
          setGstNo(data.gstNo || '');
          setPrinterIp(data.printerIp || '192.168.1.100:9100');
          setPaperWidth(data.paperWidth || '80mm');
          setTerminalId(data.terminalId || 'POS-01');
          setShiftStart(data.shiftStart || '10:00');
          setGstRate(String(data.gstRate ?? 0));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address, phone, gstNo, printerIp, paperWidth, terminalId, shiftStart, gstRate: parseFloat(gstRate) || 0 }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (e) {
      console.error('Failed to save settings', e);
    } finally {
      setSaving(false);
    }
  };

  const testPrint = async () => {
    setTestPrinting(true);
    setTestResult(null);
    try {
      const testText = `\n---TEST PRINT---\nTerminal: ${terminalId}\nPaper: ${paperWidth}\n${new Date().toLocaleString('en-IN')}\n---END TEST---\n`;
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText }),
      });
      const data = await res.json();
      setTestResult(data.success ? '✓ Print sent successfully' : `✗ ${data.error || 'Printer not reachable'}`);
    } catch (e) {
      setTestResult('✗ Network error — check printer IP');
    } finally {
      setTestPrinting(false);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Loading Config...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar pb-20 p-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <Section title="Restaurant Info" icon="🏪">
          <Field label="Restaurant Name" value={name} onChange={setName} />
          <Field label="Address" value={address} onChange={setAddress} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="GSTIN" value={gstNo} onChange={setGstNo} />
            <Field label="Phone" value={phone} onChange={setPhone} />
          </div>
          <Field label="GST Rate (%)" value={gstRate} onChange={setGstRate} type="number" />
        </Section>

        <Section title="Thermal Printer" icon="🖨️">
          <div className="mb-8">
            <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3 ml-2">Paper Width</label>
            <div className="flex gap-4 p-2 bg-theme-bg rounded-xl border border-theme-surface">
              {['58mm', '80mm'].map(w => (
                <button key={w} onClick={() => setPaperWidth(w)}
                  className={`flex-1 py-4 rounded-[1.5rem] font-bold text-[10px] uppercase tracking-widest transition-all ${paperWidth === w ? 'bg-emerald-500 text-black shadow-lg' : 'text-zinc-600 hover:text-zinc-300'}`}>
                  {w}
                </button>
              ))}
            </div>
          </div>
          <Field label="Printer IP / Port" value={printerIp} onChange={setPrinterIp} />
          <button
            onClick={testPrint}
            disabled={testPrinting}
            className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] border transition-all ${
              testResult?.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : testResult?.startsWith('✗') ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-black'
            }`}
          >
            {testPrinting ? 'Sending...' : testResult || 'Execute Test Print'}
          </button>
        </Section>

        <Section title="Terminal Control" icon="💻">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Terminal ID" value={terminalId} onChange={setTerminalId} />
            <Field label="Shift Start Time" value={shiftStart} onChange={setShiftStart} type="time" />
          </div>
          <div className="flex items-center justify-between p-6 rounded-2xl bg-theme-bg border border-theme-surface mt-4">
            <div>
              <p className="font-bold uppercase text-theme-primary tracking-tight">Interface Theme</p>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Light / Dark Mode Toggle</p>
            </div>
            <ThemeToggle />
          </div>
        </Section>

        <div className="flex flex-col justify-end pb-10">
          <button
            onClick={save}
            disabled={saving}
            className={`w-full py-8 rounded-xl font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-2xl ${
              saved ? 'bg-emerald-500 text-black'
              : saving ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {saved ? '✓ Settings Saved to Database' : saving ? 'Saving...' : 'COMMIT SETTINGS'}
          </button>
          <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest text-center mt-4">
            Settings are persisted to the database and apply immediately
          </p>
        </div>
      </div>
    </div>
  );
};
