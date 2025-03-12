
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useScheduleApplier } from "./useScheduleApplier";
import { Shift } from "@/types/shift";

export const useScheduleActionHandlers = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { handleApplySchedule } = useScheduleApplier();

  const handleSettingsClick = () => {
    navigate("/schedule-settings");
  };

  return {
    handleSettingsClick,
    handleApplySchedule,
  };
};
