
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

  const { data: profile } = useQuery({
    queryKey: ['work-preferences', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('work_preferences')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      
      const workPreferences = convertWorkPreferences(data.work_preferences);
      setPreferences({
        ...defaultPreferences,
        ...workPreferences,
      });
      
      return {
        work_preferences: workPreferences
      };
    }
  });

  const handleSave = async () => {
    try {
      const jsonObj = toJsonObject();
      
      const { error } = await supabase
        .from('employees')
        .update({
          work_preferences: jsonObj
        })
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: "Inställningar sparade",
        description: "Dina arbetsinställningar har uppdaterats",
      });

      queryClient.invalidateQueries({ queryKey: ['work-preferences'] });
    } catch (error) {
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte spara inställningarna",
        variant: "destructive",
      });
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

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Önskade arbetspass</h3>
        <div className="space-y-4">
          {shifts.map((shift) => (
            <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
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
                <Label htmlFor={`shift-${shift.id}`} className="font-medium">
                  {shift.label}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
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
                  className="rounded border-gray-300"
                />
                <Label htmlFor={`shift-${shift.id}-strict`} className="text-sm text-gray-600">
                  Hårt krav
                </Label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Max antal pass per vecka</h3>
        <Select
          value={preferences.max_shifts_per_week.toString()}
          onValueChange={(value) => 
            setPreferences(prev => ({
              ...prev,
              max_shifts_per_week: parseInt(value)
            }))
          }
        >
          <SelectTrigger className="w-[180px]">
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
      </div>

            <div>
        <h3 className="text-lg font-medium mb-4">Tillgängliga dagar</h3>
        <div className="space-y-4">
          {weekdays.map((day) => (
            <div key={day.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
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
                <Label htmlFor={`day-${day.id}`} className="font-medium">
                  {day.label}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
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
                  className="rounded border-gray-300"
                />
                <Label htmlFor={`day-${day.id}-strict`} className="text-sm text-gray-600">
                  Hårt krav
                </Label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} className="w-full">
        Spara inställningar
      </Button>
    </Card>
  );
};
