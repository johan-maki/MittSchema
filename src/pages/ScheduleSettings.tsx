
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import type { ScheduleSettings } from "@/types/scheduleSettings";
import { toast } from "sonner";

export default function ScheduleSettings() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ScheduleSettings>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['schedule-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_settings')
        .select('*')
        .eq('department', 'Default')
        .single();

      if (error) throw error;
      return data as ScheduleSettings;
    }
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<ScheduleSettings>) => {
      const { data, error } = await supabase
        .from('schedule_settings')
        .update(newSettings)
        .eq('id', settings?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-settings'] });
      setIsEditing(false);
      toast.success("Inställningarna har sparats");
    },
    onError: (error) => {
      toast.error("Kunde inte spara inställningarna: " + error.message);
    }
  });

  const handleEdit = () => {
    setFormData(settings || {});
    setIsEditing(true);
  };

  const handleSave = () => {
    updateSettings.mutate(formData);
  };

  const handleInputChange = (field: string, subfield: string | null, value: any) => {
    if (subfield) {
      setFormData(prev => ({
        ...prev,
        [field]: {
          ...(prev as any)?.[field],
          [subfield]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Schemainställningar</h1>
          {!isEditing ? (
            <Button onClick={handleEdit}>Redigera inställningar</Button>
          ) : (
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Avbryt</Button>
              <Button onClick={handleSave}>Spara ändringar</Button>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Grundläggande inställningar</CardTitle>
            <CardDescription>
              Ange grundläggande regler för schemaläggning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_consecutive_days">Max antal arbetsdagar i rad</Label>
                <Input
                  id="max_consecutive_days"
                  type="number"
                  value={isEditing ? formData.max_consecutive_days : settings?.max_consecutive_days}
                  onChange={(e) => handleInputChange('max_consecutive_days', null, parseInt(e.target.value))}
                  disabled={!isEditing}
                  min={1}
                  max={7}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_rest_hours">Minsta vilotid mellan pass (timmar)</Label>
                <Input
                  id="min_rest_hours"
                  type="number"
                  value={isEditing ? formData.min_rest_hours : settings?.min_rest_hours}
                  onChange={(e) => handleInputChange('min_rest_hours', null, parseInt(e.target.value))}
                  disabled={!isEditing}
                  min={11}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="require_night_shift_qualification"
                checked={isEditing ? formData.require_night_shift_qualification : settings?.require_night_shift_qualification}
                onCheckedChange={(checked) => handleInputChange('require_night_shift_qualification', null, checked)}
                disabled={!isEditing}
              />
              <Label htmlFor="require_night_shift_qualification">
                Kräv nattjoursutbildning för nattpass
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passinställningar</CardTitle>
            <CardDescription>
              Konfigurera tider och krav för olika arbetspass
            </CardDescription>
          </CardHeader>
          <CardContent>
            {['morning', 'afternoon', 'night'].map((shift) => (
              <div key={shift} className="mb-6 last:mb-0">
                <h3 className="font-semibold mb-4 capitalize">
                  {shift === 'morning' ? 'Dagpass' : shift === 'afternoon' ? 'Kvällspass' : 'Nattpass'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${shift}_start`}>Starttid</Label>
                    <Input
                      id={`${shift}_start`}
                      type="time"
                      value={isEditing ? formData[`${shift}_shift`]?.start_time : settings?.[`${shift}_shift`].start_time}
                      onChange={(e) => handleInputChange(`${shift}_shift`, 'start_time', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${shift}_end`}>Sluttid</Label>
                    <Input
                      id={`${shift}_end`}
                      type="time"
                      value={isEditing ? formData[`${shift}_shift`]?.end_time : settings?.[`${shift}_shift`].end_time}
                      onChange={(e) => handleInputChange(`${shift}_shift`, 'end_time', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${shift}_min_staff`}>Minsta antal personal</Label>
                    <Input
                      id={`${shift}_min_staff`}
                      type="number"
                      value={isEditing ? formData[`${shift}_shift`]?.min_staff : settings?.[`${shift}_shift`].min_staff}
                      onChange={(e) => handleInputChange(`${shift}_shift`, 'min_staff', parseInt(e.target.value))}
                      disabled={!isEditing}
                      min={1}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
