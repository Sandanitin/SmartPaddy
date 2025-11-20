import React, { useEffect, useState } from 'react';
import { fetchSensorData, parseDate, formatFriendlyDate } from './services/dataService';
import { SensorData, GatewayStatus, SheetRow } from './types';
import { StatusBadge } from './components/StatusBadge';
import { SystemHealth } from './components/SystemHealth';
import { WaterLevelChart } from './components/WaterLevelChart';
import { DataLogs } from './components/DataLogs';
import { Droplets, RefreshCw, ArrowLeft, Clock, LayoutDashboard, FileText, AlertTriangle, Zap, Calendar } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [gateway, setGateway] = useState<GatewayStatus | null>(null);
  const [logs, setLogs] = useState<SheetRow[]>([]);
  
  const [selectedSensor, setSelectedSensor] = useState<SensorData | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs'>('dashboard');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSensorData();
      setSensors(data.sensors);
      setGateway(data.gateway);
      setLogs(data.logs);
      setLastRefreshed(new Date());

      // If a sensor is selected, update its reference to the new data
      if (selectedSensor) {
        const updated = data.sensors.find(s => s.id === selectedSensor.id);
        if (updated) setSelectedSensor(updated);
      }
    } catch (err: any) {
      console.error(err);
      const message = err.message && err.message.length > 0 && err.message !== "Failed to fetch" 
        ? err.message 
        : "Failed to connect to Google Sheets. Please ensure your Web App is deployed as 'Anyone' and has the doGet() function.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Auto refresh every min
    return () => clearInterval(interval);
  }, []);

  // Helper to display relative time (e.g. "5 mins ago")
  const getTimeAgo = (dateStr: string) => {
    const ts = parseDate(dateStr);
    if (ts === 0) return 'Unknown';
    
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-10 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-2 rounded-lg shadow-lg shadow-blue-200">
                <Droplets className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-xl text-slate-900 tracking-tight block leading-none">WaterMonitor</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Live Data
                </span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2 mx-6">
                <button 
                  onClick={() => { setActiveTab('dashboard'); setSelectedSensor(null); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <LayoutDashboard size={16} /> Dashboard
                </button>
                <button 
                  onClick={() => { setActiveTab('logs'); setSelectedSensor(null); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <FileText size={16} /> Data Logs
                </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden lg:block">
                <span className="block text-xs text-slate-400">Last synced</span>
                <span className="block text-xs font-mono font-medium text-slate-700">{lastRefreshed.toLocaleTimeString()}</span>
              </div>
              <button 
                onClick={loadData}
                className={`p-2.5 rounded-full hover:bg-blue-50 border border-transparent hover:border-blue-100 hover:text-blue-600 transition-all ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`}
                title="Refresh Data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Tabs */}
        <div className="flex md:hidden border-t border-slate-100 bg-white">
           <button 
              onClick={() => { setActiveTab('dashboard'); setSelectedSensor(null); }}
              className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500'}`}
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button 
              onClick={() => { setActiveTab('logs'); setSelectedSensor(null); }}
              className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'logs' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500'}`}
            >
              <FileText size={16} /> Logs
            </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-800 shadow-sm justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="shrink-0 text-red-600" size={20} />
              </div>
              <div className="text-sm mt-1">
                <p className="font-bold text-red-900">Data Sync Error</p>
                <p className="text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
            <button 
              onClick={loadData} 
              className="px-3 py-1.5 bg-white border border-red-200 text-red-700 text-xs font-medium rounded-lg hover:bg-red-50 shadow-sm whitespace-nowrap"
            >
              Retry
            </button>
          </div>
        )}

        {/* Gateway Status Section */}
        {gateway && activeTab === 'dashboard' && !selectedSensor && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <SystemHealth status={gateway} />
          </div>
        )}

        {/* Content Switcher */}
        {loading && sensors.length === 0 ? (
           <div className="flex flex-col justify-center items-center h-64 animate-in fade-in">
             <div className="relative mb-6">
               <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20"></div>
               <div className="relative rounded-full bg-white p-4 shadow-lg border border-blue-100">
                 <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
               </div>
             </div>
             <p className="text-slate-500 font-medium text-lg">Connecting to Gateway...</p>
             <p className="text-slate-400 text-sm mt-1">Fetching telemetry from Google Sheets</p>
           </div>
        ) : activeTab === 'logs' ? (
           <div className="animate-in fade-in duration-300">
             <DataLogs logs={logs} error={error} />
           </div>
        ) : selectedSensor ? (
          // Detail View
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => setSelectedSensor(null)}
              className="group flex items-center text-sm text-slate-500 hover:text-blue-600 mb-4 transition-colors font-medium pl-1"
            >
              <div className="p-1.5 rounded-full bg-white border border-slate-200 group-hover:border-blue-200 mr-2 shadow-sm group-hover:shadow">
                 <ArrowLeft className="h-4 w-4" />
              </div>
              Back to Dashboard
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-r from-white via-slate-50/30 to-slate-50/50">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedSensor.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500 shadow-sm">{selectedSensor.id}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                       <Clock size={14} className="text-slate-400" /> 
                       Updated {getTimeAgo(selectedSensor.lastUpdated)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-6 bg-white/50 p-2 rounded-xl border border-slate-100 shadow-sm sm:shadow-none sm:border-0 sm:bg-transparent sm:p-0">
                   <div className="text-right">
                      <div className="text-4xl font-bold text-slate-800 tracking-tight flex items-baseline justify-end gap-1">
                        {selectedSensor.currentLevel}
                        <span className="text-lg font-normal text-slate-400">cm</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 text-right">Current Level</div>
                   </div>
                   <div className="scale-110">
                    <StatusBadge status={selectedSensor.status} />
                   </div>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Zap size={14} className="text-blue-500" />
                  Real-time Trend
                </h3>
                <WaterLevelChart data={selectedSensor.history} />
              </div>

              <div className="bg-slate-50/80 p-6 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={14} />
                  Latest Telemetry Packet
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <span className="block text-xs text-slate-400 mb-1">Transmitter Data</span>
                    <span className="font-mono font-medium text-slate-700 break-all">{selectedSensor.raw["Transmitter Data"]}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <span className="block text-xs text-slate-400 mb-1">Gateway Received</span>
                    <span className="font-mono font-medium text-slate-700">{formatFriendlyDate(selectedSensor.raw["Gateway Received Time"])}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <span className="block text-xs text-slate-400 mb-1">Batch Upload</span>
                    <span className="font-mono font-medium text-slate-700">{formatFriendlyDate(selectedSensor.raw["Batch Upload Time"])}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {sensors.length === 0 && !loading && !error && (
               <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
                 <div className="bg-slate-50 p-4 rounded-full mb-4">
                   <LayoutDashboard className="h-8 w-8 text-slate-300" />
                 </div>
                 <p className="text-slate-500 font-medium">No sensor data found</p>
                 <p className="text-slate-400 text-sm mt-1">Waiting for the first transmission...</p>
               </div>
            )}
            {/* Only show error placeholder in grid if really no data and error exists */}
             {sensors.length === 0 && error && (
               <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-red-100 border-dashed">
                 <div className="bg-red-50 p-4 rounded-full mb-4">
                   <AlertTriangle className="h-8 w-8 text-red-300" />
                 </div>
                 <p className="text-red-400 font-medium">Connection Failed</p>
                 <p className="text-slate-400 text-sm mt-1">Check settings and retry</p>
               </div>
            )}

            {sensors.map((sensor) => (
              <div 
                key={sensor.id}
                onClick={() => setSelectedSensor(sensor)}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-xl hover:border-blue-200 transition-all duration-300 group relative overflow-hidden flex flex-col"
              >
                {/* Decorative background blob */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-xl"></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50/80 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 text-blue-600 shadow-sm ring-1 ring-blue-100 group-hover:ring-blue-600">
                       <Droplets className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">{sensor.name}</h3>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{sensor.id}</div>
                    </div>
                  </div>
                  <StatusBadge status={sensor.status} />
                </div>
                
                <div className="relative z-10 mt-4 flex-grow">
                   <div className="flex items-baseline gap-1">
                     <span className="text-4xl font-bold text-slate-800 tracking-tighter">{sensor.currentLevel}</span>
                     <span className="text-lg font-medium text-slate-400">cm</span>
                   </div>
                </div>
                
                <div className="relative z-10 mt-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-slate-500" title={formatFriendlyDate(sensor.lastUpdated)}>
                         <Clock size={14} className="text-slate-400" />
                         <span>{getTimeAgo(sensor.lastUpdated)}</span>
                      </div>
                      {/* Ensure we don't show N/A or raw string, instead show cleaned time or just skip */}
                      <div className="text-slate-400">
                         {formatFriendlyDate(sensor.lastUpdated) !== 'N/A' 
                           ? formatFriendlyDate(sensor.lastUpdated) 
                           : ''}
                      </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;