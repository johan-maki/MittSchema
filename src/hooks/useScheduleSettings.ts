
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useScheduleSettings = () => {
  const { toast } = useToast();

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['schedule-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_settings')
        .select('*')
        .eq('department', 'General')
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        throw error;
      }

      console.log('Fetched settings:', data);
      return data;
    },
  });

  const validateConstraints = () => {
    console.log('Validating constraints with settings:', settings);
    console.log('Loading state:', isLoadingSettings);

    if (isLoadingSettings) {
      console.log('Settings are still loading');
      return true;
    }

    if (!settings) {
      console.log('No settings found');
      toast({
        title: "Inställningar saknas",
        description: "Vänligen konfigurera schemaläggningsinställningar först.",
        variant: "destructive",
      });
      return false;
    }

    // Check basic constraints
    if (!settings.max_consecutive_days || !settings.min_rest_hours) {
      console.log('Missing basic constraints:', {
        max_consecutive_days: settings.max_consecutive_days,
        min_rest_hours: settings.min_rest_hours
      });
      toast({
        title: "Ofullständiga inställningar",
        description: "Vänligen kontrollera att alla grundläggande begränsningar är konfigurerade.",
        variant: "destructive",
      });
      return false;
    }

    // Check shift settings
    const shifts = ['morning_shift', 'afternoon_shift', 'night_shift'] as const;
    for (const shift of shifts) {
      const shiftSettings = settings[shift];
      console.log(`Checking ${shift} settings:`, shiftSettings);
      
      if (!shiftSettings?.min_staff || !shiftSettings?.min_experience_sum) {
        console.log(`Invalid settings for ${shift}:`, shiftSettings);
        toast({
          title: "Ofullständiga skiftinställningar",
          description: `Vänligen kontrollera inställningarna för ${shift}.`,
          variant: "destructive",
        });
        return false;
      }
    }

    console.log('All constraints validated successfully');
    return true;
  };

  return {
    settings,
    isLoadingSettings,
    validateConstraints
  };
};
