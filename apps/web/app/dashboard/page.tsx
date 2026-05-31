'use client';

import React from 'react';

const StatCard = ({ label, value, trend, color }: any) => (
  <div className="p-8 rounded-[2.5rem] bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl group hover:border-zinc-700 transition-all">
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">{label}</p>
    <div className="flex items-baseline gap-3">
      <h3 className="text-4xl font-black italic tracking-tighter text-white">{value}</h3>
      <span className={`text-[10px] font-black uppercase ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </span>
    </div>
    <div className="mt-6 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
      <div className={`h-full bg-${color}-500 transition-all duration-1000`} style={{ width: '65%', backgroundColor: color }} />
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div className="space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter uppercase text-white leading-none">Live Overview</h2>
          <div className="flex items-center gap-3 mt-3">
            <span className="w-8 h-0.5 bg-emerald-500" />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500">Real-time performance metrics</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">Today</button>
          <button className="px-6 py-3 rounded-xl bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.2)]">Export Report</button>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-6">
        <StatCard label="Total Revenue" value="₹42,850" trend={12.4} color="#10b981" />
        <StatCard label="Order Count" value="156" trend={8.2} color="#0ea5e9" />
        <StatCard label="Avg Ticket" value="₹274" trend={-2.1} color="#f59e0b" />
        <StatCard label="Void Rate" value="1.2%" trend={-4.5} color="#f43f5e" />
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Sales Chart Mock */}
        <div className="col-span-2 p-10 rounded-[3rem] bg-zinc-900/50 border border-zinc-800">
          <div className="flex justify-between items-center mb-10">
            <h4 className="text-xl font-black italic uppercase tracking-tight text-white">Hourly Sales Distribution</h4>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 <span className="text-[9px] font-bold uppercase text-zinc-500">Today</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-zinc-700" />
                 <span className="text-[9px] font-bold uppercase text-zinc-500">Yesterday</span>
               </div>
            </div>
          </div>
          
          <div className="h-64 w-full flex items-end gap-2 px-2">
            {[30, 45, 25, 60, 80, 55, 90, 70, 40, 50, 35, 65].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3">
                <div 
                  className="w-full bg-emerald-500/10 border-t-2 border-emerald-500/40 rounded-t-lg transition-all duration-1000" 
                  style={{ height: `${h}%` }} 
                />
                <span className="text-[8px] font-bold text-zinc-700">{i + 10}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Categories */}
        <div className="p-10 rounded-[3rem] bg-zinc-900/50 border border-zinc-800 flex flex-col">
          <h4 className="text-xl font-black italic uppercase tracking-tight text-white mb-10">Product Mix</h4>
          <div className="space-y-6 flex-1">
            {[
              { name: 'Beverages', val: 45, color: '#10b981' },
              { name: 'Main Course', val: 35, color: '#0ea5e9' },
              { name: 'Starters', val: 15, color: '#f59e0b' },
              { name: 'Desserts', val: 5, color: '#f43f5e' },
            ].map(cat => (
              <div key={cat.name} className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-zinc-400">{cat.name}</span>
                  <span className="text-white">{cat.val}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-1000" style={{ width: `${cat.val}%`, backgroundColor: cat.color }} />
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-all">Full Product Audit</button>
        </div>
      </div>
      
      {/* Live Activity Audit */}
      <div className="p-10 rounded-[3rem] bg-zinc-900/50 border border-zinc-800">
        <h4 className="text-xl font-black italic uppercase tracking-tight text-white mb-8">Recent Operations Audit</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-zinc-800">
                <th className="pb-5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600">Timestamp</th>
                <th className="pb-5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600">Action</th>
                <th className="pb-5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600">Terminal</th>
                <th className="pb-5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600">User</th>
                <th className="pb-5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {[
                { time: '12:45 PM', action: 'ITEM VOID', terminal: 'T-01', user: 'Admin (Manager)', details: 'Voided Chicken Curry (Wrong Order)', color: 'rose' },
                { time: '12:42 PM', action: 'ORDER SETTLED', terminal: 'T-02', user: 'Cashier 1', details: '₹1,250 - CASH', color: 'emerald' },
                { time: '12:35 PM', action: 'BILL PRINTED', terminal: 'T-01', user: 'Captain Raj', details: 'Table 4 - ₹850', color: 'sky' },
                { time: '12:30 PM', action: 'MANAGER OVERRIDE', terminal: 'T-01', user: 'Admin (Manager)', details: 'Bio Verified - Price Change', color: 'purple' },
              ].map((log, i) => (
                <tr key={i} className="group hover:bg-white/[0.02] transition-all">
                  <td className="py-5 text-xs font-bold text-zinc-500">{log.time}</td>
                  <td className="py-5">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-${log.color}-500/10 text-${log.color}-500 border border-${log.color}-500/20`}
                      style={{ backgroundColor: `var(--${log.color}-500-10)`, color: `var(--${log.color}-500)`, borderColor: `var(--${log.color}-500-20)` }}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-5 text-xs font-black text-zinc-300">{log.terminal}</td>
                  <td className="py-5 text-xs font-bold text-zinc-400">{log.user}</td>
                  <td className="py-5 text-xs font-bold text-zinc-500 text-right italic">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
