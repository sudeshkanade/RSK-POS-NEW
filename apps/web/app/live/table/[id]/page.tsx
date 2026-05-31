'use client';

import React from 'react';
import { useParams } from 'next/navigation';

const mockOrder = {
  id: '#1204',
  table: 'Table 4',
  status: 'PREPARING',
  items: [
    { name: 'Paneer Tikka', qty: 1, price: 250, status: 'SERVED' },
    { name: 'Butter Chicken', qty: 1, price: 450, status: 'PREPARING' },
    { name: 'Garlic Naan', qty: 2, price: 120, status: 'PENDING' },
  ],
  total: 820
};

export default function LiveTab() {
  const params = useParams();
  const tableId = params.id;

  return (
    <main className="min-h-screen bg-black p-6 font-sans text-white">
      <div className="max-w-md mx-auto">
        <header className="mb-12 text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">Live Tab</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2">
            RestroOS / {mockOrder.table}
          </p>
        </header>

        <section className="bg-zinc-900/50 rounded-[2.5rem] border border-white/5 p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Order {mockOrder.id}</span>
            <span className="px-3 py-1 bg-emerald-500 text-black text-[8px] font-black rounded-full uppercase tracking-widest animate-pulse">
              {mockOrder.status}
            </span>
          </div>

          <div className="space-y-6">
            {mockOrder.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-white">{item.name}</h4>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                    Qty: {item.qty} • {item.status}
                  </p>
                </div>
                <span className="text-sm font-black italic">₹{item.price}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Total Amount</span>
            <span className="text-2xl font-black italic text-white">₹{mockOrder.total}</span>
          </div>
        </section>

        <button className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-105 transition-all">
          Request Service
        </button>

        <p className="text-center text-[8px] font-bold text-zinc-600 uppercase tracking-[0.3em] mt-8">
          Powered by RestroOS / RSK Solutions
        </p>
      </div>
    </main>
  );
}
