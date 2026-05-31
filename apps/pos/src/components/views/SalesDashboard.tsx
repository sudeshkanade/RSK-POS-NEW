'use client';
import React, { useState, useEffect } from 'react';
import { usePOSStore } from '../../store/posStore';

const Stat: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div style={{ border: '2px solid var(--surface-border)', backgroundColor: 'rgba(0,0,0,0.04)' }} className="p-6 rounded-2xl">
    <p style={{ color: 'var(--text-secondary)' }} className="text-[10px] font-bold uppercase tracking-widest mb-2">{label}</p>
    <p style={{ color: color || 'var(--text-primary)' }} className="text-3xl font-bold tracking-tighter">{value}</p>
  </div>
);

export const SalesDashboard: React.FC = () => {
  // Use targeted selectors — avoid subscribing to the whole orders/tables object
  // which would cause a re-render on every item added anywhere in the app.
  const occupied = usePOSStore(s =>
    s.tables.filter(t => t.status !== 'VACANT' && t.status !== 'SETTLED').length
  );
  const tableCount = usePOSStore(s => s.tables.length);
  const liveUnsettledRevenue = usePOSStore(s =>
    Object.values(s.orders).reduce((sum, o) =>
      sum + o.items.filter(i => !i.isVoided).reduce((sv, i) => sv + i.price * i.qty, 0), 0
    )
  );

  const [report, setReport] = useState<{
    revenue: number;
    covers: number;
    hourly: { h: string; rev: number }[];
    topItems: { name: string; qty: number; revenue: number }[];
  } | null>(null);

  useEffect(() => {
    fetch('/api/reports/sales')
      .then(r => r.json())
      .then(data => { if (!data.error) setReport(data); })
      .catch(e => console.error(e));
  }, []);

  if (!report) return <div className="p-10 text-center font-bold" style={{ color: 'var(--text-secondary)' }}>Loading Dashboard...</div>;

  const totalRev = report.revenue + liveUnsettledRevenue;
  const maxHourlyRev = Math.max(...report.hourly.map(h => h.rev), 100); // ensure no div by zero

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pb-20">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Stat label="Today's Revenue (Incl. Open)" value={`₹${totalRev.toLocaleString('en-IN')}`} color="#10b981" />
        <Stat label="Covers Served" value={report.covers.toString()} />
        <Stat label="Active Tables" value={`${occupied} / ${tableCount}`} color="#f59e0b" />
        <Stat label="Avg. Spend / Cover" value={report.covers > 0 ? `₹${Math.round(totalRev / report.covers)}` : '₹0'} />
      </div>

      {/* Hourly Bar Chart */}
      <div style={{ border: '2px solid var(--surface-border)' }} className="rounded-2xl p-6 mb-8">
        <p className="font-bold uppercase tracking-widest text-xs mb-6" style={{ color: 'var(--text-secondary)' }}>Hourly Revenue</p>
        <div className="flex items-end gap-2 h-32">
          {report.hourly.map(h => (
            <div key={h.h} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-lg transition-all"
                style={{ height: `${(h.rev / maxHourlyRev) * 100}%`, backgroundColor: h.rev === maxHourlyRev && h.rev > 0 ? '#10b981' : 'rgba(16,185,129,0.3)' }}
              />
              <span style={{ color: 'var(--text-secondary)' }} className="text-[8px] font-bold">{h.h}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Items */}
      <div style={{ border: '2px solid var(--surface-border)' }} className="rounded-2xl overflow-hidden">
        <div style={{ borderBottom: '2px solid var(--surface-border)', backgroundColor: 'rgba(0,0,0,0.06)' }} className="grid grid-cols-3 px-6 py-3">
          {['Item', 'Qty Sold', 'Revenue'].map(h => (
            <span key={h} style={{ color: 'var(--text-secondary)' }} className="text-[10px] font-bold uppercase tracking-widest">{h}</span>
          ))}
        </div>
        {report.topItems.map((item, i) => (
          <div key={item.name} style={{ borderBottom: i < report.topItems.length - 1 ? '1px solid var(--surface-border)' : 'none' }}
            className="grid grid-cols-3 px-6 py-4 items-center">
            <span className="font-bold text-sm">{item.name}</span>
            <span className="font-bold text-sm text-emerald-400">{item.qty}</span>
            <span className="font-bold text-sm">₹{item.revenue.toLocaleString('en-IN')}</span>
          </div>
        ))}
        {report.topItems.length === 0 && (
          <div className="p-8 text-center text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>No items sold today yet.</div>
        )}
      </div>
    </div>
  );
};
