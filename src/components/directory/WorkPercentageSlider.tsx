import { useState } from "react";
import { Label } from "@/components/ui/label";

interface WorkPercentageSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const WorkPercentageSlider = ({ 
  value, 
  onChange, 
  disabled = false 
}: WorkPercentageSliderProps) => {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Arbetstid (procent av heltid)
      </Label>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">0%</span>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {value}%
            </div>
            <div className="text-xs text-slate-500">
              {value === 0 ? 'Inte tillgänglig' : 
               value === 100 ? 'Heltid' : 
               `${(value / 20).toFixed(1)} dagar/vecka`}
            </div>
          </div>
          <span className="text-sm font-medium text-slate-600">100%</span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            disabled={disabled}
            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${value}%, #e2e8f0 ${value}%, #e2e8f0 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>
              {value === 0 ? 'Ej tillgänglig för schemaläggning' :
               value <= 20 ? 'Mycket begränsad tillgänglighet' :
               value <= 40 ? 'Deltid - begränsad tillgänglighet' :
               value <= 60 ? 'Deltid - måttlig tillgänglighet' :
               value <= 80 ? 'Deltid - hög tillgänglighet' :
               'Heltid - full tillgänglighet'}
            </span>
          </div>
        </div>
      </div>
      
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #8b5cf6;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #8b5cf6;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
        }
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
        }
      `}</style>
    </div>
  );
};
