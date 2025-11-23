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
import { parseDate, formatDateTime } from '../services/dataService';
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
                label = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            } else if (range === '7d') {
                label = `${dateObj.getDate()}/${dateObj.getMonth() + 1} ${dateObj.getHours()}h`;
            } else {
                label = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }

            return {
                ...d,
                friendlyDate: formatDateTime(d.time), // Full format for tooltip
                axisLabel: label,
                ts: d.ts
            };
        });
    }, [data, range, customStart, customEnd]);

    const chartDescription = `Water level chart showing data for the last ${range === 'all' ? 'recorded history' : range}. Contains ${chartData.length} data points.`;

    return (
        <div className="w-full mt-4">
            {/* Controls Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
                    <Filter size={14} className="text-blue-500" />
                    <span>Time Range</span>
                </div>

                <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
                    <div className="flex flex-wrap bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-full lg:w-auto">
                        {(['24h', '7d', '30d', 'all', 'custom'] as TimeRange[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`flex-1 lg:flex-none px-3 py-1.5 rounded-md text-xs font-bold transition-all capitalize ${range === r
                                        ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
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
                <div className="flex flex-wrap items-center gap-3 mb-6 animate-in slide-in-from-top-2 fade-in duration-200 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                        <input
                            type="date"
                            className="text-xs p-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-slate-700 bg-slate-50 font-medium"
                            onChange={(e) => setCustomStart(e.target.value)}
                            value={customStart}
                        />
                    </div>
                    <span className="text-slate-300 mt-4 hidden sm:block">—</span>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                        <input
                            type="date"
                            className="text-xs p-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-slate-700 bg-slate-50 font-medium"
                            onChange={(e) => setCustomEnd(e.target.value)}
                            value={customEnd}
                        />
                    </div>
                </div>
            )}

            {/* Chart Area */}
            {chartData.length > 0 ? (
                <div className="h-[400px] w-full bg-white rounded-none select-none" role="img" aria-label={chartDescription}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
                            <defs>
                                <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                                dataKey="axisLabel"
                                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                                stroke="#cbd5e1"
                                minTickGap={30}
                                tickLine={false}
                                axisLine={{ stroke: '#e2e8f0' }}
                                dy={10}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                                stroke="#e2e8f0"
                                tickLine={false}
                                axisLine={false}
                                unit=" cm"
                                width={40}
                                domain={[0, 30]}
                            />
                            <Tooltip
                                cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    padding: '12px'
                                }}
                                itemStyle={{ color: '#0f172a', fontWeight: 700, fontSize: '14px' }}
                                labelStyle={{ color: '#64748b', marginBottom: '8px', fontSize: '12px', fontWeight: 600, borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}
                                formatter={(value: number) => [`${value} cm`, 'Water Level']}
                                labelFormatter={(label, payload) => {
                                    if (payload && payload.length > 0) {
                                        return payload[0].payload.friendlyDate;
                                    }
                                    return label;
                                }}
                            />

                            {/* 0-30cm Scale: 15cm is Soil Surface, 25cm is High */}
                            <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "High Water", position: 'insideRight', fill: '#ef4444', fontSize: 10, fontWeight: 600 }} />
                            <ReferenceLine y={15} stroke="#16a34a" strokeWidth={1} label={{ value: "Soil Surface", position: 'insideRight', fill: '#16a34a', fontSize: 10, fontWeight: 600 }} />

                            <Area
                                type="monotone"
                                dataKey="level"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorLevel)"
                                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#2563eb' }}
                                animationDuration={1000}
                            />
                            <Brush
                                height={40}
                                stroke="#94a3b8"
                                fill="#f8fafc"
                                tickFormatter={() => ''}
                                travellerWidth={12}
                                gap={10}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                    <div className="mt-2 flex justify-center">
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                            <ZoomIn size={12} className="text-blue-400" />
                            Use the slider below the chart to zoom and pan history
                        </span>
                    </div>
                </div>
            ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                        <Calendar className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">No data available</p>
                    <p className="text-xs text-slate-400 mt-1">Adjust the date range filter above</p>
                </div>
            )}
        </div>
    );
};