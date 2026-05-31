'use client';

import React from 'react';

const mockRecipes = [
  { id: '1', itemName: 'Paneer Tikka', totalTheoreticalCost: 45.00, price: 250.00, margin: '82%', items: ['Paneer (200g)', 'Spices (10g)', 'Oil (15ml)'] },
  { id: '2', itemName: 'Butter Chicken', totalTheoreticalCost: 120.00, price: 450.00, margin: '73%', items: ['Chicken (300g)', 'Butter (50g)', 'Cream (30ml)'] },
  { id: '3', itemName: 'Garlic Naan', totalTheoreticalCost: 8.50, price: 60.00, margin: '85%', items: ['Flour (150g)', 'Garlic (5g)', 'Butter (10g)'] },
];

export default function RecipeManagement() {
  return (
    <main className="min-h-screen bg-black p-12 font-sans">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-20">
          <h1 className="text-8xl font-black italic tracking-tighter text-white uppercase leading-none">
            Recipe Engine
          </h1>
          <div className="flex items-center gap-6 mt-6">
            <span className="h-1 w-24 bg-emerald-500" />
            <p className="text-zinc-500 font-black uppercase tracking-[0.5em] text-sm">
              Theoretical vs Actual Costing
            </p>
          </div>
        </div>

        <div className="grid gap-8">
          {mockRecipes.map((recipe) => (
            <div key={recipe.id} className="bg-zinc-950 p-10 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
              <div className="flex-1">
                <h2 className="text-sm font-black text-emerald-500 uppercase tracking-[0.4em] mb-4">Item Snapshot</h2>
                <h3 className="text-5xl font-black italic tracking-tight uppercase text-white mb-6">{recipe.itemName}</h3>
                <div className="flex flex-wrap gap-3">
                  {recipe.items.map((item) => (
                    <span key={item} className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold text-zinc-500 uppercase tracking-widest border border-white/5">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-12 text-right">
                <div>
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Theoretical Cost</span>
                  <span className="text-4xl font-black italic text-zinc-400">₹{recipe.totalTheoreticalCost.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Menu Price</span>
                  <span className="text-4xl font-black italic text-white">₹{recipe.price.toFixed(2)}</span>
                </div>
                <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Gross Margin</span>
                  <span className="text-4xl font-black italic text-emerald-500">{recipe.margin}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="mt-12 px-12 py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)]">
          Create New Recipe
        </button>
      </div>
    </main>
  );
}
