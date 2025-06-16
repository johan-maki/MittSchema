
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useScheduleSettings = () => {
  const { toast } = useToast();

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['schedule-settings'],
    queryFn: async () => {
      try {
        console.log('🔍 Starting settings query...');
        const { data, error } = await supabase
          .from('schedule_settings')
          .select('*')
          .eq('department', 'General')
          .single();

        console.log('🔍 Settings query result:', { data, error });

        if (error) {
          console.error('Error fetching settings:', error);
          
          // Only show toast for non-404 errors (404 is expected when no settings exist yet)
          if (error.code !== 'PGRST116') {
            toast({
              title: "Fel vid hämtning av inställningar",
              description: error.message,
              variant: "destructive"
            });
          }
          
          // Return default settings if not found
          console.log('🔍 Returning default settings...');
          return {
            max_consecutive_days: 5,
            min_rest_hours: 11,
            min_weekly_rest_hours: 36,
            department: 'General',
            morning_shift: {
              min_staff: 3,
              min_experience_sum: 6
            },
            afternoon_shift: {
              min_staff: 3,
              min_experience_sum: 6
            },
            night_shift: {
              min_staff: 2,
              min_experience_sum: 4
            }
          };
        }

        console.log('🔍 Fetched settings from database:', data);
        return data;
      } catch (err) {
        console.error('🔍 Unexpected error fetching settings:', err);
        console.log('🔍 Returning default settings due to error...');
        return {
          max_consecutive_days: 5,
          min_rest_hours: 11,
          min_weekly_rest_hours: 36,
          department: 'General',
          morning_shift: {
            min_staff: 3,
            min_experience_sum: 6
          },
          afternoon_shift: {
            min_staff: 3,
            min_experience_sum: 6
          },
          night_shift: {
            min_staff: 2,
            min_experience_sum: 4
          }
        };
      }
    },
  });

  return { settings, isLoadingSettings };
};
