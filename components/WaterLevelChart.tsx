import React, { useState, useMemo } from 'react';
import { 
  ComposedChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  Brush 
} from 'recharts';
import { parseDate, formatFriendlyDate } from '../services/dataService';
import { Filter, ZoomIn, Calendar } from 'lucide-react';

interface Props {
  data: { time: string; level: number }[];
}

type TimeRange = '24h' | '7d' | '30d' | 'all' | 'custom';

export const WaterLevelChart: React.FC<Props> = ({ data }) => {
  const [range, setRange] = useState<TimeRange>('24h');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const now = Date.now();
    let startTime = 0;
    let endTime = now;

    if (range === '24h') startTime = now - (24 * 60 * 60 * 1000);
    else if (range === '7d') startTime = now - (7 * 24 * 60 * 60 * 1000);
    else if (range === '30d') startTime = now - (30 * 24 * 60 * 60 * 1000);
    else if (range === 'custom') {
        startTime = customStart ? new Date(customStart).getTime() : 0;
        // Set end time to end of the selected day
        endTime = customEnd ? new Date(customEnd).setHours(23, 59, 59, 999) : now;
    }
    
    // 1. Parse timestamps and Filter by Range
    const processed = data
        .map(d => ({ ...d, ts: parseDate(d.time) }))
        .filter(d => d.ts > 0 && d.ts >= startTime && d.ts <= endTime)
        .sort((a, b) => a.ts - b.ts);

    // 2. Format for Chart Display
    return processed.map(d => {
        const dateObj = new Date(d.ts);
        
        // Dynamic Axis Labeling based on range
        let label = "";
        if (range === '24h') {
           label = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
        } else if (range === '7d' || range === '30d') {
           label = `${dateObj.getDate()}/${dateObj.getMonth()+1} ${dateObj.getHours()}h`;
        } else {
           label = dateObj.toLocaleDateString([], {month: 'short', day: 'numeric'});
        }

        return {
            ...d,
            friendlyDate: formatFriendlyDate(d.time),
            axisLabel: label,
            // Add numeric timestamp for potential X-axis scaling if needed in future
            ts: d.ts 
        };
    });
  }, [data, range, customStart, customEnd]);

  // Accessibility helper
  const chartDescription = `Water level chart showing data for the last ${range === 'all' ? 'recorded history' : range}. Contains ${chartData.length} data points.`;

  return (
    <div className="w-full mt-2">
        {/* Controls Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Filter size={14} className="text-blue-500" />
                <span>Filter Range</span>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
                 <div className="flex bg-slate-100 p-1 rounded-lg shadow-inner">
                    {(['24h', '7d', '30d', 'all', 'custom'] as TimeRange[]).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            aria-pressed={range === r}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                                range === r 
                                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                        >
                            {r === 'all' ? 'Max' : r}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Custom Date Inputs */}
        {range === 'custom' && (
            <div className="flex items-center gap-3 mb-6 animate-in slide-in-from-top-2 fade-in duration-200 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-blue-400 uppercase">Start Date</label>
                    <input 
                        type="date" 
                        className="text-xs p-1.5 rounded border border-blue-200 focus:border-blue-500 outline-none text-slate-700 bg-white"
                        onChange={(e) => setCustomStart(e.target.value)}
                        aria-label="Start Date"
                    />
                </div>
                <span className="text-blue-300 mt-4 self-center">—</span>
                <div className="flex flex-col gap-1">
                     <label className="text-[10px] font-bold text-blue-400 uppercase">End Date</label>
                    <input 
                        type="date" 
                        className="text-xs p-1.5 rounded border border-blue-200 focus:border-blue-500 outline-none text-slate-700 bg-white"
                        onChange={(e) => setCustomEnd(e.target.value)}
                        aria-label="End Date"
                    />
                </div>
            </div>
        )}

        {/* Chart Area */}
        {chartData.length > 0 ? (
            <div className="h-[360px] w-full" role="img" aria-label={chartDescription}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis 
                            dataKey="axisLabel" 
                            tick={{ fontSize: 10, fill: '#94a3b8' }} 
                            stroke="#e2e8f0"
                            minTickGap={50}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis 
                            tick={{ fontSize: 10, fill: '#94a3b8' }} 
                            stroke="#e2e8f0"
                            tickLine={false}
                            axisLine={false}
                            label={{ value: 'Level (cm)', angle: -90, position: 'insideLeft', style: {fill: '#cbd5e1', fontSize: 10, fontWeight: 600} }}
                            domain={[0, 'auto']}
                        />
                        <Tooltip 
                            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                            contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                                borderRadius: '8px', 
                                border: '1px solid #f1f5f9', 
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                            }}
                            itemStyle={{ color: '#2563eb', fontWeight: 600, fontSize: '12px' }}
                            labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '11px', fontWeight: 500 }}
                            formatter={(value: number) => [`${value} cm`, 'Water Level']}
                            labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0) {
                                    return payload[0].payload.friendlyDate;
                                }
                                return label;
                            }}
                        />
                        <ReferenceLine y={7} stroke="#f472b6" strokeDasharray="3 3" label={{ value: "Low", position: 'insideRight', fill: '#f472b6', fontSize: 10 }} />
                        <ReferenceLine y={20} stroke="#a855f7" strokeDasharray="3 3" label={{ value: "Flood", position: 'insideRight', fill: '#a855f7', fontSize: 10 }} />
                        
                        <Area 
                            type="monotone" 
                            dataKey="level" 
                            stroke="#3b82f6" 
                            strokeWidth={2} 
                            fillOpacity={1} 
                            fill="url(#colorLevel)" 
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
                            animationDuration={800}
                        />
                        <Brush 
                            height={30} 
                            stroke="#cbd5e1" 
                            fill="#f8fafc" 
                            tickFormatter={() => ''}
                            travellerWidth={10}
                            traveller={
                                <CustomTraveller />
                            }
                        />
                    </ComposedChart>
                </ResponsiveContainer>
                <div className="mt-3 flex justify-center">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        <ZoomIn size={12} className="text-blue-400" /> 
                        Drag the bottom sliders to zoom and pan through history
                    </span>
                </div>
            </div>
        ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                <Calendar className="h-10 w-10 mb-3 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No data found for this period</p>
                <button onClick={() => setRange('all')} className="text-blue-500 text-xs mt-2 hover:underline font-medium">View All History</button>
            </div>
        )}
    </div>
  );
};

const CustomTraveller = (props: any) => {
    const { x, y, width, height } = props;
    return (
        <g>
            <rect x={x} y={y} width={width} height={height} fill="#fff" stroke="#cbd5e1" rx={4} />
            <line x1={x + width/3} y1={y + height/4} x2={x + width/3} y2={y + height*0.75} stroke="#94a3b8" strokeWidth={2} strokeLinecap="round"/>
            <line x1={x + width*2/3} y1={y + height/4} x2={x + width*2/3} y2={y + height*0.75} stroke="#94a3b8" strokeWidth={2} strokeLinecap="round"/>
        </g>
    );
};
