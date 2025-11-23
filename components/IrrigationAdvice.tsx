import React, { useState } from 'react';
import { Droplets, Check, CloudRain, AlertTriangle, ArrowDown, Sprout, Info, Lightbulb } from 'lucide-react';
import { WeatherData } from '../services/weatherService';

interface Props {
  level: number;
  weather: WeatherData | null;
  cropStage?: {
    name: string;
    index: number;
  };
  plotName?: string;
}

export const IrrigationAdvice: React.FC<Props> = ({ level, weather, cropStage, plotName }) => {
  const [showRationale, setShowRationale] = useState(false);

  // --- Constants & Thresholds ---
  // Sensor Depth Mapping:
  // 0cm = Bottom of pipe (Dry)
  // 15cm = Soil Surface
  // 30cm = Top of gauge
  
  const SOIL_LEVEL = 15;
  
  // User Defined Rules (Absolute Gauge Readings)
  const THRESHOLD_LOW = 5;  // Gauge < 5cm (Very Dry)
  const THRESHOLD_HIGH = 20; // Gauge > 20cm (High Water)

  // Weather Factors
  const rainChance = weather?.rainChance || 0;
  const rainForecast = weather?.rainForecast24h || 0;
  // Consider rain "Expected" if chance > 50% OR significant volume (>5mm)
  const isRainExpected = rainChance > 50 || rainForecast > 5; 
  const isHighHeat = (weather?.temp || 0) > 35;

  // Advice State
  let advice = {
    type: 'good' as 'good' | 'warn' | 'critical' | 'info',
    text: 'Levels Optimal',
    subtext: 'Monitoring...',
    rationale: 'Water levels are within the target range.',
    smartTip: null as string | null,
    icon: <Check size={16} />
  };

  const setAdvice = (
      type: 'good' | 'warn' | 'critical' | 'info', 
      text: string, 
      subtext: string, 
      rationale: string, 
      tip: string | null, 
      icon: React.ReactNode
  ) => {
    advice = { type, text, subtext, rationale, smartTip: tip, icon };
  };

  // --- Decision Logic Helpers ---

  const adviseLowWater = (stageName: string) => {
      if (isRainExpected) {
          setAdvice(
              'warn',
              'Wait for Rain',
              `Rain chance ${rainChance}%.`,
              `Current Gauge: ${level}cm. With ${rainForecast}mm rain forecast, delay irrigation to save water.`,
              'Monitor level closely. If rain misses, irrigate.',
              <CloudRain size={16} />
          );
      } else {
          setAdvice(
              'critical', // Always critical if below 5cm and no rain
              'Irrigate Now',
              `Level ${level}cm (Low)`,
              `Gauge reads ${level}cm, which is critically low (<${THRESHOLD_LOW}cm) for ${stageName}. Risk of soil cracking.`,
              'Fill to Gauge 15cm+ (Soil Surface) immediately.',
              <Droplets size={16} />
          );
      }
  };

  const adviseHighWater = () => {
      if (isRainExpected) {
          setAdvice(
              'warn',
              'Drain Excess',
              `Rain Expected.`,
              `Gauge is at ${level}cm. Rain will increase this further. Drain to ~15cm to prevent overflow.`,
              'Lower spillways to 15cm level.',
              <ArrowDown size={16} />
          );
      } else {
           setAdvice(
              'info',
              'Stop Irrigating',
              `Level ${level}cm (High)`,
              `Water is deep (Gauge >${THRESHOLD_HIGH}cm). Further irrigation is wasteful.`,
              'Allow water to subside naturally.',
              <ArrowDown size={16} />
          );
      }
  };

  // --- Main Evaluation ---

  const evaluate = () => {
    // 1. Get Stage Info
    const stageIndex = cropStage?.index ?? 1; // Default to Tillering (1) logic if unknown
    const stageName = cropStage?.name ?? "Vegetative";

    // 2. Identify Stage Sensitivity
    // Stages 3 (Booting) and 4 (Flowering) need FLOOD (>15cm Gauge)
    // Stage 0 (Establishment) needs SATURATION (>15cm Gauge)
    const needsFlood = [0, 3, 4].includes(stageIndex);
    const allowAWD = [1, 2, 5].includes(stageIndex);
    const needsDrain = [6, 7].includes(stageIndex);

    // 3. Apply Logic Priorities
    
    // PRIORITY 1: Harvest / Drain Stages
    // If field needs to be dry, any water > 15cm is bad.
    if (needsDrain) {
        if (level > SOIL_LEVEL) {
            return setAdvice('warn', 'Drain Field', 'Prepare harvest.', 'Field should be dry (Gauge <15cm) for ripening.', 'Open all drainage outlets.', <ArrowDown size={16} />);
        } else {
            return setAdvice('good', 'Ready', 'Field dry.', 'Conditions optimal for harvest.', null, <Sprout size={16} />);
        }
    }

    // PRIORITY 2: High Water Rule (>20cm)
    if (level > THRESHOLD_HIGH) { 
        return adviseHighWater();
    }

    // PRIORITY 3: Critical Low Water Rule (<5cm)
    if (level < THRESHOLD_LOW) {
        return adviseLowWater(stageName);
    }

    // PRIORITY 4: Intermediate Levels (5cm to 20cm)
    
    // A: Stages requiring Flood (Establishment, Booting, Flowering)
    if (needsFlood) {
        if (level < SOIL_LEVEL) { // 5cm to 15cm Gauge
            if (isRainExpected) {
                 return setAdvice('warn', 'Wait for Rain', `Rain chance ${rainChance}%.`, `Gauge (${level}cm) is below soil surface, but rain is likely.`, null, <CloudRain size={16} />);
            } else {
                 return setAdvice('warn', 'Increase Level', 'Target Gauge 15cm+.', `Stage ${stageName} requires standing water (Gauge >15cm).`, 'Top up to 17-18cm.', <Droplets size={16} />);
            }
        } else {
             // 15cm to 20cm -> Perfect
             return setAdvice('good', 'Optimal Flood', 'Maintained.', `Gauge level (${level}cm) is ideal for ${stageName}.`, isHighHeat ? 'Flood helps cool the canopy.' : null, <Check size={16} />);
        }
    }

    // B: Stages allowing AWD (Tillering, Elongation, Filling)
    if (allowAWD) {
        if (level < SOIL_LEVEL) { // 5cm to 15cm Gauge
             // This is the AWD "Safe Drying" zone
             return setAdvice('info', 'AWD Active', 'Soil drying.', 'Water is below soil surface (Gauge <15cm) but safe. Promotes root depth.', 'Monitor for soil cracks.', <ArrowDown size={16} />);
        } else {
             // 15cm to 20cm
             return setAdvice('good', 'Levels Good', 'Saturated.', 'Water availability is adequate (Gauge >15cm).', null, <Check size={16} />);
        }
    }
  };

  evaluate();

  // Visual Styles
  const colors = {
    good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    critical: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const iconColors = {
    good: 'bg-emerald-200/50',
    warn: 'bg-amber-200/50',
    critical: 'bg-red-200/50',
    info: 'bg-blue-200/50',
  };

  return (
    <div className="mt-3">
        <div 
            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border ${colors[advice.type]} transition-all cursor-pointer hover:shadow-sm`}
            onClick={() => setShowRationale(!showRationale)}
        >
             <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-full ${iconColors[advice.type]} shrink-0`}>
                    {advice.icon}
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-tight leading-tight">{advice.text}</span>
                    <span className="text-[10px] opacity-90 font-medium leading-tight">{advice.subtext}</span>
                </div>
             </div>
             <Info size={14} className="opacity-50 hover:opacity-100" />
        </div>
        
        {showRationale && (
            <div className={`mt-1 p-3 rounded-lg text-[10px] leading-relaxed animate-in fade-in slide-in-from-top-1 ${colors[advice.type].replace('bg-', 'bg-opacity-40 bg-')}`}>
                <div className="flex gap-1.5 mb-1.5">
                    <span className="font-bold uppercase opacity-70">Analysis:</span>
                    <span className="font-medium">{advice.rationale}</span>
                </div>
                
                {advice.smartTip && (
                    <div className="pt-2 border-t border-black/5 flex gap-1.5 items-start text-emerald-900/80">
                         <Lightbulb size={12} className="shrink-0 mt-0.5" />
                         <span className="italic font-medium">{advice.smartTip}</span>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};