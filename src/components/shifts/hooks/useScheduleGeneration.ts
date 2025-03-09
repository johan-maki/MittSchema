
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { Shift } from "@/types/shift";
import { useScheduleSettings } from "./useScheduleSettings";
import { useProfileData } from "./useProfileData";
import { validateConstraints } from "../utils/schedulingConstraints";
import { checkStaffingRequirements, type StaffingIssue } from "../utils/staffingUtils";
import { ensureMinimumStaffing, removeDuplicateShifts } from "../utils/staffingAdjustment";
import { generateOptimizedSchedule } from "@/api/scheduleApi";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";

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
      // Use the current date as the starting point
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      console.log('Calling optimized schedule generator with:', {
        settings,
        profiles,
        currentDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString()
      });

      const response = await generateOptimizedSchedule({
        settings,
        profiles,
        currentDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString()
      });

      console.log('Optimized schedule response:', response);

      if (response?.shifts?.length > 0) {
        // Check staffing against requirements and identify issues
        const issues = checkStaffingRequirements(response.shifts, settings);
        setStaffingIssues(issues);
        
        const processedShifts = ensureMinimumStaffing(response.shifts, profiles);
        
        const uniqueShifts = removeDuplicateShifts(processedShifts);
        
        if (uniqueShifts.length < processedShifts.length) {
          console.log(`Removed ${processedShifts.length - uniqueShifts.length} duplicate shifts after staffing adjustment`);
        }
        
        setGeneratedShifts(uniqueShifts);
        setShowPreview(true);
        
        // Show toast with staffing information and optimization score if available
        if (issues.length > 0) {
          toast({
            title: "Bemanningsvarning",
            description: `Schemat uppfyller inte alla bemanningskrav (${issues.length} problem detekterade).`,
            variant: "destructive",
          });
        } else {
          const scoreInfo = response.metadata?.score ? ` Optimeringsscore: ${response.metadata.score}%` : '';
          toast({
            title: "Schema optimerat",
            description: `Genererade ${uniqueShifts.length} arbetspass för ${profiles.length} medarbetare.${scoreInfo}`,
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
