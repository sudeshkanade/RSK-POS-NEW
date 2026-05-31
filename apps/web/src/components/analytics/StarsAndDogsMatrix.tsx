'use client';

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const data = [
  { name: 'Paneer Tikka', popularity: 85, profitability: 70, type: 'STAR' },
  { name: 'Butter Chicken', popularity: 95, profitability: 65, type: 'STAR' },
  { name: 'Dal Tadka', popularity: 40, profitability: 30, type: 'DOG' },
  { name: 'Garlic Naan', popularity: 90, profitability: 20, type: 'PLOW_HORSE' },
  { name: 'Exotic Salad', popularity: 20, profitability: 90, type: 'PUZZLE' },
];

export const StarsAndDogsMatrix = () => {
  return (
    <div className="bg-zinc-950 p-10 rounded-[3rem] border border-white/5 shadow-2xl h-[600px] flex flex-col">
      <div className="mb-10">
        <h2 className="text-sm font-black text-emerald-500 uppercase tracking-[0.4em] mb-2">Menu Engineering</h2>
        <h3 className="text-4xl font-black italic tracking-tight uppercase text-white">Stars & Dogs Matrix</h3>
      </div>

      <div className="flex-1 relative">
        {/* Quadrant Labels */}
        <div className="absolute top-4 left-4 text-[10px] font-black text-emerald-500/50 uppercase tracking-widest">Puzzles (High Margin, Low Pop)</div>
        <div className="absolute top-4 right-4 text-[10px] font-black text-emerald-500/50 uppercase tracking-widest text-right">Stars (High Margin, High Pop)</div>
        <div className="absolute bottom-4 left-4 text-[10px] font-black text-rose-500/50 uppercase tracking-widest">Dogs (Low Margin, Low Pop)</div>
        <div className="absolute bottom-4 right-4 text-[10px] font-black text-amber-500/50 uppercase tracking-widest text-right">Plow Horses (Low Margin, High Pop)</div>

        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
            <XAxis 
              type="number" 
              dataKey="popularity" 
              name="Popularity" 
              stroke="#3f3f46" 
              tick={{fontSize: 10, fontWeight: 'bold'}}
              domain={[0, 100]}
              label={{ value: 'Popularity %', position: 'bottom', fill: '#71717a', fontSize: 10, fontWeight: 'black', offset: 20 }}
            />
            <YAxis 
              type="number" 
              dataKey="profitability" 
              name="Profitability" 
              stroke="#3f3f46"
              tick={{fontSize: 10, fontWeight: 'bold'}}
              domain={[0, 100]}
              label={{ value: 'Profitability %', angle: -90, position: 'left', fill: '#71717a', fontSize: 10, fontWeight: 'black', offset: 20 }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
            />
            <Scatter name="Menu Items" data={data} fill="#10b981">
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={
                    entry.type === 'STAR' ? '#10b981' : 
                    entry.type === 'PUZZLE' ? '#8b5cf6' :
                    entry.type === 'PLOW_HORSE' ? '#f59e0b' : '#ef4444'
                  } 
                />
              ))}
              <LabelList dataKey="name" position="top" fill="#71717a" style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
