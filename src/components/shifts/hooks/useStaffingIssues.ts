
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { checkStaffingRequirements } from "../utils/staffingUtils";
import { ensureMinimumStaffing, removeDuplicateShifts } from "../utils/staffingAdjustment";
import type { Shift } from "@/types/shift";
import type { Profile } from "@/types/profile";
import type { StaffingIssue } from "../utils/staffingUtils";

export const useStaffingIssues = () => {
  const { toast } = useToast();
  const [staffingIssues, setStaffingIssues] = useState<StaffingIssue[]>([]);

  const processScheduleForStaffingIssues = (
    shifts: Shift[],
    profiles: Profile[],
    settings: any
  ): Shift[] => {
    // Check staffing against requirements and identify issues
    const issues = checkStaffingRequirements(shifts, settings);
    setStaffingIssues(issues);
    
    // Process shifts to handle staffing issues
    const processedShifts = ensureMinimumStaffing(shifts, profiles);
    const uniqueShifts = removeDuplicateShifts(processedShifts);
    
    // Notify user about staffing issues
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
    
    return uniqueShifts;
  };

  return {
    staffingIssues,
    setStaffingIssues,
    processScheduleForStaffingIssues
  };
};
