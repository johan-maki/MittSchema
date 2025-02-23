
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

interface WorkPreferencesProps {
  employeeId: string;
}

interface Preferences {
  preferred_shifts: ("day" | "evening" | "night")[];
  max_shifts_per_week: number;
  available_days: string[];
}

export const WorkPreferences = ({ employeeId }: WorkPreferencesProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [preferences, setPreferences] = useState<Preferences>({
    preferred_shifts: ["day"],
    max_shifts_per_week: 5,
    available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  });

  const { data: savedPreferences, isLoading } = useQuery({
    queryKey: ['work-preferences', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('work_preferences')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      return data.work_preferences as Preferences;
    },
    onSuccess: (data) => {
      if (data) {
        setPreferences(data);
      }
    }
  });

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ work_preferences: preferences })
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
                      ? [...prev.preferred_shifts, shift as any]
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
      </div>

      <Button onClick={handleSave} className="w-full">
        Spara inställningar
      </Button>
    </Card>
  );
};
