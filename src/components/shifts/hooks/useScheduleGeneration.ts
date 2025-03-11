
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { Shift } from "@/types/shift";
import { useScheduleSettings } from "./useScheduleSettings";
import { useProfileData } from "./useProfileData";
import { validateConstraints } from "../utils/schedulingConstraints";
import { checkStaffingRequirements, type StaffingIssue } from "../utils/staffingUtils";
import { ensureMinimumStaffing, removeDuplicateShifts } from "../utils/staffingAdjustment";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { schedulerApi } from "@/api/schedulerApi";

export const useScheduleGeneration = (currentDate: Date, currentView: 'day' | 'week' | 'month') => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedShifts, setGeneratedShifts] = useState<Shift[]>([]);
  const [staffingIssues, setStaffingIssues] = useState<StaffingIssue[]>([]);
  
  const { settings, isLoadingSettings } = useScheduleSettings();
  const { profiles } = useProfileData();

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
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      console.log('Calling optimization API with dates:', {
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString()
      });

      // First try the API, then fall back to local generation if it fails
      let generatedSchedule = null;
      try {
        generatedSchedule = await schedulerApi.generateSchedule(
          monthStart.toISOString(),
          monthEnd.toISOString(),
          settings?.department || 'General'
        );
        console.log('Schedule optimization response:', generatedSchedule);
      } catch (apiError) {
        console.error('Both API and edge function failed, falling back to local generation', apiError);
        // Generate a basic schedule locally as a fallback
        generatedSchedule = await generateBasicSchedule(monthStart, monthEnd, profiles, settings);
      }

      if (generatedSchedule?.schedule?.length > 0) {
        const issues = checkStaffingRequirements(generatedSchedule.schedule, settings);
        setStaffingIssues(issues);
        
        const processedShifts = ensureMinimumStaffing(generatedSchedule.schedule, profiles);
        const uniqueShifts = removeDuplicateShifts(processedShifts);
        
        setGeneratedShifts(uniqueShifts);
        setShowPreview(true);
        
        if (issues.length > 0) {
          toast({
            title: "Bemanningsvarning",
            description: `Schemat uppfyller inte alla bemanningskrav (${issues.length} problem detekterade).`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Schema genererat",
            description: "Schemaförslag har skapats och är redo för granskning.",
          });
        }
        
        return true;
      } else {
        console.log('No shifts generated');
        toast({
          title: "Kunde inte generera schema",
          description: "Det gick inte att hitta en giltig schemaläggning med nuvarande begränsningar.",
          variant: "destructive",
        });
        
        setShowPreview(false);
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

  // Local fallback for generating a basic schedule when APIs fail
  const generateBasicSchedule = async (
    startDate: Date, 
    endDate: Date, 
    availableProfiles: typeof profiles,
    scheduleSettings: typeof settings
  ) => {
    console.log('Generating a basic schedule locally as fallback');
    
    if (!availableProfiles || availableProfiles.length === 0) {
      return { schedule: [] };
    }

    const shifts: Shift[] = [];
    const currentDay = new Date(startDate);
    const shiftTypes = ['day', 'evening', 'night'] as const;
    const roleToShiftType: Record<string, typeof shiftTypes[number]> = {
      'Läkare': 'day',
      'Sjuksköterska': 'evening',
      'Undersköterska': 'night'
    };
    
    // Group profiles by role
    const profilesByRole = availableProfiles.reduce((acc, profile) => {
      const role = profile.role || 'Other';
      if (!acc[role]) acc[role] = [];
      acc[role].push(profile);
      return acc;
    }, {} as Record<string, typeof availableProfiles>);
    
    // For each day in the range
    while (currentDay <= endDate) {
      const dateStr = format(currentDay, 'yyyy-MM-dd');
      
      // For each role, schedule employees
      Object.entries(profilesByRole).forEach(([role, profiles]) => {
        if (profiles.length === 0) return;
        
        const shiftType = roleToShiftType[role] || 'day';
        
        // Determine how many staff we need for this shift
        const shiftSetting = scheduleSettings?.[`${shiftType}_shift`] || { min_staff: 1 };
        const staffNeeded = shiftSetting.min_staff || 1;
        
        // Schedule up to staffNeeded employees
        for (let i = 0; i < Math.min(staffNeeded, profiles.length); i++) {
          // Simple round-robin assignment
          const employee = profiles[i % profiles.length];
          
          let startTime, endTime;
          switch(shiftType) {
            case 'day':
              startTime = `${dateStr}T07:00:00.000Z`;
              endTime = `${dateStr}T15:00:00.000Z`;
              break;
            case 'evening':
              startTime = `${dateStr}T15:00:00.000Z`;
              endTime = `${dateStr}T23:00:00.000Z`;
              break;
            case 'night':
              startTime = `${dateStr}T23:00:00.000Z`;
              const nextDay = new Date(currentDay);
              nextDay.setDate(nextDay.getDate() + 1);
              const nextDateStr = format(nextDay, 'yyyy-MM-dd');
              endTime = `${nextDateStr}T07:00:00.000Z`;
              break;
          }
          
          shifts.push({
            id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            employee_id: employee.id,
            shift_type: shiftType,
            start_time: startTime,
            end_time: endTime,
            department: scheduleSettings?.department || 'General'
          });
        }
      });
      
      // Move to next day
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    console.log(`Generated ${shifts.length} shifts locally`);
    return { schedule: shifts };
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
