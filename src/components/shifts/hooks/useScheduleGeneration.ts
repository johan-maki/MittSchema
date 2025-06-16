
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { Shift } from "@/types/shift";
import { useScheduleSettings } from "./useScheduleSettings";
import { useProfileData } from "./useProfileData";
import { validateConstraints } from "../utils/schedulingConstraints";
import { generateScheduleForMonth, generateScheduleForTwoWeeks, saveScheduleToSupabase } from "../services/scheduleGenerationService";
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

  const generateSchedule = async (onProgress?: (step: string, progress: number) => void) => {
    console.log('🎯 === GENERATE SCHEDULE FUNCTION CALLED ===');
    console.log('🚀 Starting two-week schedule generation');
    console.log('📊 Current state:', {
      isLoadingSettings,
      profilesCount: profiles?.length || 0,
      settingsLoaded: !!settings,
      currentDate: currentDate.toISOString(),
      profiles: profiles
    });
    
    // Show toast notification that function was called
    toast({
      title: "Schema-generering startad",
      description: "Kontrollerar medarbetare och inställningar...",
    });
    
    setStaffingIssues([]); // Reset staffing issues
    
    if (isLoadingSettings) {
      console.log('⏳ Settings are still loading');
      toast({
        title: "Laddar inställningar",
        description: "Vänta medan inställningarna laddas...",
      });
      return false;
    }

    if (!profiles || profiles.length === 0) {
      console.log('❌ No employee profiles found:', profiles);
      toast({
        title: "Inga medarbetare",
        description: "Det finns inga medarbetare i systemet. Lägg till några först.",
        variant: "destructive",
      });
      return false;
    }

    console.log('✅ About to validate constraints with profiles:', profiles.length);
    if (!validateConstraints(settings, isLoadingSettings)) {
      console.log('❌ Constraint validation failed');
      return false;
    }

    setIsGenerating(true);
    try {
      console.log("🚀 Calling generateScheduleForTwoWeeks for better coverage");
      
      // Use default settings if none are loaded (development fallback)
      const effectiveSettings = settings || {
        max_consecutive_days: 5,
        min_rest_hours: 11,
        min_weekly_rest_hours: 36,
        department: 'General',
        morning_shift: { min_staff: 3, min_experience_sum: 6 },
        afternoon_shift: { min_staff: 3, min_experience_sum: 6 },
        night_shift: { min_staff: 2, min_experience_sum: 4 }
      };
      
      console.log("📊 Using settings:", effectiveSettings);
      
      // Add timestamp to ensure different results each time
      const timestamp = Date.now();
      const generatedSchedule = await generateScheduleForTwoWeeks(
        currentDate, 
        profiles, 
        effectiveSettings, 
        timestamp,
        onProgress
      );

      console.log("Two-week schedule generation result:", generatedSchedule);
      
      if (!generatedSchedule || (!generatedSchedule.schedule || generatedSchedule.schedule.length === 0)) {
        toast({
          title: "Kunde inte generera schema",
          description: "Det gick inte att hitta en giltig schemaläggning. Försök igen.",
          variant: "destructive",
        });
        return false;
      }
      
      console.log("Generated schedule with", generatedSchedule.schedule.length, "shifts for two weeks");
      
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

  // Debug logging to see hook state
  console.log('🔗 useScheduleGeneration state:', {
    isGenerating,
    isLoadingSettings,
    profilesCount: profiles?.length || 0,
    hasSettings: !!settings
  });

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
