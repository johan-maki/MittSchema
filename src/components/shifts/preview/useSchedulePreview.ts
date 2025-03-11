
import { useState, useEffect } from "react";
import { sortShifts, groupShiftsByDate } from "./previewUtils";
import { v4 as uuidv4 } from "uuid";
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
  
  // Ensure all shifts have valid UUIDs
  useEffect(() => {
    if (generatedShifts.length > 0) {
      generatedShifts.forEach(shift => {
        // Ensure each shift has a valid UUID
        if (!shift.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shift.id)) {
          shift.id = uuidv4();
        }
      });
    }
  }, [generatedShifts]);
  
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
