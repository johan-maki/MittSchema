
import { useState, useEffect } from "react";
import { sortShifts, groupShiftsByDate } from "./previewUtils";
import type { Shift } from "@/types/shift";

export const useSchedulePreview = (open: boolean, generatedShifts: Shift[], onApply: () => Promise<void>) => {
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reset error state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);
  
  const handleApply = async () => {
    try {
      setIsApplying(true);
      setError(null);
      console.log("Applying schedule with", generatedShifts.length, "shifts");
      await onApply();
    } catch (err) {
      console.error("Error applying schedule:", err);
      setError(err instanceof Error ? err.message : "Ett fel uppstod när schemat skulle appliceras");
    } finally {
      setIsApplying(false);
    }
  };

  const sortedShifts = sortShifts(generatedShifts);
  const shiftsByDate = groupShiftsByDate(sortedShifts);
  
  return {
    isApplying,
    error,
    setError,
    handleApply,
    sortedShifts,
    shiftsByDate
  };
};
