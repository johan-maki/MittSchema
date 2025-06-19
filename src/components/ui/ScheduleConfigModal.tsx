import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings, Users, Star, Calendar } from 'lucide-react';

interface ScheduleConfig {
  minStaffPerShift: number;
  minExperiencePerShift: number;
  includeWeekends: boolean;
}

interface ScheduleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: ScheduleConfig) => void;
  currentConfig?: Partial<ScheduleConfig>;
}

export const ScheduleConfigModal: React.FC<ScheduleConfigModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentConfig = {}
}) => {
  const [config, setConfig] = useState<ScheduleConfig>({
    minStaffPerShift: currentConfig.minStaffPerShift || 1,
    minExperiencePerShift: currentConfig.minExperiencePerShift || 1,
    includeWeekends: currentConfig.includeWeekends ?? true,
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (key: keyof ScheduleConfig, value: number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleConfirm = () => {
    onConfirm(config);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6" />
              <h2 className="text-xl font-bold">Schema Inställningar</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-blue-100">Enkla inställningar för schemagenereringen</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          
          {/* Minimum Staff per Shift */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <label className="text-lg font-semibold text-gray-700">
                  Minimum personal per pass
                </label>
                <p className="text-sm text-gray-500">Minst så här många måste jobba varje pass</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1"
                max="5"
                value={config.minStaffPerShift}
                onChange={(e) => handleInputChange('minStaffPerShift', parseInt(e.target.value))}
                className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-lg font-bold min-w-[4rem] text-center">
                {config.minStaffPerShift}
              </div>
            </div>
          </div>

          {/* Minimum Experience per Shift */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Star className="h-6 w-6 text-yellow-600" />
              <div>
                <label className="text-lg font-semibold text-gray-700">
                  Minimum erfarenhetspoäng per pass
                </label>
                <p className="text-sm text-gray-500">Total erfarenhet som krävs per pass</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1"
                max="10"
                value={config.minExperiencePerShift}
                onChange={(e) => handleInputChange('minExperiencePerShift', parseInt(e.target.value))}
                className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-lg font-bold min-w-[4rem] text-center">
                {config.minExperiencePerShift}
              </div>
            </div>
          </div>

          {/* Include Weekends */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
            <div className="flex items-center space-x-4">
              <Calendar className="h-6 w-6 text-green-600" />
              <div>
                <div className="text-lg font-semibold text-gray-700">Inkludera helger</div>
                <div className="text-sm text-gray-500">Generera schema för lördagar och söndagar</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeWeekends}
                onChange={(e) => handleInputChange('includeWeekends', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Current Settings Summary */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Sammanfattning</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <div className="text-gray-500">Personal per pass</div>
                <div className="text-xl font-bold text-blue-600">{config.minStaffPerShift}</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-gray-500">Erfarenhet per pass</div>
                <div className="text-xl font-bold text-yellow-600">{config.minExperiencePerShift}</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-gray-500">Helger</div>
                <div className="text-xl font-bold text-green-600">
                  {config.includeWeekends ? 'Ja' : 'Nej'}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Generera Schema
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );

  // Use portal to render modal at document root level
  return createPortal(modalContent, document.body);
};
