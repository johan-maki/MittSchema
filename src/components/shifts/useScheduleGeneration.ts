
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Shift } from "@/types/shift";
import { convertDatabaseProfile } from "@/types/profile";
import type { DatabaseProfile } from "@/types/profile";

export const useScheduleGeneration = (currentDate: Date, currentView: 'day' | 'week' | 'month') => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedShifts, setGeneratedShifts] = useState<Shift[]>([]);

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

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }

      const convertedProfiles = (data as DatabaseProfile[] || []).map(convertDatabaseProfile);
      console.log('Fetched and converted profiles:', convertedProfiles);
      return convertedProfiles;
    }
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

  const generateSchedule = async () => {
    console.log('Starting schedule generation');
    
    if (isLoadingSettings) {
      console.log('Settings are still loading');
      toast({
        title: "Laddar inställningar",
        description: "Vänta medan inställningarna laddas...",
      });
      return false;
    }

    console.log('About to validate constraints');
    if (!validateConstraints()) {
      console.log('Constraint validation failed');
      return false;
    }

    setIsGenerating(true);
    try {
      console.log('Calling generate-schedule function with:', {
        settings,
        profiles,
        currentDate: currentDate.toISOString(),
        view: currentView
      });

      const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: {
          settings,
          profiles,
          currentDate: currentDate.toISOString(),
          view: currentView
        }
      });

      if (error) throw error;

      console.log('Generate schedule response:', data);

      if (data?.shifts?.length > 0) {
        setGeneratedShifts(data.shifts);
        setShowPreview(true);
        return true;
      } else {
        console.log('No shifts generated');
        toast({
          title: "Kunde inte generera schema",
          description: "Det gick inte att hitta en giltig schemaläggning med nuvarande begränsningar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte generera schema. Kontrollera begränsningar och försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
    return false;
  };

  return {
    isGenerating,
    isLoadingSettings,
    showPreview,
    setShowPreview,
    generatedShifts,
    setGeneratedShifts,
    generateSchedule,
    profiles
  };
};
