
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useScheduleSettings = () => {
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

  return { settings, isLoadingSettings };
};
