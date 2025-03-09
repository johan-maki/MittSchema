
import { useNavigate } from "react-router-dom";
import { useSchedulePublishing } from "./useSchedulePublishing";
import { useScheduleApplier } from "./useScheduleApplier";
import { useToast } from "@/components/ui/use-toast";
import type { Shift } from "@/types/shift";

export const useScheduleActionHandlers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handlePublishSchedule, handleClearUnpublished } = useSchedulePublishing();
  const { handleApplySchedule } = useScheduleApplier();

  const handleSettingsClick = () => {
    navigate('/schedule/settings');
  };

  const handleApplyGeneratedSchedule = async (generatedShifts: Shift[], onSuccess: () => void) => {
    if (!generatedShifts || generatedShifts.length === 0) {
      toast({
        title: "Inget schema att applicera",
        description: "Det finns inget genererat schema att applicera.",
        variant: "destructive"
      });
      return;
    }

    try {
      await handleApplySchedule(generatedShifts, onSuccess);
      toast({
        title: "Schema applicerat",
        description: `${generatedShifts.length} arbetspass har lagts till i schemat.`,
      });
    } catch (error) {
      console.error("Error applying schedule:", error);
      toast({
        title: "Fel vid applicering",
        description: "Det gick inte att applicera schemat. Försök igen.",
        variant: "destructive"
      });
    }
  };

  return {
    handleSettingsClick,
    handlePublishSchedule,
    handleClearUnpublished,
    handleApplySchedule: handleApplyGeneratedSchedule,
  };
};
