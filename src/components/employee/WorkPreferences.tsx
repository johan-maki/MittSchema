
import { useState } from "react";
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
import type { Json } from "@/integrations/supabase/types";
import { Save, Clock, Calendar, Briefcase } from "lucide-react";

interface WorkPreferencesProps {
  employeeId: string;
}

const defaultPreferences: WorkPreferencesType = {
  max_shifts_per_week: 5,
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
      max_shifts_per_week: preferences.max_shifts_per_week,
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
      
      // Update state synchronously after conversion
      setPreferences({
        ...defaultPreferences,
        ...workPreferences,
      });
      
      return {
        work_preferences: workPreferences
      };
    },
    enabled: !!employeeId // Only run query when employeeId exists
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const jsonObj = toJsonObject();
      
      console.log('🔄 Saving work preferences for employee:', employeeId);
      console.log('📄 Data being saved:', JSON.stringify(jsonObj, null, 2));
      
      const { data, error } = await supabase
        .from('employees')
        .update({
          work_preferences: jsonObj
        })
        .eq('id', employeeId)
        .select('work_preferences');

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Successfully saved to database:', data);

      toast({
        title: "Inställningar sparade",
        description: "Dina arbetsinställningar har uppdaterats",
      });

      // Invalidate multiple cache keys to ensure consistency
      await queryClient.invalidateQueries({ queryKey: ['work-preferences'] });
      await queryClient.invalidateQueries({ queryKey: ['employee-profile', employeeId] });
      await queryClient.invalidateQueries({ queryKey: ['all-employees'] });
      
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

      {/* Max antal pass per vecka */}
      <Card className="p-8 shadow-lg border-0 bg-gradient-to-br from-white to-slate-50/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Clock className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800">Max antal pass per vecka</h3>
        </div>
        <Select
          value={preferences.max_shifts_per_week.toString()}
          onValueChange={(value) => 
            setPreferences(prev => ({
              ...prev,
              max_shifts_per_week: parseInt(value)
            }))
          }
        >
          <SelectTrigger className="w-48 h-12 bg-white border-slate-200 hover:border-slate-300 transition-colors">
            <SelectValue placeholder="Välj antal pass" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} pass
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
  );
};
