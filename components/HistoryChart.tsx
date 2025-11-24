import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DailySession } from '../types';

interface HistoryChartProps {
  data: DailySession[];
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ data }) => {
  const processedData = data.slice(-7).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    hours: parseFloat((d.duration / 3600000).toFixed(1))
  }));

  return (
    <div className="w-full h-48 mt-4">
      <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Recent Activity</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={processedData}>
          <XAxis 
            dataKey="date" 
            tick={{fontSize: 12, fill: '#64748b'}} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis hide />
          <Tooltip 
            cursor={{fill: '#f1f5f9'}}
            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
          />
          <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
             {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.hours >= 9 ? '#10b981' : '#818cf8'} />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
