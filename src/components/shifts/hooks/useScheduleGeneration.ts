import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { Shift } from "@/types/shift";
import { useScheduleSettings } from "./useScheduleSettings";
import { useProfileData } from "./useProfileData";
import { validateConstraints } from "../utils/schedulingConstraints";
import { generateScheduleForNextMonth, saveScheduleToSupabase } from "../services/scheduleGenerationService";
import { useStaffingIssues } from "./useStaffingIssues";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, addWeeks, addDays, addMonths } from "date-fns";

export const useScheduleGeneration = (currentDate: Date, currentView: 'day' | 'week' | 'month', onDateChange?: (date: Date) => void) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [generatedShifts, setGeneratedShifts] = useState<Shift[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    shifts: Shift[];
    startDate: Date;
    endDate: Date;
    staffingIssues: { date: string; shiftType: string; current: number; required: number }[];
    coverage_stats?: {
      total_shifts: number;
      filled_shifts: number;
      coverage_percentage: number;
      uncovered_count?: number;
      uncovered_shifts?: Array<{
        date: string;
        day_name: string;
        shift_type: string;
        shift_label: string;
        reasons: string[];
      }>;
      shift_type_coverage?: {
        day: { filled: number; total: number; percentage: number };
        evening: { filled: number; total: number; percentage: number };
        night: { filled: number; total: number; percentage: number };
      };
    };
  } | null>(null);
  const queryClient = useQueryClient();
  
  // Use our refactored hooks
  const { settings, isLoadingSettings } = useScheduleSettings();
  const { profiles } = useProfileData();
  const { staffingIssues, setStaffingIssues, processScheduleForStaffingIssues } = useStaffingIssues();

  const generateSchedule = async (
    config?: {
      minStaffPerShift?: number;
      maxStaffPerShift?: number | null;
      minExperiencePerShift?: number;
      includeWeekends?: boolean;
      optimizeForCost?: boolean;
    }
  ) => {
    console.log('🎯 === GENERATE SCHEDULE FUNCTION CALLED ===');
    console.log('🚀 Starting next month schedule generation');
    console.log('📊 Current state:', {
      isLoadingSettings,
      profilesCount: profiles?.length || 0,
      settingsLoaded: !!settings,
      currentDate: currentDate.toISOString(),
      profiles: profiles,
      config: config
    });

    // Check if there's already a schedule for the target month
    try {
      // Always generate for next month from today's date for predictability
      const today = new Date();
      const targetMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

      console.log('🗓️ Checking for existing schedule in target month (next month):', {
        today: today.toISOString().split('T')[0],
        targetMonth: targetMonth.toISOString().split('T')[0],
        startOfMonth: startOfMonth.toISOString().split('T')[0],
        endOfMonth: endOfMonth.toISOString().split('T')[0],
        currentView: currentDate.toISOString().split('T')[0]
      });

      const { data: existingShifts, error } = await supabase
        .from('shifts')
        .select('id')
        .gte('start_time', startOfMonth.toISOString())
        .lte('start_time', endOfMonth.toISOString())
        .limit(1);

      if (error) {
        console.error('Error checking existing shifts:', error);
      } else if (existingShifts && existingShifts.length > 0) {
        // There's already a schedule for target month
        const confirmed = window.confirm(
          'Det ligger redan ett schema för nästa månad. Vill du ersätta det nuvarande schemat?'
        );
        
        if (!confirmed) {
          console.log('User cancelled schedule generation');
          setIsGenerating(false);
          return false;
        }
        
        // Note: Actual deletion happens in generateScheduleForNextMonth
        console.log('User confirmed replacement - proceeding with generation');
      }
    } catch (error) {
      console.error('Error checking/deleting existing schedule:', error);
      toast({
        title: "Fel",
        description: "Kunde inte kontrollera befintligt schema. Försök igen.",
        variant: "destructive",
      });
      return false;
    }

    const onProgress = (step: string, progress: number) => {
      setGenerationProgress(progress);
      setProgressMessage(step);
      console.log(`📈 Progress: ${progress}% - ${step}`);
    };
    
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
    setGenerationProgress(0);
    setProgressMessage("Förbereder optimering...");
    
    try {
      console.log("🚀 Calling generateScheduleForNextMonth for better coverage");
      console.log("🔍 DEBUG: Current date:", currentDate);
      console.log("🔍 DEBUG: Profiles count:", profiles.length);
      
      // Pass the actual config from user directly instead of transforming it
      const scheduleConfig = config ? {
        minStaffPerShift: config.minStaffPerShift || 1,
        maxStaffPerShift: config.maxStaffPerShift !== undefined ? config.maxStaffPerShift : 2, // Allow extra staffing by default
        minExperiencePerShift: config.minExperiencePerShift || 1,
        includeWeekends: config.includeWeekends ?? true,
        optimizeForCost: config.optimizeForCost ?? false,
        department: 'Akutmottagning'
      } : {
        minStaffPerShift: 1, // Default to 1 staff per shift
        maxStaffPerShift: 2, // Default: allow min + 1 for flexibility
        minExperiencePerShift: 1,
        includeWeekends: true,
        optimizeForCost: false,
        department: 'Akutmottagning'
      };
      
      console.log("📊 Using schedule config for Gurobi:", scheduleConfig);
      
      // Add timestamp to ensure different results each time
      const timestamp = Date.now();
      
      // IMMEDIATELY invalidate cache so user sees empty schedule before backend processing
      console.log('🔄 Invalidating cache immediately for instant visual feedback');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
      
      // Small delay to ensure UI updates visually
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const generatedSchedule = await generateScheduleForNextMonth(
        currentDate, 
        profiles, 
        scheduleConfig, 
        timestamp,
        onProgress,
        async () => {
          // Cache invalidation callback - triggered immediately after backend clearing
          console.log('🔄 Backend cleared shifts - invalidating cache again for safety');
          await queryClient.invalidateQueries({ queryKey: ['shifts'] });
          await queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
          console.log('✅ Double cache invalidation completed');
        }
      );

      console.log("🔍 DEBUG: Next month schedule generation result:", generatedSchedule);
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
      
      console.log("Generated schedule with", generatedSchedule.schedule.length, "shifts for next month");
      
      // DON'T save shifts yet - show summary first and let user decide
      // Store the generated schedule temporarily for user approval
      
      // Calculate date range for summary using the same target month logic
      const today = new Date();
      const targetMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const summaryStartDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      summaryStartDate.setHours(0, 0, 0, 0);
      
      // Last day of the target month
      const summaryEndDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
      summaryEndDate.setHours(23, 59, 59, 999);
      
      console.log('📊 Summary date range for modal:', {
        today: today.toISOString().split('T')[0],
        targetMonth: targetMonth.toISOString().split('T')[0],
        summaryStartDate: summaryStartDate.toISOString().split('T')[0],
        summaryEndDate: summaryEndDate.toISOString().split('T')[0],
        currentView: currentDate.toISOString().split('T')[0]
      });
      
      // Set summary data and show modal - user can then accept or cancel
      setSummaryData({
        shifts: generatedSchedule.schedule,
        startDate: summaryStartDate,
        endDate: summaryEndDate,
        staffingIssues: generatedSchedule.staffingIssues || [],
        // @ts-expect-error - coverage_stats contains extended info from backend
        coverage_stats: generatedSchedule.coverage_stats
      });
      setShowSummary(true);
      
      return true;
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
      setGenerationProgress(0);
      setProgressMessage("");
    }
    return false;
  };

  // Function to accept and save the generated schedule
  const acceptSchedule = async () => {
    if (!summaryData) {
      console.error('No summary data available to accept');
      return false;
    }

    try {
      // Save the generated shifts to database
      const saveResult = await saveScheduleToSupabase(summaryData.shifts);
      
      if (saveResult) {
        toast({
          title: "Schema accepterat och sparat",
          description: `${summaryData.shifts.length} arbetspass har lagts till i schemat för nästa månad.`,
        });
        
        // Invalidate shifts query to refresh the calendar
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
        queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
        
        // 🎯 CRITICAL FIX: Navigate to next month automatically after schedule acceptance
        // This ensures user sees the generated schedule immediately in the correct month
        if (onDateChange) {
          const today = new Date();
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          console.log('🗓️ AUTO-NAVIGATING to next month after schedule acceptance:', nextMonth.toISOString().split('T')[0]);
          onDateChange(nextMonth);
        }
        
        // Close summary modal
        setShowSummary(false);
        setSummaryData(null);
        
        return true;
      } else {
        toast({
          title: "Kunde inte spara schema",
          description: "Det gick inte att spara schemat. Försök igen.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error accepting schedule:', error);
      toast({
        title: "Fel vid sparning",
        description: "Ett fel uppstod när schemat skulle sparas.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Function to cancel/reject the generated schedule
  const cancelSchedule = () => {
    // Just close the modal and discard the generated schedule
    setShowSummary(false);
    setSummaryData(null);
    toast({
      title: "Schema avbrutet",
      description: "Schemat har inte sparats.",
    });
  };

  return {
    isGenerating,
    isLoadingSettings,
    generationProgress,
    progressMessage,
    showPreview,
    setShowPreview,
    generatedShifts,
    setGeneratedShifts,
    generateSchedule,
    acceptSchedule,
    cancelSchedule,
    profiles,
    staffingIssues,
    showSummary,
    setShowSummary,
    summaryData
  };
};
