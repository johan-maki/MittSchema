
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { Shift } from "@/types/shift";
import { useScheduleSettings } from "./useScheduleSettings";
import { useProfileData } from "./useProfileData";
import { validateConstraints } from "../utils/schedulingConstraints";
import { generateScheduleForMonth, saveScheduleToSupabase } from "../services/scheduleGenerationService";
import { useStaffingIssues } from "./useStaffingIssues";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useScheduleGeneration = (currentDate: Date, currentView: 'day' | 'week' | 'month') => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedShifts, setGeneratedShifts] = useState<Shift[]>([]);
  const queryClient = useQueryClient();
  
  // Use our refactored hooks
  const { settings, isLoadingSettings } = useScheduleSettings();
  const { profiles } = useProfileData();
  const { staffingIssues, setStaffingIssues, processScheduleForStaffingIssues } = useStaffingIssues();

  const generateSchedule = async () => {
    console.log('Starting schedule generation');
    setStaffingIssues([]); // Reset staffing issues
    
    if (isLoadingSettings) {
      console.log('Settings are still loading');
      toast({
        title: "Laddar inställningar",
        description: "Vänta medan inställningarna laddas...",
      });
      return false;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No employee profiles found');
      toast({
        title: "Inga medarbetare",
        description: "Det finns inga medarbetare i systemet. Lägg till några först.",
        variant: "destructive",
      });
      return false;
    }

    console.log('About to validate constraints');
    if (!validateConstraints(settings, isLoadingSettings)) {
      console.log('Constraint validation failed');
      return false;
    }

    setIsGenerating(true);
    try {
      console.log("Calling generateScheduleForMonth");
      // Add timestamp to ensure different results each time
      const timestamp = Date.now();
      const generatedSchedule = await generateScheduleForMonth(
        currentDate, 
        profiles, 
        settings, 
        timestamp
      );

      console.log("Schedule generation result:", generatedSchedule);
      
      if (!generatedSchedule || (!generatedSchedule.schedule || generatedSchedule.schedule.length === 0)) {
        toast({
          title: "Kunde inte generera schema",
          description: "Det gick inte att hitta en giltig schemaläggning. Försök igen.",
          variant: "destructive",
        });
        return false;
      }
      
      console.log("Generated schedule with", generatedSchedule.schedule.length, "shifts");
      
      // Save shifts directly to Supabase
      const saveResult = await saveScheduleToSupabase(generatedSchedule.schedule);
      
      if (saveResult) {
        toast({
          title: "Schema sparat",
          description: `${generatedSchedule.schedule.length} arbetspass har lagts till i schemat.`,
        });
        
        // Invalidate shifts query to refresh the calendar
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
        return true;
      } else {
        toast({
          title: "Kunde inte spara schema",
          description: "Det gick inte att spara schemat. Försök igen.",
          variant: "destructive",
        });
      }
      
      return false;
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
    profiles,
    staffingIssues
  };
};
