
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useScheduleApplier } from "./useScheduleApplier";
import { Shift } from "@/types/shift";

export const useScheduleActionHandlers = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { applySchedule } = useScheduleApplier();

  const handleSettingsClick = () => {
    navigate("/schedule-settings");
  };

  const handleApplySchedule = async (shifts: Shift[], onSuccess?: () => void) => {
    try {
      const result = await applySchedule(shifts);
      if (result) {
        toast({
          title: "Schema uppdaterat",
          description: `${shifts.length} arbetspass har schemalagts framgångsrikt.`,
        });
        
        if (onSuccess) {
          onSuccess();
        }
        return true;
      } else {
        toast({
          title: "Kunde inte tillämpa schemat",
          description: "Ett fel uppstod när schemat skulle tillämpas. Försök igen.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error applying schedule:", error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte tillämpa schemat. Ett tekniskt fel har uppstått.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    handleSettingsClick,
    handleApplySchedule,
  };
};
