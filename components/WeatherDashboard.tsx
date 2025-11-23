
import React, { useState, useEffect } from 'react';
import { WeatherData } from '../services/weatherService';
import { CloudRain, Sun, MapPin, Droplets, Calendar, RefreshCw, Cloud, CloudLightning, Snowflake, CloudFog, Wind, Clock, ArrowUp, ArrowDown, Navigation, Edit2, Check, X, Loader2 } from 'lucide-react';

interface Props {
    weather: WeatherData | null;
    loading: boolean;
    error: boolean;
    onRefresh: () => void;
    onUpdateLocation: () => void;
    onLocationNameChange?: (name: string) => void;
}

const getWeatherIcon = (code: number, size: number = 24, className: string = "") => {
    if (code === 0) return <Sun size={size} className={`text-amber-500 ${className}`} />;
    if (code >= 1 && code <= 3) return <Cloud size={size} className={`text-slate-400 ${className}`} />;
    if (code >= 45 && code <= 48) return <CloudFog size={size} className={`text-slate-400 ${className}`} />;
    if (code >= 51 && code <= 67) return <CloudRain size={size} className={`text-blue-500 ${className}`} />;
    if (code >= 71 && code <= 77) return <Snowflake size={size} className={`text-cyan-400 ${className}`} />;
    if (code >= 80 && code <= 82) return <CloudRain size={size} className={`text-blue-600 ${className}`} />;
    if (code >= 95) return <CloudLightning size={size} className={`text-purple-500 ${className}`} />;
    return <Sun size={size} className={`text-amber-500 ${className}`} />;
};

