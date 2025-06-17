import React, { useState, useEffect } from 'react';
import { X, Settings, Users, Star, Clock, Calendar } from 'lucide-react';

interface ScheduleConfig {
  minStaffPerDay: number;
  minExperiencePerDay: number;
  maxConsecutiveDays: number;
  minRestHours: number;
  includeWeekends: boolean;
  prioritizeExperience: boolean;
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
    minStaffPerDay: currentConfig.minStaffPerDay || 3,
    minExperiencePerDay: currentConfig.minExperiencePerDay || 8,
    maxConsecutiveDays: currentConfig.maxConsecutiveDays || 5,
    minRestHours: currentConfig.minRestHours || 11,
    includeWeekends: currentConfig.includeWeekends ?? true,
    prioritizeExperience: currentConfig.prioritizeExperience ?? false,
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

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

  const handleConfirm = () => {
    console.log('🎯 Schedule config confirmed:', config);
    onConfirm(config);
    onClose();
  };

  const handleInputChange = (field: keyof ScheduleConfig, value: number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Schema Inställningar</h2>
                <p className="text-blue-100 text-sm">Anpassa ditt schema</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'basic'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Grundläggande
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'advanced'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Avancerat
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === 'basic' && (
            <>
              {/* Minimum Staff */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <label className="text-sm font-medium text-gray-700">
                    Minimum personal per dag
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={config.minStaffPerDay}
                    onChange={(e) => handleInputChange('minStaffPerDay', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium min-w-[3rem] text-center">
                    {config.minStaffPerDay}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Minimum antal anställda som måste vara schemalagda varje dag
                </p>
              </div>

              {/* Minimum Experience */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <label className="text-sm font-medium text-gray-700">
                    Minimum erfarenhetspoäng per dag
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="3"
                    max="20"
                    value={config.minExperiencePerDay}
                    onChange={(e) => handleInputChange('minExperiencePerDay', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm font-medium min-w-[3rem] text-center">
                    {config.minExperiencePerDay}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Total erfarenhetsnivå som krävs för att säkerställa kvalitet
                </p>
              </div>

              {/* Include Weekends */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Inkludera helger</div>
                    <div className="text-xs text-gray-500">Schema för lördagar och söndagar</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeWeekends}
                    onChange={(e) => handleInputChange('includeWeekends', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </>
          )}

          {activeTab === 'advanced' && (
            <>
              {/* Max Consecutive Days */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <label className="text-sm font-medium text-gray-700">
                    Max antal dagar i rad
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="3"
                    max="7"
                    value={config.maxConsecutiveDays}
                    onChange={(e) => handleInputChange('maxConsecutiveDays', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-sm font-medium min-w-[3rem] text-center">
                    {config.maxConsecutiveDays}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Maximum antal dagar en anställd kan jobba i följd
                </p>
              </div>

              {/* Min Rest Hours */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-indigo-600" />
                  <label className="text-sm font-medium text-gray-700">
                    Minimum vila mellan pass (timmar)
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="8"
                    max="16"
                    value={config.minRestHours}
                    onChange={(e) => handleInputChange('minRestHours', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg text-sm font-medium min-w-[3rem] text-center">
                    {config.minRestHours}h
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Minimum viloperiod mellan arbetspass för att följa arbetsmiljölagen
                </p>
              </div>

              {/* Prioritize Experience */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Prioritera erfarenhet</div>
                    <div className="text-xs text-gray-500">Schemalägg erfarna medarbetare först</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.prioritizeExperience}
                    onChange={(e) => handleInputChange('prioritizeExperience', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Generera Schema
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};
