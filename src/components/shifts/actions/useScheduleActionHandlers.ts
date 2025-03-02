
import { useNavigate } from "react-router-dom";
import { useSchedulePublishing } from "./useSchedulePublishing";
import { useScheduleApplier } from "./useScheduleApplier";
import type { Shift } from "@/types/shift";

export const useScheduleActionHandlers = () => {
  const navigate = useNavigate();
  const { handlePublishSchedule, handleClearUnpublished } = useSchedulePublishing();
  const { handleApplySchedule } = useScheduleApplier();

  const handleSettingsClick = () => {
    navigate('/schedule/settings');
  };

  return {
    handleSettingsClick,
    handlePublishSchedule,
    handleClearUnpublished,
    handleApplySchedule,
  };
};
