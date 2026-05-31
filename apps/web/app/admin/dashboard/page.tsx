'use client';

import React from 'react';
import { StarsAndDogsMatrix } from '../../../src/components/analytics/StarsAndDogsMatrix';
import { PeakHourHeatmap } from '../../../src/components/analytics/PeakHourHeatmap';

export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-black p-12 font-sans">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-end mb-20">
          <div>
            <h1 className="text-8xl font-black italic tracking-tighter text-white uppercase leading-none">
              Control Center
            </h1>
            <div className="flex items-center gap-6 mt-6">
              <span className="h-1 w-24 bg-rose-500" />
              <p className="text-zinc-500 font-black uppercase tracking-[0.5em] text-sm">
                Profit-Guard Analytics Engine
              </p>
            </div>
          </div>

          <div className="flex gap-8">
            <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-white/5 backdrop-blur-xl">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Net Profit</span>
              <span className="text-4xl font-black italic text-emerald-500">$12,450.00</span>
            </div>
            <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-white/5 backdrop-blur-xl">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Avg Prep Time</span>
              <span className="text-4xl font-black italic text-rose-500">18.5 min</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          <div className="space-y-12">
            <StarsAndDogsMatrix />
            <div className="bg-zinc-950 p-10 rounded-[3rem] border border-white/5 shadow-2xl">
              <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.4em] mb-6">Price Alerts</h2>
              <div className="space-y-4">
                {[
                  { item: 'Cooking Oil', change: '+12.5%', type: 'CRITICAL' },
                  { item: 'Chicken Breast', change: '+5.2%', type: 'WARNING' },
                ].map((alert) => (
                  <div key={alert.item} className="flex justify-between items-center p-6 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-sm font-bold text-white uppercase tracking-widest">{alert.item}</span>
                    <span className={`text-xs font-black px-4 py-1 rounded-full ${
                      alert.type === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'
                    }`}>
                      {alert.change} FLUCTUATION
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <PeakHourHeatmap />
            <div className="bg-zinc-950 p-10 rounded-[3rem] border border-white/5 shadow-2xl h-[450px]">
               <h2 className="text-sm font-black text-sky-500 uppercase tracking-[0.4em] mb-8">Unified Order Inbox</h2>
               <div className="space-y-4 overflow-y-auto max-h-[300px] pr-4 custom-scrollbar">
                  {[
                    { id: '#1204', origin: 'SWIGGY', status: 'PREPARING', time: '2 min ago' },
                    { id: '#1205', origin: 'ZOMATO', status: 'PENDING', time: 'Just now' },
                    { id: '#1203', origin: 'DINE_IN', status: 'BILLING', time: '15 min ago' },
                    { id: '#1206', origin: 'TAKEAWAY', status: 'READY', time: '1 min ago' },
                  ].map((order) => (
                    <div key={order.id} className="flex justify-between items-center p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-md ${
                          order.origin === 'SWIGGY' ? 'bg-orange-500 text-white' :
                          order.origin === 'ZOMATO' ? 'bg-rose-600 text-white' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {order.origin}
                        </span>
                        <span className="text-lg font-black italic text-white">{order.id}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">{order.status}</span>
                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{order.time}</span>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
