import React, { useEffect, useState, useMemo } from 'react';
import { fetchSensorData, parseDate, formatDateTime } from './services/dataService';
import { SensorData, GatewayStatus, SheetRow } from './types';
import { StatusBadge } from './components/StatusBadge';
import { SystemHealth } from './components/SystemHealth';
import { WaterLevelChart } from './components/WaterLevelChart';
import { DataLogs } from './components/DataLogs';
import { IrrigationAdvice } from './components/IrrigationAdvice';
import { WeatherDashboard } from './components/WeatherDashboard';
import { CropManager, calculateStage } from './components/CropManager';
import { AWDGauge } from './components/AWDGauge';
import { fetchLocalWeather, getUserLocation, WeatherData } from './services/weatherService';
import { Sprout, RefreshCw, ArrowLeft, Clock, LayoutDashboard, FileText, AlertTriangle, Zap, Radio, ArrowRight, Move, Save, MapPin, CloudRain, Sun, CloudSun, Smartphone, Edit2, Check, X } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [gateway, setGateway] = useState<GatewayStatus | null>(null);
  const [logs, setLogs] = useState<SheetRow[]>([]);
  
  const [selectedSensor, setSelectedSensor] = useState<SensorData | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'weather'>('dashboard');
  const [isRearranging, setIsRearranging] = useState(false);
  
  // Renaming State
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  // Filter State for Dashboard
  const [dashboardFilter, setDashboardFilter] = useState<'all' | 'lora' | 'gsm'>('all');

  // --- New Features State ---
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(false);

  const getSavedNames = () => {
    try {
      const saved = localStorage.getItem('sensor_custom_names');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  };

  const loadData = async () => {
    if (!isRearranging) setLoading(true); 
    setError(null);
    try {
      const data = await fetchSensorData();
      
      // 1. Apply Custom Names
      const savedNames = getSavedNames();
      const sensorsWithNames = data.sensors.map(s => ({
          ...s,
          name: savedNames[s.id] || s.name
      }));

      // 2. Apply saved order
      const savedOrderJson = localStorage.getItem('sensorOrder');
      let sortedSensors = sensorsWithNames;
      
      if (savedOrderJson) {
        try {
          const orderList = JSON.parse(savedOrderJson);
          if (Array.isArray(orderList)) {
            sortedSensors.sort((a, b) => {
              let idxA = orderList.indexOf(a.id);
              let idxB = orderList.indexOf(b.id);
              if (idxA === -1) idxA = 9999;
              if (idxB === -1) idxB = 9999;
              return idxA - idxB;
            });
          }
        } catch (e) { console.error("Failed to parse sensor order", e); }
      }

      setSensors(sortedSensors);
      setGateway(data.gateway);
      setLogs(data.logs);
      setLastRefreshed(new Date());

      if (selectedSensor) {
        const updated = sortedSensors.find(s => s.id === selectedSensor.id);
        if (updated) setSelectedSensor(updated);
      }
    } catch (err: any) {
      console.error(err);
      const message = err.message && err.message.length > 0 && err.message !== "Failed to fetch" 
        ? err.message 
        : "Connection failed. Please ensure your Google Sheet is active and accessible.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load Weather from Storage on mount if available
  useEffect(() => {
    const saved = localStorage.getItem('fieldLocation');
    if (saved) {
        const { lat, lon, name } = JSON.parse(saved);
        fetchAndSetWeather(lat, lon, false, name);
    }
  }, []);

  const fetchAndSetWeather = async (lat: number, lon: number, save: boolean, overrideName?: string) => {
    setWeatherLoading(true);
    setWeatherError(false);
    try {
        const data = await fetchLocalWeather(lat, lon);
        let finalName = data.locationName || "Local Field";
        
        if (overrideName) {
            finalName = overrideName;
        } else if (!save) {
            const saved = localStorage.getItem('fieldLocation');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.name) finalName = parsed.name;
            }
        }

        const weatherDataWithCorrectName = { ...data, locationName: finalName };
        setWeather(weatherDataWithCorrectName);
        
        if (save || overrideName) {
            localStorage.setItem('fieldLocation', JSON.stringify({
                lat,
                lon,
                name: finalName
            }));
        }
    } catch (e) {
        console.error("Weather Fetch Error", e);
        setWeatherError(true);
    } finally {
        setWeatherLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    try {
        setWeatherLoading(true);
        setWeatherError(false);
        const loc = await getUserLocation();
        await fetchAndSetWeather(loc.lat, loc.lon, true);
    } catch (e) {
        console.error("GPS Error", e);
        setWeatherError(true);
        setWeatherLoading(false);
    }
  };

  const handleRefreshWeather = async () => {
    const saved = localStorage.getItem('fieldLocation');
    if (saved) {
        const { lat, lon, name } = JSON.parse(saved);
        await fetchAndSetWeather(lat, lon, false, name);
    } else {
        handleUpdateLocation();
    }
  };

  const handleLocationNameChange = (newName: string) => {
     if (!weather) return;
     const updated = { ...weather, locationName: newName };
     setWeather(updated);
     const saved = localStorage.getItem('fieldLocation');
     if (saved) {
         const data = JSON.parse(saved);
         localStorage.setItem('fieldLocation', JSON.stringify({ ...data, name: newName }));
     }
  };

  const moveSensor = (e: React.MouseEvent, index: number, direction: -1 | 1) => {
    e.stopPropagation();
    if (index + direction < 0 || index + direction >= sensors.length) return;

    const newSensors = [...sensors];
    [newSensors[index], newSensors[index + direction]] = [newSensors[index + direction], newSensors[index]];
    
    setSensors(newSensors);
    
    const orderIds = newSensors.map(s => s.id);
    localStorage.setItem('sensorOrder', JSON.stringify(orderIds));
  };

  // Renaming Handlers
  const handleEditName = (e: React.MouseEvent, sensor: SensorData) => {
    e.stopPropagation();
    setEditingNameId(sensor.id);
    setTempName(sensor.name);
  };

  const handleSaveName = (e: React.SyntheticEvent, id: string) => {
    e.stopPropagation();
    const saved = getSavedNames();
    if (!tempName.trim()) {
        delete saved[id]; // Revert to default if empty
    } else {
        saved[id] = tempName.trim();
    }
    localStorage.setItem('sensor_custom_names', JSON.stringify(saved));
    setEditingNameId(null);
    loadData(); // Reload to apply changes
  };

  const handleCancelEdit = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setEditingNameId(null);
  };

  const getTimeAgo = (dateStr: string) => {
    const ts = parseDate(dateStr);
    if (ts === 0) return 'Unknown';
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return new Date(ts).toLocaleDateString();
  };

  const getCropInfo = (id: string) => {
    try {
        const saved = localStorage.getItem(`crop_${id}`);
        if (saved) {
            return calculateStage(JSON.parse(saved));
        }
    } catch (e) { return null; }
    return null;
  };

  // Filter sensors based on selection
  const filteredSensors = useMemo(() => {
      if (dashboardFilter === 'all') return sensors;
      if (dashboardFilter === 'lora') return sensors.filter(s => s.id.toLowerCase().includes('lora'));
      if (dashboardFilter === 'gsm') return sensors.filter(s => !s.id.toLowerCase().includes('lora'));
      return sensors;
  }, [sensors, dashboardFilter]);

  // Filter logs based on current dashboard filter
  const filteredLogs = useMemo(() => {
      if (dashboardFilter === 'all') return logs;
      if (dashboardFilter === 'lora') return logs.filter(l => l["Device ID"] && l["Device ID"].toLowerCase().includes('lora'));
      if (dashboardFilter === 'gsm') return logs.filter(l => l["Device ID"] && !l["Device ID"].toLowerCase().includes('lora'));
      return logs;
  }, [logs, dashboardFilter]);

  // Calculate active gateway status based on filtered logs (latest log from filtered set)
  const activeGateway = useMemo(() => {
      if (filteredLogs.length > 0) {
          const latest = filteredLogs[0];
          return {
              network: latest["Network"] || "Unknown",
              simOperator: latest["SIM Operator"] || "-",
              wifiSignal: String(latest["WiFi Strength (dBm)"] || "0"),
              gsmSignal: String(latest["GSM Strength (RSSI)"] || "0"),
              sdFree: String(latest["SD Free (MB)"] || "0"),
              lastBatchUpload: latest["Batch Upload Time"] || latest["Gateway Received Time"] || "N/A",
              source: latest["Device ID"]
          } as GatewayStatus;
      }
      return gateway;
  }, [filteredLogs, gateway]);

  // Check if we have mixed device types to show filter
  const hasMixedDevices = useMemo(() => {
      const hasLora = sensors.some(s => s.id.toLowerCase().includes('lora'));
      const hasGsm = sensors.some(s => !s.id.toLowerCase().includes('lora'));
      return hasLora && hasGsm;
  }, [sensors]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans selection:bg-emerald-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-xl bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-lg shadow-md shadow-emerald-600/20">
                <Sprout className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight block leading-none">SmartPaddy</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Field Monitor</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-1 mx-6 bg-slate-100/50 p-1 rounded-full border border-slate-200/50">
                <button 
                  onClick={() => { setActiveTab('dashboard'); setSelectedSensor(null); }}
                  className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                  <LayoutDashboard size={16} /> Fields
                </button>
                <button 
                  onClick={() => { setActiveTab('logs'); setSelectedSensor(null); }}
                  className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                  <FileText size={16} /> Logs
                </button>
                <button 
                  onClick={() => { setActiveTab('weather'); setSelectedSensor(null); }}
                  className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'weather' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                  <CloudSun size={16} /> Weather
                </button>
            </div>

            <div className="flex items-center gap-4">
              {activeTab === 'dashboard' && !weather && (
                  <div className="hidden lg:flex items-center gap-3 mr-2">
                    <button 
                        onClick={handleRefreshWeather}
                        disabled={weatherLoading}
                        className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${weatherError ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-blue-50 hover:text-blue-600'}`}
                    >
                        {weatherLoading ? <RefreshCw size={12} className="animate-spin" /> : <MapPin size={12} />}
                        {weatherError ? 'Retry Weather' : 'Local Weather'}
                    </button>
                  </div>
              )}

              {/* Current Live Clock */}
              <CurrentClock />

              <div className="text-right hidden lg:block border-r border-slate-100 pr-4 mr-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Updated</span>
                <span className="block text-xs font-mono font-semibold text-slate-700">{lastRefreshed.toLocaleTimeString()}</span>
              </div>
              
              {activeTab === 'dashboard' && !selectedSensor && (
                <button 
                  onClick={() => setIsRearranging(!isRearranging)}
                  className={`p-2 rounded-full border transition-all ${isRearranging ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'}`}
                  title={isRearranging ? "Done Rearranging" : "Arrange Plots"}
                >
                  {isRearranging ? <Save size={16} /> : <Move size={16} />}
                </button>
              )}

              <button 
                onClick={loadData}
                className={`p-2 rounded-full hover:bg-slate-100 border border-slate-200 hover:border-slate-300 hover:text-emerald-600 transition-all ${loading ? 'animate-spin text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-500'}`}
                title="Refresh Data"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Tabs */}
        <div className="grid grid-cols-3 md:hidden border-t border-slate-100 bg-white">
           <button 
              onClick={() => { setActiveTab('dashboard'); setSelectedSensor(null); }}
              className={`py-3 text-xs font-bold uppercase tracking-wide text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'dashboard' ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50' : 'border-transparent text-slate-500'}`}
            >
              <LayoutDashboard size={14} /> Fields
            </button>
            <button 
              onClick={() => { setActiveTab('logs'); setSelectedSensor(null); }}
              className={`py-3 text-xs font-bold uppercase tracking-wide text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'logs' ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50' : 'border-transparent text-slate-500'}`}
            >
              <FileText size={14} /> Logs
            </button>
            <button 
              onClick={() => { setActiveTab('weather'); setSelectedSensor(null); }}
              className={`py-3 text-xs font-bold uppercase tracking-wide text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'weather' ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50' : 'border-transparent text-slate-500'}`}
            >
              <CloudSun size={14} /> Weather
            </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-center gap-4 text-red-800 shadow-sm animate-in slide-in-from-top-2">
            <div className="bg-red-100 p-2 rounded-full shrink-0">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-red-900">Sync Error</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
            <button 
              onClick={loadData} 
              className="px-4 py-2 bg-white border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-red-50 shadow-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content Switcher */}
        {activeTab === 'weather' ? (
            <WeatherDashboard 
                weather={weather} 
                loading={weatherLoading} 
                error={weatherError} 
                onRefresh={handleRefreshWeather}
                onUpdateLocation={handleUpdateLocation}
                onLocationNameChange={handleLocationNameChange}
            />
        ) : loading && sensors.length === 0 ? (
           <div className="flex flex-col justify-center items-center h-96 animate-in fade-in">
             <div className="relative mb-8">
               <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 animate-ping"></div>
               <div className="relative rounded-full bg-white p-4 shadow-xl border border-emerald-100">
                 <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
               </div>
             </div>
             <p className="text-slate-900 font-semibold text-lg">Connecting to Paddy Fields</p>
             <p className="text-slate-500 text-sm mt-2">Fetching water levels...</p>
           </div>
        ) : activeTab === 'logs' ? (
           <div className="animate-in fade-in duration-300">
             <DataLogs logs={filteredLogs} error={error} />
           </div>
        ) : selectedSensor ? (
          // Detailed View
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => setSelectedSensor(null)}
              className="group flex items-center text-sm text-slate-500 hover:text-emerald-600 mb-6 transition-colors font-medium"
            >
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 group-hover:border-emerald-300 mr-2 shadow-sm transition-all">
                 <ArrowLeft className="h-4 w-4" />
              </div>
              Back to Overview
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Main Water Level Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-start gap-6 bg-gradient-to-b from-white to-slate-50/50">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{selectedSensor.name}</h2>
                      <StatusBadge status={selectedSensor.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      {(() => {
                          const isLora = selectedSensor.id.toLowerCase().includes('lora');
                          return (
                             <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${isLora ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                  {isLora ? <Radio size={12} /> : <Smartphone size={12} />}
                                  {isLora ? 'LoRa' : 'GSM'}
                              </div>
                          );
                      })()}
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">{selectedSensor.id}</span>
                      <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-400" />
                          Updated {getTimeAgo(selectedSensor.lastUpdated)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center gap-6">
                      <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Water Depth</div>
                          <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-bold text-slate-900 tracking-tighter">{selectedSensor.currentLevel}</span>
                              <span className="text-lg font-medium text-slate-400">cm</span>
                          </div>
                      </div>
                      <div className="hidden sm:block h-10 w-px bg-slate-100"></div>
                      <div className="sm:min-w-[200px]">
                          <IrrigationAdvice 
                              level={selectedSensor.currentLevel} 
                              weather={weather}
                              cropStage={getCropInfo(selectedSensor.id) ? { name: getCropInfo(selectedSensor.id)!.stageName, index: getCropInfo(selectedSensor.id)!.stageIndex } : undefined}
                              plotName={selectedSensor.name}
                          />
                          {weather && weather.isRainy && (
                              <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                  <CloudRain size={12} /> Rain Forecast: {weather.rainForecast24h}mm
                              </div>
                          )}
                      </div>
                  </div>
                </div>
                
                <div className="p-6 md:p-8">
                  <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" />
                    Field Water History
                  </h3>
                  <WaterLevelChart data={selectedSensor.history} />
                </div>
              </div>

              {/* Crop Management Card */}
              <div className="lg:col-span-1">
                 <CropManager sensorId={selectedSensor.id} weather={weather} />
              </div>
            </div>

            {/* Telemetry Footer */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 md:p-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText size={14} />
                Node Telemetry
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DetailCard label="Last Received" value={formatDateTime(selectedSensor.raw["Gateway Received Time"])} />
                <DetailCard label="Batch Upload" value={formatDateTime(selectedSensor.raw["Batch Upload Time"])} />
                <DetailCard label="Signal Quality" value={`${selectedSensor.raw["GSM Strength (RSSI)"] || '-'} CSQ`} />
              </div>
            </div>
          </div>
        ) : (
          // Grid View
          <>
          {/* Weather Banner */}
          {weather && (
            <div className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 animate-in fade-in slide-in-from-top-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                      <div className="flex items-center gap-2 opacity-90 text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">
                          <MapPin size={12} /> {weather.locationName || 'Local Field'}
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                              {weather.isRainy ? <CloudRain size={32} /> : <Sun size={32} />}
                              <span className="text-4xl font-bold tracking-tight">{weather.temp}°</span>
                          </div>
                          <div className="h-8 w-px bg-white/20"></div>
                          <div>
                              <p className="font-semibold text-lg leading-none">{weather.conditionText}</p>
                              <p className="text-sm text-blue-100 opacity-90 mt-1">24h Forecast</p>
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-6 bg-white/10 rounded-xl p-3 backdrop-blur-sm w-full sm:w-auto justify-around sm:justify-start border border-white/10">
                      <div className="flex flex-col items-center sm:items-start">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-blue-100 mb-0.5">Rain</span>
                          <span className="text-xl font-bold">{weather.rainForecast24h}<span className="text-sm font-medium opacity-70 ml-0.5">mm</span></span>
                      </div>
                      <div className="flex flex-col items-center sm:items-start">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-blue-100 mb-0.5">Chance</span>
                          <span className="text-xl font-bold">{weather.rainChance}<span className="text-sm font-medium opacity-70 ml-0.5">%</span></span>
                      </div>
                      <button 
                          onClick={handleRefreshWeather}
                          disabled={weatherLoading}
                          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                          title="Refresh Weather"
                      >
                          <RefreshCw size={16} className={weatherLoading ? 'animate-spin' : ''} />
                      </button>
                  </div>
              </div>
            </div>
          )}
          
          {/* Enable Weather Button (Only if not loaded yet) */}
          {!weather && (
             <div className="mb-6 bg-blue-50 rounded-xl p-4 flex items-center justify-between border border-blue-100">
                 <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-full shadow-sm text-blue-500"><CloudRain size={16} /></div>
                    <div>
                        <h3 className="text-sm font-bold text-blue-900">Get Local Weather</h3>
                        <p className="text-xs text-blue-700">{weatherError ? 'Location access failed. Try again.' : 'For smarter irrigation advice'}</p>
                    </div>
                 </div>
                 <button 
                    onClick={handleUpdateLocation} 
                    disabled={weatherLoading}
                    className="bg-white text-blue-600 text-xs font-bold px-3 py-2 rounded-lg shadow-sm border border-blue-100"
                 >
                    {weatherLoading ? 'Loading...' : 'Enable'}
                 </button>
             </div>
          )}

          {/* Gateway Status */}
          {(activeGateway || gateway) && !isRearranging && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <SystemHealth status={activeGateway || gateway!} />
            </div>
          )}

          {/* Reordering Banner */}
          {isRearranging && (
            <div className="mb-6 bg-emerald-600 text-white p-4 rounded-xl shadow-lg shadow-emerald-200 animate-in fade-in slide-in-from-top-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg"><Move className="text-white" size={20} /></div>
                <div>
                    <h3 className="font-bold text-sm">Arrange Fields</h3>
                    <p className="text-emerald-100 text-xs">Use the arrow buttons to reorder the grid.</p>
                </div>
                </div>
                <button 
                onClick={() => setIsRearranging(false)}
                className="bg-white text-emerald-600 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-emerald-50 transition-colors"
                >
                Done
                </button>
            </div>
          )}
          
          {/* Device Filter */}
          {hasMixedDevices && !isRearranging && (
              <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-fit animate-in fade-in">
                  <button 
                    onClick={() => setDashboardFilter('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${dashboardFilter === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                      All Fields
                  </button>
                  <button 
                    onClick={() => setDashboardFilter('lora')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${dashboardFilter === 'lora' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                      <Radio size={12} /> LoRa Network
                  </button>
                  <button 
                    onClick={() => setDashboardFilter('gsm')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${dashboardFilter === 'gsm' ? 'bg-orange-50 text-orange-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                      <Smartphone size={12} /> Standalone GSM
                  </button>
              </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {filteredSensors.length === 0 && !loading && !error && (
               <div className="col-span-full flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 border-dashed text-center">
                 <div className="bg-slate-50 p-4 rounded-full mb-4">
                   <LayoutDashboard className="h-10 w-10 text-slate-300" />
                 </div>
                 <h3 className="text-lg font-semibold text-slate-900">No Fields Found</h3>
                 <p className="text-slate-500 mt-2">Ensure your Google Sheet is connected.</p>
               </div>
            )}
            {filteredSensors.map((sensor, index) => {
              const cropInfo = getCropInfo(sensor.id);

              return (
              <div 
                key={sensor.id}
                onClick={() => setSelectedSensor(sensor)}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded-xl shrink-0 ${sensor.id.toLowerCase().includes('lora') ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                          {sensor.id.toLowerCase().includes('lora') ? <Radio size={18} /> : <Smartphone size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                          {editingNameId === sensor.id ? (
                              <div className="flex items-center gap-1 animate-in fade-in" onClick={e => e.stopPropagation()}>
                                  <input 
                                      type="text" 
                                      value={tempName}
                                      onChange={e => setTempName(e.target.value)}
                                      className="w-full min-w-[80px] text-sm font-bold text-slate-900 border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                                      autoFocus
                                      onKeyDown={(e) => {
                                          if(e.key === 'Enter') handleSaveName(e, sensor.id);
                                          if(e.key === 'Escape') handleCancelEdit(e);
                                      }}
                                      onClick={e => e.stopPropagation()}
                                  />
                                  <button onClick={(e) => handleSaveName(e, sensor.id)} className="p-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 shrink-0"><Check size={12}/></button>
                                  <button onClick={(e) => handleCancelEdit(e)} className="p-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 shrink-0"><X size={12}/></button>
                              </div>
                          ) : (
                              <div className="flex items-center gap-2 group/name relative">
                                  <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">{sensor.name}</h3>
                                  <button 
                                      onClick={(e) => handleEditName(e, sensor)}
                                      className="opacity-100 md:opacity-0 group-hover/name:opacity-100 text-slate-300 hover:text-blue-600 transition-all p-1 rounded hover:bg-slate-100 shrink-0"
                                      title="Rename Plot"
                                  >
                                      <Edit2 size={12} />
                                  </button>
                              </div>
                          )}
                          <p className="text-xs text-slate-400 font-mono truncate">{sensor.id}</p>
                      </div>
                   </div>
                   <StatusBadge status={sensor.status} />
                </div>

                {/* Water Level & Gauge */}
                <div className="mb-4">
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold text-slate-900 tracking-tight">{sensor.currentLevel}</span>
                        <span className="text-sm font-medium text-slate-400 mb-1.5">cm</span>
                    </div>
                    <AWDGauge level={sensor.currentLevel} />
                </div>

                {/* Crop Stage Info */}
                {cropInfo && (
                    <div className="flex items-center justify-between text-xs mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                            <Sprout size={14} className="text-emerald-600" />
                            {cropInfo.stageName}
                        </div>
                        <div className="font-mono text-slate-500">
                            Day {cropInfo.days}
                        </div>
                    </div>
                )}

                {/* Irrigation Advice */}
                <IrrigationAdvice 
                    level={sensor.currentLevel} 
                    weather={weather}
                    cropStage={cropInfo ? { name: cropInfo.stageName, index: cropInfo.stageIndex } : undefined}
                    plotName={sensor.name}
                />
                
                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-3 mt-3">
                   <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {getTimeAgo(sensor.lastUpdated)}
                   </div>
                   <div className="flex items-center gap-1 font-medium text-emerald-600 group-hover:translate-x-1 transition-transform">
                      View Details <ArrowRight size={12} />
                   </div>
                </div>

                {/* Rearrange Overlay */}
                {isRearranging && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center gap-2 z-10 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                        <button 
                           onClick={(e) => moveSensor(e, index, -1)} 
                           disabled={index === 0}
                           className="p-3 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-30"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <button 
                           onClick={(e) => moveSensor(e, index, 1)} 
                           disabled={index === sensors.length - 1}
                           className="p-3 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-30"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                )}
              </div>
              );
            })}
          </div>
          </>
        )}
      </main>
    </div>
  );
}

const DetailCard = ({ label, value }: { label: string, value: string }) => (
  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{label}</span>
    <span className="font-mono font-semibold text-slate-700 text-xs sm:text-sm break-all">{value}</span>
  </div>
);

const CurrentClock = () => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end mr-4 border-r border-slate-100 pr-4">
       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
         {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
       </span>
       <span className="text-sm font-mono font-bold text-slate-700 leading-none">
         {time.toLocaleTimeString()}
       </span>
    </div>
  );
};

export default App;