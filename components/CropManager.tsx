
import React, { useState, useEffect } from 'react';
import { Calendar, Save, Edit2, Sprout, Timer, AlertCircle, BookOpen, Bug, Droplets, Leaf, Scissors, Sun, CloudRain, Wind, Thermometer, Droplet, StickyNote, Smartphone } from 'lucide-react';
import { PaddyVisual } from './PaddyVisual';
import { WeatherData } from '../services/weatherService';

interface Props {
  sensorId: string;
  weather: WeatherData | null;
}

export interface CropConfig {
  variety: 'short' | 'medium' | 'long';
  transplantDate: string;
}

// Data source: IRRI & Generic Rice Growth Models
export const VARIETY_DATA = {
  short: { name: 'Short Duration', min: 100, max: 120, avg: 110 },
  medium: { name: 'Medium Duration', min: 120, max: 140, avg: 130 },
  long: { name: 'Long Duration', min: 140, max: 160, avg: 150 }
};

export const calculateStage = (cfg: CropConfig) => {
  const start = new Date(cfg.transplantDate).getTime();
  const now = new Date().getTime();
  const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const totalDuration = VARIETY_DATA[cfg.variety].avg;

  // Dynamic Stage Calculation based on % of Total Duration
  // NOTE: Gauge Scale: 0cm = Bottom, 15cm = Soil Surface, 30cm = Top
  
  let stageIndex = 0;
  let stageName = "Establishment";
  let advice = "Maintain shallow water (Gauge 17-18cm)";
  let phase = "Vegetative";
  let managementTips: { category: string, text: string, icon: any }[] = [];
  
  const pct = (days / totalDuration) * 100;

  if (pct < 12) {
    stageIndex = 0;
    stageName = "Transplanting / Recovery";
    advice = "Keep soil saturated (Gauge 15-17cm). Avoid deep flood (>18cm).";
    phase = "Vegetative";
    managementTips = [
        { category: "Pest", text: "Monitor for Golden Apple Snails (feed on seedlings)", icon: Bug },
        { category: "Weeds", text: "Apply pre-emergence herbicide within 3-5 days", icon: AlertCircle },
        { category: "Care", text: "Replant missing hills (gap filling) within 7 days", icon: Sprout },
        { category: "Water", text: "Keep saturated. Deep water (>18cm on Gauge) drowns seedlings.", icon: Droplets }
    ];
  } 
  else if (pct < 35) {
    stageIndex = 1;
    stageName = "Active Tillering";
    advice = "Maintain Gauge 17-20cm (Shallow Water). Apply N fertilizer.";
    phase = "Vegetative";
    managementTips = [
        { category: "Nutrient", text: "Apply 1st Nitrogen Topdress (Urea) for tillers", icon: Leaf },
        { category: "Weeds", text: "Critical time for weeding. Weeds steal light.", icon: AlertCircle },
        { category: "Pest", text: "Check for Whorl Maggot or Caseworm damage", icon: Bug },
        { category: "Water", text: "Gauge 17-20cm promotes tillering. AWD is safe.", icon: Droplets }
    ];
  }
  else if (pct < 50) {
    stageIndex = 2;
    stageName = "Stem Elongation";
    advice = "Periodic drying (AWD) is beneficial. Allow gauge to drop <15cm.";
    phase = "Vegetative";
    managementTips = [
        { category: "Water", text: "Practice AWD (Gauge <15cm). Drying deepens roots", icon: Droplets },
        { category: "Nutrient", text: "Apply Potassium (K) for strong stems", icon: Leaf },
        { category: "Pest", text: "Scout for Stem Borer deadhearts (white heads)", icon: Bug },
        { category: "Disease", text: "Inspect lower sheath for Sheath Blight", icon: AlertCircle }
    ];
  }
  else if (pct < 65) {
    stageIndex = 3;
    stageName = "Panicle Initiation (Booting)";
    advice = "Flood Required! Keep Gauge >20cm. Do not stress.";
    phase = "Reproductive";
    managementTips = [
        { category: "Water", text: "Do NOT drain (Gauge must be >20cm). Stress reduces yield.", icon: Droplets },
        { category: "Care", text: "Protect the flag leaf (provides 50% of yield)", icon: Sun },
        { category: "Pest", text: "Control rats - they prefer sweet stalks now", icon: Bug },
        { category: "Nutrient", text: "Stop Nitrogen to avoid attracting pests", icon: Leaf }
    ];
  }
  else if (pct < 75) {
    stageIndex = 4;
    stageName = "Heading / Flowering";
    advice = "Maintain steady water (Gauge 17-20cm). Avoid drainage.";
    phase = "Reproductive";
    managementTips = [
        { category: "Care", text: "Avoid spraying 9am-3pm to save pollinators", icon: Timer },
        { category: "Pest", text: "Rice Bug (Stink Bug) active morning/evening", icon: Bug },
        { category: "Disease", text: "Monitor for False Smut or Neck Blast", icon: AlertCircle },
        { category: "Weather", text: "High heat (>35°C) can cause sterility", icon: Sun }
    ];
  }
  else if (pct < 90) {
    stageIndex = 5;
    stageName = "Milk / Dough Stage";
    advice = "Keep soil saturated. Gauge 15-18cm is sufficient.";
    phase = "Ripening";
    managementTips = [
        { category: "Pest", text: "Protect ripening grain from birds and rats", icon: Bug },
        { category: "Water", text: "Standing water not required, just moist soil (Gauge ~15cm)", icon: Droplets },
        { category: "Care", text: "Remove off-types (rogueing) for purity", icon: Sprout },
        { category: "Harvest", text: "Plan harvest when 85% grains are golden", icon: Scissors }
    ];
  }
  else if (pct < 100 + 10) {
    stageIndex = 6;
    stageName = "Maturity / Ripening";
    advice = "Drain field completely (Gauge <15cm) to hasten ripening.";
    phase = "Ripening";
    managementTips = [
        { category: "Water", text: "Drain field (Gauge <15cm) 10-15 days before harvest", icon: Droplets },
        { category: "Harvest", text: "Check grain moisture (target 20-24%)", icon: Scissors },
        { category: "Care", text: "Prepare threshing equipment and mats", icon: BookOpen }
    ];
  } else {
    stageIndex = 7;
    stageName = "Harvest Ready";
    advice = "Field should be dry (Gauge <15cm).";
    phase = "Finished";
    managementTips = [
        { category: "Harvest", text: "Harvest immediately to avoid shattering", icon: Scissors },
        { category: "Post", text: "Dry grains to 14% moisture for storage", icon: Sun }
    ];
  }

  return { days: Math.max(0, days), stageIndex, stageName, advice, phase, totalDuration, managementTips };
};

