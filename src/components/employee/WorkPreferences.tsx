
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
  preferred_shifts: ["day", "evening", "night"], // Alla pass-typer som standard
  max_shifts_per_week: 5,
  available_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], // Alla dagar inklusive helger
  available_days_strict: false, // Soft constraint som standard
  preferred_shifts_strict: false, // Soft constraint som standard
};

// Helper function to convert WorkPreferences to a Json-compatible object
const toJsonObject = (preferences: WorkPreferencesType): Record<string, Json> => {
  return {
    preferred_shifts: preferences.preferred_shifts as Json[],
    max_shifts_per_week: preferences.max_shifts_per_week as number,
    available_days: preferences.available_days as Json[],
    available_days_strict: preferences.available_days_strict as boolean,
    preferred_shifts_strict: preferences.preferred_shifts_strict as boolean
  };
};

export const WorkPreferences = ({ employeeId }: WorkPreferencesProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
    const [workPreferences, setWorkPreferences] = useState<WorkPreferencesType>(() => ({
    ...defaultPreferences,
    ...employee.work_preferences,
    // Säkerställ att de nya fälten finns
    available_days_strict: employee.work_preferences?.available_days_strict ?? false,
    preferred_shifts_strict: employee.work_preferences?.preferred_shifts_strict ?? false,
  }));

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
      setPreferences(workPreferences);
      
      return {
        work_preferences: workPreferences
      };
    }
  });

  const handleSave = async () => {
    try {
      const jsonObj = toJsonObject(preferences);
      
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
          {["day", "evening", "night"].map((shift) => (
            <div key={shift} className="flex items-center space-x-2">
              <Switch
                id={`shift-${shift}`}
                checked={preferences.preferred_shifts.includes(shift as any)}
                onCheckedChange={(checked) => {
                  setPreferences(prev => ({
                    ...prev,
                    preferred_shifts: checked
                      ? [...prev.preferred_shifts, shift as "day" | "evening" | "night"]
                      : prev.preferred_shifts.filter(s => s !== shift)
                  }));
                }}
              />
              <Label htmlFor={`shift-${shift}`}>
                {shift === "day" ? "Dagpass" : shift === "evening" ? "Kvällspass" : "Nattpass"}
              </Label>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={preferences.preferred_shifts_strict}
              onChange={(e) => {
                setPreferences(prev => ({
                  ...prev,
                  preferred_shifts_strict: e.target.checked
                }));
              }}
              className="rounded border-gray-300"
            />
            <span>
              <strong>Hårt krav:</strong> Endast schemalägg för valda pass-typer 
              <em className="text-gray-600 ml-1">(annars som preferens)</em>
            </span>
          </label>
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
          {weekdays.map(({ id, label }) => (
            <div key={id} className="flex items-center space-x-2">
              <Switch
                id={id}
                checked={preferences.available_days.includes(id)}
                onCheckedChange={(checked) => {
                  setPreferences(prev => ({
                    ...prev,
                    available_days: checked
                      ? [...prev.available_days, id]
                      : prev.available_days.filter(day => day !== id)
                  }));
                }}
              />
              <Label htmlFor={id}>{label}</Label>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={preferences.available_days_strict}
              onChange={(e) => {
                setPreferences(prev => ({
                  ...prev,
                  available_days_strict: e.target.checked
                }));
              }}
              className="rounded border-gray-300"
            />
            <span>
              <strong>Hårt krav:</strong> Schemalägg ENDAST på valda dagar 
              <em className="text-gray-600 ml-1">(annars som preferens)</em>
            </span>
          </label>
        </div>
      </div>

      <Button onClick={handleSave} className="w-full">
        Spara inställningar
      </Button>
    </Card>
  );
};
