'use client';

import React, { useEffect, useState } from 'react';
import { usePOSStore } from '../../store/posStore';

const StatCard = ({ label, value, trend, color, loading }: { label: string; value: string; trend?: number; color: string; loading?: boolean }) => (
  <div className="p-8 rounded-xl glass-card group hover:border-emerald-500/30 transition-all premium-shadow">
    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-theme-secondary mb-4">{label}</p>
    <div className="flex items-baseline gap-3">
      {loading
        ? <div className="h-10 w-32 bg-zinc-800 rounded-xl animate-pulse" />
        : <h3 className="text-4xl font-bold tracking-tighter text-theme-primary">{value}</h3>
      }
      {trend !== undefined && !loading && (
        <span className={`text-[10px] font-bold uppercase ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="mt-6 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
      <div className="h-full transition-all duration-1000 rounded-full" style={{ width: loading ? '0%' : '65%', backgroundColor: color }} />
    </div>
  </div>
);

export const ManagementView: React.FC = () => {
  const { activeUser, tables, orders } = usePOSStore();
  const [report, setReport] = useState<{
    revenue: number; covers: number; orderCount: number;
    hourly: { h: string; rev: number }[];
    topItems: { name: string; qty: number; revenue: number }[];
  } | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const liveUnsettledRevenue = Object.values(orders).reduce((sum, o) =>
    sum + o.items.filter(i => !i.isVoided).reduce((s, i) => s + i.price * i.qty, 0), 0
  );

  useEffect(() => {
    Promise.all([
      fetch('/api/reports/sales').then(r => r.json()),
      fetch('/api/audit').then(r => r.json()),
      fetch('/api/inventory').then(r => r.json()),
    ]).then(([salesData, auditData, invData]) => {
      if (!salesData.error) setReport(salesData);
      if (Array.isArray(auditData)) setLogs(auditData);
      if (Array.isArray(invData)) setInventory(invData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const totalRevenue = (report?.revenue || 0) + liveUnsettledRevenue;
  const occupied = tables.filter(t => t.status !== 'VACANT' && t.status !== 'SETTLED').length;
  const maxHourly = Math.max(...(report?.hourly.map(h => h.rev) || [0]), 1);

  const lowStockItems = inventory.filter(i => i.isLowStock).slice(0, 5);
  const criticalItems = inventory.filter(i => i.stockLevel < i.minQty * 0.3).map(i => i.name);

  const downloadAuditReport = () => {
    const rows = ['Timestamp,Action,User,Details', ...logs.map(l =>
      `"${l.timestamp}","${l.action}","${l.user}","${l.details}"`
    )].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `audit-report-${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="p-10 space-y-10 overflow-y-auto h-full custom-scrollbar w-full">
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold rounded-md uppercase tracking-widest border border-emerald-500/20">Live Dashboard</span>
          </div>
          <h2 className="text-5xl font-bold tracking-tighter uppercase text-theme-primary leading-none">Analytics</h2>
          <div className="flex items-center gap-3 mt-3">
            <span className="w-8 h-0.5 bg-emerald-500" />
            <p style={{ color: 'var(--text-secondary)' }} className="text-[10px] font-bold uppercase tracking-[0.4em]">
              Welcome, {activeUser?.name} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </header>

      {/* KPI Cards — Live Data */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard label="Today's Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} color="#10b981" loading={loading} />
        <StatCard label="Orders Settled" value={`${report?.orderCount ?? '—'}`} color="#0ea5e9" loading={loading} />
        <StatCard
          label="Active Tables"
          value={`${occupied} / ${tables.length}`}
          color="#f59e0b"
          loading={false}
        />
        <StatCard
          label="Avg. Order Value"
          value={report && report.orderCount > 0 ? `₹${Math.round(totalRevenue / report.orderCount)}` : '₹0'}
          color="#f43f5e"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Revenue Heatmap — Live */}
        <div className="col-span-2 p-10 rounded-xl glass-card shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="text-8xl italic font-bold">LIVE</span>
          </div>
          <h4 className="text-xl font-bold uppercase tracking-tight text-theme-primary mb-10">Hourly Revenue</h4>
          {loading ? (
            <div className="h-64 flex items-end gap-2 px-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex-1 bg-zinc-800 rounded-t animate-pulse" style={{ height: `${30 + (i % 5) * 12}%` }} />
              ))}
            </div>
          ) : (
            <div className="h-64 w-full flex items-end gap-2 px-2 relative z-10">
              {(report?.hourly || []).map(h => (
                <div key={h.h} className="flex-1 flex flex-col items-center gap-3 group/bar">
                  <div
                    className="w-full rounded-t-lg transition-all duration-700 group-hover/bar:brightness-125"
                    style={{ height: `${Math.max(2, (h.rev / maxHourly) * 100)}%`, backgroundColor: h.rev === maxHourly && h.rev > 0 ? '#10b981' : 'rgba(16,185,129,0.25)' }}
                  />
                  <span style={{ color: 'var(--text-secondary)' }} className="text-[8px] font-bold">{h.h}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Health — Live */}
        <div className="p-10 rounded-xl glass-card flex flex-col shadow-2xl">
          <h4 className="text-xl font-bold uppercase tracking-tight text-theme-primary mb-10">Inventory Alerts</h4>
          <div className="space-y-4 flex-1">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-zinc-800 rounded-2xl animate-pulse" />
            )) : lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-10">
                <span className="text-4xl mb-3">✅</span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">All Stock Levels OK</p>
              </div>
            ) : lowStockItems.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-theme-bg/30 rounded-2xl border border-theme-surface hover:border-emerald-500/30 transition-colors">
                <div>
                  <p className="text-[10px] font-bold uppercase text-theme-primary">{item.name}</p>
                  <p className="text-[8px] font-bold text-zinc-600">Stock: {item.stockLevel} {item.unit}</p>
                </div>
                <span className={`text-[8px] font-bold uppercase tracking-widest ${item.stockLevel < item.minQty * 0.3 ? 'text-rose-500' : 'text-amber-500'}`}>
                  {item.stockLevel < item.minQty * 0.3 ? 'CRITICAL' : 'LOW'}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'inventory' }))}
            className="w-full mt-8 py-4 rounded-xl bg-zinc-900 text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-600 hover:text-white transition-all border border-white/5 hover:border-emerald-500/30"
          >
            Full Inventory Audit →
          </button>
        </div>
      </div>

      {/* Top Items */}
      <div className="p-10 rounded-xl glass-card shadow-2xl">
        <h4 className="text-xl font-bold uppercase tracking-tight text-theme-primary mb-8">Top Selling Items Today</h4>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-zinc-800 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {(report?.topItems || []).length === 0 ? (
              <div className="col-span-3 py-16 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-700">No sales recorded today yet</p>
              </div>
            ) : report?.topItems.map((item, i) => (
              <div key={item.name} className="glass-card p-6 rounded-2xl border border-theme-surface flex items-center gap-4">
                <span className="text-2xl font-bold text-zinc-700">#{i + 1}</span>
                <div className="flex-1">
                  <p className="font-bold text-theme-primary tracking-tight">{item.name}</p>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{item.qty} sold</p>
                </div>
                <span className="font-bold text-emerald-500">₹{item.revenue.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Audit Log */}
      <div className="p-10 rounded-xl glass-card shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-xl font-bold uppercase tracking-tight text-theme-primary">Live Audit Log</h4>
          <button
            onClick={downloadAuditReport}
            className="px-6 py-3 text-[8px] font-bold uppercase tracking-widest text-emerald-500 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 rounded-xl transition-all"
          >
            ↓ Download CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-white/5">
                <th className="pb-5 text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600">Timestamp</th>
                <th className="pb-5 text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600">Action</th>
                <th className="pb-5 text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600">Performed By</th>
                <th className="pb-5 text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-5 text-xs font-bold text-zinc-600 group-hover:text-zinc-400 transition-colors">{log.timestamp}</td>
                  <td className="py-5">
                    <span className={`px-2 py-1 rounded-lg text-[7px] font-bold uppercase tracking-wider ${
                      log.color === 'rose' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      : log.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-5 text-xs font-bold text-zinc-300">{log.user || 'System'}</td>
                  <td className="py-5 text-xs font-bold text-zinc-600 text-right italic">{log.details}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={4} className="py-20 text-center text-xs font-bold text-zinc-600 uppercase tracking-widest">No logs recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