export const CropManager: React.FC<Props> = ({ sensorId, weather }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState<CropConfig | null>(null);
  const [notes, setNotes] = useState('');
  
  // Form State
  const [variety, setVariety] = useState<'short' | 'medium' | 'long'>('medium');
  const [date, setDate] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(`crop_${sensorId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setConfig(parsed);
      setVariety(parsed.variety);
      setDate(parsed.transplantDate);
    } else {
      setIsEditing(true);
    }

    const savedNotes = localStorage.getItem(`notes_${sensorId}`);
    if (savedNotes) setNotes(savedNotes);
  }, [sensorId]);

  const handleSave = () => {
    if (!date) return;
    const newConfig: CropConfig = { variety, transplantDate: date };
    localStorage.setItem(`crop_${sensorId}`, JSON.stringify(newConfig));
    setConfig(newConfig);
    setIsEditing(false);
  };

  const handleSaveNotes = () => {
    localStorage.setItem(`notes_${sensorId}`, notes);
  };

  const getWeatherAnalysis = (stageIndex: number, weather: WeatherData) => {
    const alerts = [];
    
    // Wind Analysis
    if (weather.windSpeed > 25) {
        if (stageIndex >= 4 && stageIndex <= 6) {
            alerts.push({ icon: Wind, text: "High wind! Risk of lodging. Drain field to anchor roots.", color: "text-amber-600", bg: "bg-amber-50" });
        } else {
            alerts.push({ icon: Wind, text: "Windy conditions. Avoid foliar spraying.", color: "text-slate-600", bg: "bg-slate-50" });
        }
    }

    // Humidity Analysis
    if (weather.humidity > 85) {
        if (stageIndex >= 2) {
            alerts.push({ icon: Droplet, text: "High humidity. Monitor for Blast and Bacterial Leaf Blight.", color: "text-red-600", bg: "bg-red-50" });
        }
    } else if (weather.humidity < 40 && stageIndex === 4) {
        alerts.push({ icon: Droplet, text: "Low humidity. Pollen desiccation risk. Ensure water is adequate.", color: "text-amber-600", bg: "bg-amber-50" });
    }

    // Temp Analysis
    if (weather.temp > 35 && stageIndex === 4) {
        alerts.push({ icon: Thermometer, text: "Heat Stress! Flood field (Gauge >20cm) to cool canopy.", color: "text-red-600", bg: "bg-red-50" });
    }

    return alerts;
  };

  if (isEditing) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-emerald-700 font-bold">
          <Sprout size={20} />
          <h3>Crop Setup</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rice Variety</label>
            <div className="grid grid-cols-3 gap-2">
               {(['short', 'medium', 'long'] as const).map((v) => (
                 <button
                   key={v}
                   onClick={() => setVariety(v)}
                   className={`px-2 py-2 text-xs font-semibold rounded-lg border ${variety === v ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                 >
                   {v === 'short' ? 'Short' : v === 'medium' ? 'Medium' : 'Long'}
                   <span className="block text-[10px] font-normal opacity-80">
                     {v === 'short' ? '100-120d' : v === 'medium' ? '120-140d' : '140d+'}
                   </span>
                 </button>
               ))}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Transplantation Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-900"
              style={{ colorScheme: 'light' }}
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={!date}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Save size={16} /> Start Tracking
          </button>
          {config && (
             <button onClick={() => setIsEditing(false)} className="w-full text-xs text-slate-400 font-medium hover:text-slate-600">Cancel</button>
          )}
        </div>
      </div>
    );
  }

  if (!config) return null;

  const info = calculateStage(config);
  const progress = Math.min((info.days / info.totalDuration) * 100, 100);
  const weatherAlerts = weather ? getWeatherAnalysis(info.stageIndex, weather) : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full relative">
       <button 
          onClick={() => setIsEditing(true)}
          className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors border border-slate-100 z-10"
       >
          <Edit2 size={12} />
       </button>

       <div className="p-5 bg-gradient-to-b from-emerald-50/50 to-white flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-4">
             <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Sprout size={16} className="text-emerald-600" />
                    Crop Status
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{VARIETY_DATA[config.variety].name}</p>
             </div>
             <div className="text-right">
                <span className="text-2xl font-bold text-slate-800 block leading-none">{info.days}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Days Old</span>
             </div>
          </div>

          {/* Visualization */}
          <div className="flex-1 min-h-[120px] relative mb-2">
             <PaddyVisual stageIndex={info.stageIndex} />
          </div>

          <div className="mt-auto">
             <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-bold text-emerald-800">{info.stageName}</span>
                <span className="text-xs font-medium text-emerald-600">{info.phase} Phase</span>
             </div>
             
             {/* Progress Bar */}
             <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-5">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                ></div>
             </div>

             {/* Weather Impact Section */}
             {weather && (
                <div className="mb-5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Live Field Conditions</p>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                         {/* Wind */}
                         <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col items-center justify-center text-center">
                             <Wind size={14} className="text-slate-400 mb-1" />
                             <span className="text-xs font-bold text-slate-800">{weather.windSpeed}<span className="text-[9px] text-slate-400 ml-0.5">km/h</span></span>
                         </div>
                         {/* Humidity */}
                         <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col items-center justify-center text-center">
                             <Droplet size={14} className="text-slate-400 mb-1" />
                             <span className="text-xs font-bold text-slate-800">{weather.humidity}<span className="text-[9px] text-slate-400 ml-0.5">%</span></span>
                         </div>
                         {/* Temp */}
                         <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col items-center justify-center text-center">
                             <Thermometer size={14} className="text-slate-400 mb-1" />
                             <span className="text-xs font-bold text-slate-800">{weather.temp}<span className="text-[9px] text-slate-400 ml-0.5">°C</span></span>
                         </div>
                    </div>
                    
                    {/* Agronomic Weather Alerts */}
                    {weatherAlerts.map((alert, idx) => (
                         <div key={idx} className={`rounded-lg p-2.5 flex items-start gap-2.5 mb-2 ${alert.bg}`}>
                            <alert.icon size={14} className={`shrink-0 mt-0.5 ${alert.color}`} />
                            <span className={`text-xs font-medium leading-tight ${alert.color}`}>{alert.text}</span>
                         </div>
                    ))}
                </div>
             )}

             {/* Tips Section */}
             <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Management Tips</p>
                {info.managementTips.map((tip, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-start gap-2.5 hover:bg-slate-100 transition-colors">
                        <div className="p-1 bg-white rounded-md text-emerald-600 shadow-sm mt-0.5 shrink-0">
                            <tip.icon size={12} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">{tip.category}</span>
                            <span className="text-xs font-medium text-slate-700 leading-snug block">{tip.text}</span>
                        </div>
                    </div>
                ))}
             </div>

             {/* Notes Section - New Feature */}
             <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <StickyNote size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Field Notes</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                        <Smartphone size={10} /> Saved to device
                    </div>
                </div>
                <textarea
                    className="w-full text-xs p-3 bg-yellow-50/50 border border-yellow-100 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-yellow-300 resize-none font-medium placeholder-slate-400"
                    rows={3}
                    placeholder="Add notes about fertilizer application, pest observations, or field work..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleSaveNotes}
                />
             </div>
          </div>
       </div>
    </div>
  );
};
