import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings, Users, Star, Calendar, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ScheduleConfig {
  minStaffPerShift: number;
  maxStaffPerShift: number | null;
  minExperiencePerShift: number;
  includeWeekends: boolean;
  optimizeForCost: boolean;
  allowExtraStaffing: boolean;
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
    maxStaffPerShift: currentConfig.maxStaffPerShift || null,
    minExperiencePerShift: currentConfig.minExperiencePerShift || 1,
    includeWeekends: currentConfig.includeWeekends ?? true,
    optimizeForCost: currentConfig.optimizeForCost ?? false,
    allowExtraStaffing: currentConfig.allowExtraStaffing ?? false,
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

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInputChange = (key: keyof ScheduleConfig, value: number | boolean | null) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        [key]: value
      };
      
      // Sync allowExtraStaffing checkbox with maxStaffPerShift calculation
      if (key === 'allowExtraStaffing') {
        newConfig.maxStaffPerShift = value ? prev.minStaffPerShift + 1 : null;
      }
      
      // If minStaffPerShift changes and extra staffing is enabled, update max
      if (key === 'minStaffPerShift' && prev.allowExtraStaffing) {
        newConfig.maxStaffPerShift = (value as number) + 1;
      }
      
      return newConfig;
    });
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
          <p className="mt-2 text-blue-100">Enkla inställningar för schemagenereringen (nästa månad)</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          
          {/* Minimum Staff per Shift */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-blue-600" />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <label className="text-lg font-semibold text-gray-700">
                    Minimum personal per pass
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-400 hover:text-blue-600 transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          <strong>Bestämmer hur många personer som måste arbeta varje pass.</strong>
                          <br /><br />
                          • <strong>1 person:</strong> Passar för mindre enheter eller dagpass med låg aktivitet
                          <br />
                          • <strong>2 personer:</strong> Standard för de flesta vårdavdelningar, säkerställer backup
                          <br />
                          • <strong>3+ personer:</strong> För intensivvård eller enheter med höga säkerhetskrav
                          <br /><br />
                          <em>Systemet kommer schema exakt detta antal personer per pass.</em>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
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
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <label className="text-lg font-semibold text-gray-700">
                    Minimum erfarenhetspoäng per pass
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-400 hover:text-yellow-600 transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          <strong>Säkerställer tillräcklig kompetens per pass genom att summera erfarenhetspoäng.</strong>
                          <br /><br />
                          <strong>Exempel med 4 poäng krav:</strong>
                          <br />
                          ✅ 1 senior (4p) + 1 junior (1p) = 5 poäng
                          <br />
                          ✅ 2 erfarna (2p + 2p) = 4 poäng
                          <br />
                          ❌ 2 juniorer (1p + 1p) = 2 poäng
                          <br /><br />
                          <strong>Erfarenhetspoäng:</strong>
                          <br />
                          • 1p = Nybörjare
                          <br />
                          • 2p = Erfaren
                          <br />
                          • 3p = Välerfaren
                          <br />
                          • 4p = Senior
                          <br />
                          • 5p = Expert/specialist
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
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

          {/* Optimize for Cost */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <div className="flex items-center space-x-4">
              <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div className="text-lg font-semibold text-gray-700">Optimera för kostnad</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-400 hover:text-amber-600 transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          <strong>💰 Prioritera kostnadseffektivitet vid schemaläggning</strong>
                          <br /><br />
                          <strong>När aktiverat:</strong>
                          <br />
                          • Anställda med lägre timkostnad prioriteras
                          <br />
                          • Skapar ett mer kostnadseffektivt schema
                          <br />
                          • Rättvisa och täckning är fortfarande viktiga
                          <br /><br />
                          <strong>När inaktiverat:</strong>
                          <br />
                          • Kostnad ignoreras helt
                          <br />
                          • Fokus enbart på rättvisa fördelning
                          <br />
                          • Alla anställda behandlas lika oavsett lön
                          <br /><br />
                          <em>Rekommendation: Aktivera om budget är begränsad, annars inaktiverad för max rättvisa.</em>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-sm text-gray-500">Prioritera personal med lägre timkostnad</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.optimizeForCost}
                onChange={(e) => handleInputChange('optimizeForCost', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Allow Extra Staffing */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
            <div className="flex items-center space-x-4">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div className="text-lg font-semibold text-gray-700">Tillåt extra bemanning</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-400 hover:text-purple-600 transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          <strong>👥 Tillåt en extra person per skift</strong>
                          <br /><br />
                          <strong>När aktiverat:</strong>
                          <br />
                          • Max personal = Min personal + 1
                          <br />
                          • Möjliggör utbildning av juniorer
                          <br />
                          • Extra backup under högriskperioder
                          <br />
                          • Överlappning för smidigare skiftbyte
                          <br /><br />
                          <strong>När inaktiverat:</strong>
                          <br />
                          • Exakt så många som minsta kravet per skift
                          <br />
                          • Mest kostnadseffektivt
                          <br />
                          • Standard bemanning
                          <br /><br />
                          <em>Rekommendation: Aktivera vid utbildning eller högriskperioder, annars inaktiverad.</em>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-sm text-gray-500">Möjliggör överlappning, utbildning och backup</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.allowExtraStaffing}
                onChange={(e) => handleInputChange('allowExtraStaffing', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Current Settings Summary */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Sammanfattning</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
              <div className="bg-white p-3 rounded-lg">
                <div className="text-gray-500">Kostnadsoptimering</div>
                <div className="text-xl font-bold text-amber-600">
                  {config.optimizeForCost ? 'På' : 'Av'}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-gray-500">Extra bemanning</div>
                <div className="text-xl font-bold text-purple-600">
                  {config.allowExtraStaffing ? 'På' : 'Av'}
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
