import React from 'react';

interface Props {
  level: number;
  max?: number;
}

export const AWDGauge: React.FC<Props> = ({ level, max = 30 }) => {
  // level is 0-30cm absolute reading from the sensor
  // 15cm is assumed to be the Soil Surface based on AWD pipe installation
  
  // Clamp percentage for bar height
  const percent = Math.min(Math.max((level / max) * 100, 0), 100);

  return (
    <div className="flex items-center h-28 gap-3 select-none">
       {/* Visual Pipe */}
       <div className="relative h-full w-8 bg-slate-50 rounded-full border-2 border-slate-200 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] shrink-0">
           {/* Soil Section (Bottom 50%) */}
           <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#d6d3d1]/30 border-t border-emerald-500/30">
                {/* Soil hatching pattern */}
                <div className="w-full h-full opacity-20" 
                     style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #78716c 0, #78716c 1px, transparent 0, transparent 6px)' }}>
                </div>
           </div>

           {/* Water Fill */}
           <div 
                className="absolute bottom-0 left-0 right-0 bg-blue-500/80 transition-all duration-1000 ease-out border-t border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                style={{ height: `${percent}%` }}
           >
                {/* Water reflection/glint */}
                <div className="absolute top-0 left-1 right-1 h-full bg-gradient-to-r from-white/30 to-transparent"></div>
                {/* Meniscus */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/60"></div>
           </div>

           {/* Soil Surface Marker Line (Fixed at 50%) */}
           <div className="absolute bottom-1/2 left-0 right-0 h-[1px] bg-emerald-500 z-10 w-full"></div>
       </div>

       {/* Scale Labels */}
       <div className="flex flex-col justify-between py-1 text-[9px] font-bold text-slate-400 uppercase font-mono h-full">
          <span className="leading-none text-slate-300 translate-y-[-2px]">30</span>
          
          <div className="flex items-center gap-1 text-emerald-600">
             <div className="w-1.5 h-[1.5px] bg-emerald-500"></div>
             <span>Soil</span>
          </div>

          <span className="leading-none text-slate-300 translate-y-[2px]">0</span>
       </div>
    </div>
  );
};