export const WeatherDashboard: React.FC<Props> = ({ weather, loading, error, onRefresh, onUpdateLocation, onLocationNameChange }) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');

    useEffect(() => {
        if (weather?.locationName) {
            setTempName(weather.locationName);
        }
    }, [weather]);

    const startEditing = () => {
        if (weather) {
            setTempName(weather.locationName || '');
            setIsEditingName(true);
        }
    };

    const saveName = () => {
        if (onLocationNameChange && tempName.trim()) {
            onLocationNameChange(tempName.trim());
        }
        setIsEditingName(false);
    };

    if (loading && !weather) {
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
                <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping"></div>
                    <RefreshCw className="relative z-10 h-8 w-8 text-blue-500 animate-spin" />
                </div>
                <p className="text-slate-500 font-medium">Fetching Forecast...</p>
            </div>
        );
    }

    if (!weather) {
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center animate-in fade-in">
                 <div className="bg-blue-50 p-4 rounded-full mb-4 text-blue-500">
                    <CloudRain size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 mb-2">Local Weather Forecast</h3>
                 <p className="text-slate-500 mb-6 max-w-xs">Set your field location to see the 7-day forecast and receive irrigation advice.</p>
                 <button 
                    onClick={onUpdateLocation}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2"
                 >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                    {loading ? 'Locating...' : 'Set Location (GPS)'}
                 </button>
                 {error && <p className="text-red-500 text-xs mt-4 font-medium bg-red-50 px-3 py-1 rounded">Failed to get location. Please check permissions.</p>}
            </div>
        );
    }

    const today = weather.daily[0];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            {/* Current Condition Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-lg shadow-blue-200 text-white p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 p-8 opacity-10">
                    <Sun size={200} />
                </div>
                
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8">
                    <div className="w-full sm:w-auto">
                        {/* Location Header */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                             {isEditingName ? (
                                <div className="flex items-center gap-2 bg-white/20 p-1 pr-2 rounded-lg backdrop-blur-md">
                                    <input 
                                        type="text" 
                                        value={tempName} 
                                        onChange={(e) => setTempName(e.target.value)}
                                        className="bg-transparent text-white border-b border-white/30 outline-none px-2 py-1 text-sm font-bold w-40 placeholder-white/50"
                                        placeholder="Enter name..."
                                        autoFocus
                                    />
                                    <button onClick={saveName} className="p-1 hover:bg-green-500/50 rounded-md transition-colors"><Check size={14} /></button>
                                    <button onClick={() => setIsEditingName(false)} className="p-1 hover:bg-red-500/50 rounded-md transition-colors"><X size={14} /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                    <MapPin size={14} className="text-blue-200" /> 
                                    <span className="font-bold text-sm tracking-wide">{weather.locationName || 'Unknown Location'}</span>
                                    <button 
                                        onClick={startEditing} 
                                        className="ml-1 p-1 rounded-full hover:bg-white/20 text-blue-100 hover:text-white transition-colors"
                                        title="Rename Location"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                </div>
                            )}

                            <button 
                                onClick={onUpdateLocation}
                                disabled={loading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-700/30 hover:bg-blue-700/50 disabled:bg-blue-700/20 disabled:text-blue-300 disabled:cursor-wait border border-white/10 text-xs font-medium text-blue-100 hover:text-white transition-colors backdrop-blur-sm"
                                title="Update to current device GPS location"
                            >
                                {loading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                                {loading ? 'Updating...' : 'Update GPS'}
                            </button>
                        </div>

                        <div className="flex items-center gap-6 mb-2">
                            <span className="text-7xl font-bold tracking-tighter">{weather.temp}°</span>
                            <div className="flex flex-col justify-center">
                                <span className="text-2xl font-bold leading-tight">{weather.conditionText}</span>
                                <div className="flex items-center gap-3 mt-1 text-blue-50 font-medium">
                                    <span className="flex items-center"><ArrowUp size={14} className="mr-0.5"/>{Math.round(today.tempMax)}°</span>
                                    <span className="flex items-center opacity-75"><ArrowDown size={14} className="mr-0.5"/>{Math.round(today.tempMin)}°</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full sm:w-auto">
                         {[
                             { label: 'Rain', value: today.rainSum, unit: 'mm', icon: CloudRain },
                             { label: 'Chance', value: today.rainChance, unit: '%', icon: Droplets },
                             { label: 'Wind', value: weather.windSpeed, unit: 'km/h', icon: Wind },
                             { label: 'Humidity', value: weather.humidity, unit: '%', icon: Droplets },
                         ].map((stat, i) => (
                             <div key={i} className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/5 flex flex-col items-center justify-center min-w-[80px]">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-blue-100 mb-1">{stat.label}</span>
                                <span className="text-lg font-bold">{stat.value}<span className="text-xs font-medium opacity-70 ml-0.5">{stat.unit}</span></span>
                             </div>
                         ))}
                    </div>
                </div>
            </div>

            {/* Hourly Forecast */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <Clock size={18} className="text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Hourly Forecast</h3>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                    <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar snap-x cursor-grab active:cursor-grabbing">
                      {weather.hourly.map((hour, idx) => (
                        <div key={idx} className="min-w-[70px] flex flex-col items-center shrink-0 snap-start group">
                          <span className="text-xs font-bold text-slate-400 mb-3">
                            {new Date(hour.time).toLocaleTimeString([], {hour: 'numeric', hour12: true})}
                          </span>
                          <div className="mb-3 transform group-hover:scale-110 transition-transform">{getWeatherIcon(hour.conditionCode, 28)}</div>
                          <span className="text-base font-bold text-slate-800">{Math.round(hour.temp)}°</span>
                          <div className="h-6 mt-1 flex items-end">
                              {hour.rainChance > 0 && (
                                 <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                   <Droplets size={8} /> {hour.rainChance}%
                                 </span>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
            </div>

            {/* 7 Day Forecast Grid */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-slate-400" />
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">7-Day Forecast</h3>
                    </div>
                    <button onClick={onRefresh} disabled={loading} className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 transition-colors text-xs font-medium bg-slate-100 hover:bg-blue-50 px-2.5 py-1 rounded-full disabled:opacity-50" title="Refresh data for saved location">
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {weather.daily.map((day, idx) => {
                        const date = new Date(day.time);
                        const dayName = idx === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
                        const dateNum = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const isToday = idx === 0;

                        return (
                            <div key={day.time} className={`relative flex flex-col items-center p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isToday ? 'bg-blue-50/50 border-blue-100 ring-1 ring-blue-100' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                                <div className="text-center mb-4">
                                    <span className={`block text-sm font-bold ${isToday ? 'text-blue-600' : 'text-slate-800'}`}>{dayName}</span>
                                    <span className="block text-xs text-slate-400 font-medium mt-0.5">{dateNum}</span>
                                </div>

                                <div className="mb-4 transform hover:scale-110 transition-transform duration-300">
                                    {getWeatherIcon(day.conditionCode, 40)}
                                </div>

                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-2xl font-bold text-slate-800">{Math.round(day.tempMax)}°</span>
                                    <span className="text-sm font-semibold text-slate-400">/ {Math.round(day.tempMin)}°</span>
                                </div>

                                <div className="h-6 flex items-center">
                                    {day.rainChance > 0 ? (
                                        <div className="flex items-center gap-1 text-xs font-bold text-blue-500 bg-blue-100/50 px-2 py-1 rounded-lg">
                                             <Droplets size={12} /> {day.rainChance}%
                                        </div>
                                    ) : (
                                        <span className="text-xs font-medium text-slate-300">{day.conditionText}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
