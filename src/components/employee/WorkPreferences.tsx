
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { WorkPreferences as WorkPreferencesType } from "@/types/profile";
import { convertWorkPreferences } from "@/types/profile";
import { WorkPreferencesService } from "@/services/workPreferencesService";
import type { Json } from "@/integrations/supabase/types";
import { Save, Clock, Calendar, Briefcase } from "lucide-react";

interface WorkPreferencesProps {
  employeeId: string;
}

const defaultPreferences: WorkPreferencesType = {
  work_percentage: 100,
  day_constraints: {
    monday: { available: true, strict: false },
    tuesday: { available: true, strict: false },
    wednesday: { available: true, strict: false },
    thursday: { available: true, strict: false },
    friday: { available: true, strict: false },
    saturday: { available: true, strict: false },
    sunday: { available: true, strict: false },
  },
  shift_constraints: {
    day: { preferred: true, strict: false },
    evening: { preferred: true, strict: false },
    night: { preferred: true, strict: false },
  },
};

export const WorkPreferences = ({ employeeId }: WorkPreferencesProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  
  const [preferences, setPreferences] = useState<WorkPreferencesType>(() => ({
    ...defaultPreferences,
  }));

  // Helper function to convert WorkPreferences to a Json-compatible object
  const toJsonObject = () => {
    return {
      work_percentage: preferences.work_percentage,
      day_constraints: preferences.day_constraints,
      shift_constraints: preferences.shift_constraints
    };
  };

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['work-preferences', employeeId],
    queryFn: async () => {
      console.log('🔄 Loading work preferences for employee:', employeeId);
      
      const { data, error } = await supabase
        .from('employees')
        .select('work_preferences')
        .eq('id', employeeId)
        .single();

      if (error) {
        console.error('❌ Error loading preferences:', error);
        throw error;
      }
      
      console.log('📄 Raw data from database:', data.work_preferences);
      
      const workPreferences = convertWorkPreferences(data.work_preferences);
      console.log('🔄 Converted preferences:', workPreferences);
      
      return {
        work_preferences: workPreferences
      };
    },
    // Prevent automatic refetch that could reset local state
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - keep data fresh but don't refetch too often
    enabled: !!employeeId // Only run query when employeeId exists
  });

  // Only update local state when data first loads, not on every refetch
  useEffect(() => {
    if (profile?.work_preferences && !profileLoading) {
      console.log('📥 Setting preferences from database:', profile.work_preferences);
      setPreferences({
        ...defaultPreferences,
        ...profile.work_preferences,
      });
    }
  }, [profile, profileLoading]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const jsonObj = toJsonObject();
      
      console.log('🔄 Saving work preferences for employee:', employeeId);
      console.log('📄 Data being saved:', JSON.stringify(jsonObj, null, 2));
      
      // Använd WorkPreferencesService för konsistent uppdatering
      await WorkPreferencesService.updateWorkPreferences(employeeId, preferences);

      console.log('✅ Successfully saved using WorkPreferencesService');

      toast({
        title: "Inställningar sparade",
        description: "Dina arbetsinställningar har uppdaterats",
      });

      // Använd centraliserad cache refresh för konsistens
      await WorkPreferencesService.refreshCache(queryClient, employeeId);
      
      // Verify the save by re-fetching
      const { data: verifyData, error: verifyError } = await supabase
        .from('employees')
        .select('work_preferences')
        .eq('id', employeeId)
        .single();
        
      if (verifyError) {
        console.error('❌ Verification failed:', verifyError);
      } else {
        console.log('🔍 Verification - data in database:', verifyData.work_preferences);
      }
      
    } catch (error: unknown) {
      console.error('❌ Error saving preferences:', error);
      toast({
        title: "Ett fel uppstod",
        description: error instanceof Error ? error.message : "Kunde inte spara inställningarna",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const shifts = [
    { id: "day", label: "Dagpass" },
    { id: "evening", label: "Kvällspass" },
    { id: "night", label: "Nattpass" },
  ];

  const weekdays = [
    { id: "monday", label: "Måndag" },
    { id: "tuesday", label: "Tisdag" },
    { id: "wednesday", label: "Onsdag" },
    { id: "thursday", label: "Torsdag" },
    { id: "friday", label: "Fredag" },
    { id: "saturday", label: "Lördag" },
    { id: "sunday", label: "Söndag" },
  ];

  // Show loading state while data is being fetched
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Laddar inställningar...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: #8b5cf6;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #8b5cf6;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
        }
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }
      `}</style>
      <div className="space-y-8">
      {/* Önskade arbetspass */}
      <Card className="p-8 shadow-lg border-0 bg-gradient-to-br from-white to-slate-50/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Briefcase className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800">Önskade arbetspass</h3>
        </div>
        <div className="grid gap-4">
          {shifts.map((shift) => (
            <div key={shift.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <Switch
                  id={`shift-${shift.id}`}
                  checked={preferences.shift_constraints[shift.id as keyof typeof preferences.shift_constraints].preferred}
                  onCheckedChange={(checked) => {
                    setPreferences(prev => ({
                      ...prev,
                      shift_constraints: {
                        ...prev.shift_constraints,
                        [shift.id]: {
                          ...prev.shift_constraints[shift.id as keyof typeof prev.shift_constraints],
                          preferred: checked
                        }
                      }
                    }));
                  }}
                />
                <Label htmlFor={`shift-${shift.id}`} className="font-medium text-slate-700 cursor-pointer">
                  {shift.label}
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={`shift-${shift.id}-strict`}
                  checked={preferences.shift_constraints[shift.id as keyof typeof preferences.shift_constraints].strict}
                  onChange={(e) => {
                    setPreferences(prev => ({
                      ...prev,
                      shift_constraints: {
                        ...prev.shift_constraints,
                        [shift.id]: {
                          ...prev.shift_constraints[shift.id as keyof typeof prev.shift_constraints],
                          strict: e.target.checked
                        }
                      }
                    }));
                  }}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                />
                <Label htmlFor={`shift-${shift.id}-strict`} className="text-sm font-medium text-slate-600 cursor-pointer">
                  Hårt krav
                </Label>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Procent av heltidstjänst */}
      <Card className="p-8 shadow-lg border-0 bg-gradient-to-br from-white to-slate-50/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Clock className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800">Procent av heltidstjänst</h3>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">0%</span>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {preferences.work_percentage}%
              </div>
              <div className="text-sm text-slate-500">
                {preferences.work_percentage === 0 ? 'Inte tillgänglig' : 
                 preferences.work_percentage === 100 ? 'Heltid' : 
                 `${(preferences.work_percentage / 20).toFixed(1)} dagar/vecka`}
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
              value={preferences.work_percentage}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                work_percentage: parseInt(e.target.value)
              }))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${preferences.work_percentage}%, #e2e8f0 ${preferences.work_percentage}%, #e2e8f0 100%)`
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
          
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>
                {preferences.work_percentage === 0 ? 'Ej tillgänglig för schemaläggning' :
                 preferences.work_percentage <= 20 ? 'Mycket begränsad tillgänglighet' :
                 preferences.work_percentage <= 40 ? 'Deltid - begränsad tillgänglighet' :
                 preferences.work_percentage <= 60 ? 'Deltid - måttlig tillgänglighet' :
                 preferences.work_percentage <= 80 ? 'Deltid - hög tillgänglighet' :
                 'Heltid - full tillgänglighet'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tillgängliga dagar */}
      <Card className="p-8 shadow-lg border-0 bg-gradient-to-br from-white to-slate-50/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Calendar className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800">Tillgängliga dagar</h3>
        </div>
        <div className="grid gap-4">
          {weekdays.map((day) => (
            <div key={day.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <Switch
                  id={`day-${day.id}`}
                  checked={preferences.day_constraints[day.id as keyof typeof preferences.day_constraints].available}
                  onCheckedChange={(checked) => {
                    setPreferences(prev => ({
                      ...prev,
                      day_constraints: {
                        ...prev.day_constraints,
                        [day.id]: {
                          ...prev.day_constraints[day.id as keyof typeof prev.day_constraints],
                          available: checked
                        }
                      }
                    }));
                  }}
                />
                <Label htmlFor={`day-${day.id}`} className="font-medium text-slate-700 cursor-pointer">
                  {day.label}
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={`day-${day.id}-strict`}
                  checked={preferences.day_constraints[day.id as keyof typeof preferences.day_constraints].strict}
                  onChange={(e) => {
                    setPreferences(prev => ({
                      ...prev,
                      day_constraints: {
                        ...prev.day_constraints,
                        [day.id]: {
                          ...prev.day_constraints[day.id as keyof typeof prev.day_constraints],
                          strict: e.target.checked
                        }
                      }
                    }));
                  }}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                />
                <Label htmlFor={`day-${day.id}-strict`} className="text-sm font-medium text-slate-600 cursor-pointer">
                  Hårt krav
                </Label>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Spara knapp */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sparar...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Spara inställningar
            </>
          )}
        </Button>
      </div>
      </div>
    </>
  );
};
