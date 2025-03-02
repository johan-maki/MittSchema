
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Shift } from "@/types/shift";
import { useScheduleSettings } from "@/hooks/useScheduleSettings";
import { useStaffProfiles } from "@/hooks/useStaffProfiles";
import { removeDuplicateShifts } from "@/utils/shifts/shiftValidation";
import { ensureMinimumStaffing } from "@/utils/shifts/staffingUtils";

export const useScheduleGeneration = (currentDate: Date, currentView: 'day' | 'week' | 'month') => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedShifts, setGeneratedShifts] = useState<Shift[]>([]);
  
  const { settings, isLoadingSettings, validateConstraints } = useScheduleSettings();
  const { profiles } = useStaffProfiles();

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
        const processedShifts = ensureMinimumStaffing(data.shifts, profiles);
        
        const uniqueShifts = removeDuplicateShifts(processedShifts);
        
        if (uniqueShifts.length < processedShifts.length) {
          console.log(`Removed ${processedShifts.length - uniqueShifts.length} duplicate shifts after staffing adjustment`);
        }
        
        setGeneratedShifts(uniqueShifts);
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
