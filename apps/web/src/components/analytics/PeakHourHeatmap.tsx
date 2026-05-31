'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const heatmapData = [
  { hour: '12 PM', volume: 45, prepTime: 12 },
  { hour: '01 PM', volume: 85, prepTime: 22 },
  { hour: '02 PM', volume: 60, prepTime: 18 },
  { hour: '03 PM', volume: 20, prepTime: 10 },
  { hour: '04 PM', volume: 15, prepTime: 8 },
  { hour: '05 PM', volume: 30, prepTime: 12 },
  { hour: '06 PM', volume: 55, prepTime: 15 },
  { hour: '07 PM', volume: 95, prepTime: 28 },
  { hour: '08 PM', volume: 110, prepTime: 35 },
  { hour: '09 PM', volume: 80, prepTime: 20 },
  { hour: '10 PM', volume: 40, prepTime: 15 },
];

export const PeakHourHeatmap = () => {
  return (
    <div className="bg-zinc-950 p-10 rounded-[3rem] border border-white/5 shadow-2xl h-[400px] flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-sm font-black text-rose-500 uppercase tracking-[0.4em] mb-2">Operational Load</h2>
          <h3 className="text-4xl font-black italic tracking-tight uppercase text-white">Peak Hour Heatmap</h3>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
             <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Order Volume</span>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={heatmapData}>
            <XAxis 
              dataKey="hour" 
              stroke="#27272a" 
              tick={{fontSize: 10, fontWeight: 'bold'}}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
            />
            <Bar dataKey="volume" radius={[10, 10, 10, 10]}>
              {heatmapData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.volume > 80 ? '#ef4444' : entry.volume > 50 ? '#f59e0b' : '#3f3f46'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
