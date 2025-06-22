import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { Shift } from "@/types/shift";
import { useScheduleSettings } from "./useScheduleSettings";
import { useProfileData } from "./useProfileData";
import { validateConstraints } from "../utils/schedulingConstraints";
import { generateScheduleForTwoWeeks, saveScheduleToSupabase } from "../services/scheduleGenerationService";
import { useStaffingIssues } from "./useStaffingIssues";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, addWeeks, addDays } from "date-fns";

export const useScheduleGeneration = (currentDate: Date, currentView: 'day' | 'week' | 'month') => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedShifts, setGeneratedShifts] = useState<Shift[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    shifts: Shift[];
    startDate: Date;
    endDate: Date;
    staffingIssues: { date: string; shiftType: string; current: number; required: number }[];
  } | null>(null);
  const queryClient = useQueryClient();
  
  // Use our refactored hooks
  const { settings, isLoadingSettings } = useScheduleSettings();
  const { profiles } = useProfileData();
  const { staffingIssues, setStaffingIssues, processScheduleForStaffingIssues } = useStaffingIssues();

  const generateSchedule = async (
    config?: {
      minStaffPerShift?: number;
      minExperiencePerShift?: number;
      includeWeekends?: boolean;
    },
    onProgress?: (step: string, progress: number) => void
  ) => {
    console.log('🎯 === GENERATE SCHEDULE FUNCTION CALLED ===');
    console.log('🚀 Starting two-week schedule generation');
    console.log('📊 Current state:', {
      isLoadingSettings,
      profilesCount: profiles?.length || 0,
      settingsLoaded: !!settings,
      currentDate: currentDate.toISOString(),
      profiles: profiles,
      config: config
    });
    
    // Show toast notification that function was called
    toast({
      title: "Schema-generering startad",
      description: config 
        ? `Använder anpassade inställningar: ${config.minStaffPerShift} personal/pass, ${config.minExperiencePerShift} erfarenhetspoäng` 
        : "Kontrollerar medarbetare och inställningar...",
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
      console.log("🔍 DEBUG: Current date:", currentDate);
      console.log("🔍 DEBUG: Profiles count:", profiles.length);
      
      // Simplified settings for basic scheduling
      const effectiveSettings = config ? {
        max_consecutive_days: 5, // Fixed for simplicity
        min_rest_hours: 11, // Fixed for simplicity
        min_weekly_rest_hours: 36,
        department: 'Akutmottagning', // All employees work here now
        include_weekends: config.includeWeekends ?? true,
        morning_shift: { 
          min_staff: config.minStaffPerShift || 1, 
          min_experience_sum: config.minExperiencePerShift || 1 
        },
        afternoon_shift: { 
          min_staff: config.minStaffPerShift || 1, 
          min_experience_sum: config.minExperiencePerShift || 1 
        },
        night_shift: { 
          min_staff: config.minStaffPerShift || 1, 
          min_experience_sum: config.minExperiencePerShift || 1 
        }
      } : {
        max_consecutive_days: 5,
        min_rest_hours: 11,
        min_weekly_rest_hours: 36,
        department: 'Akutmottagning',
        include_weekends: true,
        morning_shift: { min_staff: 1, min_experience_sum: 1 },
        afternoon_shift: { min_staff: 1, min_experience_sum: 1 },
        night_shift: { min_staff: 1, min_experience_sum: 1 }
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

      console.log("🔍 DEBUG: Two-week schedule generation result:", generatedSchedule);
      console.log("🔍 DEBUG: generatedSchedule type:", typeof generatedSchedule);
      console.log("🔍 DEBUG: generatedSchedule truthy:", !!generatedSchedule);
      console.log("🔍 DEBUG: generatedSchedule.schedule:", generatedSchedule?.schedule);
      console.log("🔍 DEBUG: generatedSchedule.schedule type:", typeof generatedSchedule?.schedule);
      console.log("🔍 DEBUG: generatedSchedule.schedule length:", generatedSchedule?.schedule?.length);
      
      if (!generatedSchedule) {
        console.error("❌ No generatedSchedule returned");
        toast({
          title: "Kunde inte generera schema",
          description: "Ingen respons från schemagenereringen. Försök igen.",
          variant: "destructive",
        });
        return false;
      }
      
      if (!generatedSchedule.schedule) {
        console.error("❌ No schedule property in generatedSchedule:", generatedSchedule);
        toast({
          title: "Kunde inte generera schema", 
          description: "Felaktigt format från schemagenereringen. Försök igen.",
          variant: "destructive",
        });
        return false;
      }
      
      if (generatedSchedule.schedule.length === 0) {
        console.error("❌ Empty schedule array in generatedSchedule:", generatedSchedule);
        toast({
          title: "Kunde inte generera schema",
          description: "Inga skift genererade. Kontrollera begränsningar och försök igen.",
          variant: "destructive",
        });
        return false;
      }
      
      console.log("Generated schedule with", generatedSchedule.schedule.length, "shifts for two weeks");
      
      // Save shifts directly to Supabase
      const saveResult = await saveScheduleToSupabase(generatedSchedule.schedule);
      
      if (saveResult) {
        // Calculate date range for summary - from today for 2 weeks
        const summaryStartDate = new Date();
        summaryStartDate.setHours(0, 0, 0, 0);
        const summaryEndDate = addDays(summaryStartDate, 13);
        
        // Set summary data and show modal
        setSummaryData({
          shifts: generatedSchedule.schedule,
          startDate: summaryStartDate,
          endDate: summaryEndDate,
          staffingIssues: generatedSchedule.staffingIssues || []
        });
        setShowSummary(true);
        
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
      
      // More specific error messages for Gurobi connection issues
      let errorMessage = "Ett oväntat fel uppstod vid schemagenerering.";
      let errorTitle = "Schemagenerering misslyckades";
      
      if (error instanceof Error) {
        if (error.message.includes('Unable to connect to Gurobi')) {
          errorTitle = "Kan inte ansluta till Gurobi";
          errorMessage = "Kunde inte ansluta till Gurobi-optimeraren. Kontrollera internetanslutning och försök igen.";
        } else if (error.message.includes('Gurobi optimizer could not generate')) {
          errorTitle = "Schemagenerering misslyckades";
          errorMessage = "Gurobi kunde inte generera ett schema med nuvarande begränsningar. Kontrollera personalens tillgänglighet och försök igen.";
        } else if (error.message.includes('No employees available')) {
          errorTitle = "Inga medarbetare tillgängliga";
          errorMessage = "Det finns inga medarbetare tillgängliga för schemaläggning. Lägg till medarbetare först.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
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
    staffingIssues,
    showSummary,
    setShowSummary,
    summaryData
  };
};
