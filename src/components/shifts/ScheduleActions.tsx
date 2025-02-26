
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import type { Shift } from "@/types/shift";
import { useScheduleGeneration } from "./useScheduleGeneration";
import { ScheduleGenerationPreview } from "./ScheduleGenerationPreview";
import { useScheduleActionHandlers } from "./actions/useScheduleActionHandlers";
import { ScheduleActionsMenu } from "./actions/ScheduleActionsMenu";
import { GenerateButton } from "./actions/GenerateButton";

interface ScheduleActionsProps {
  currentView: 'day' | 'week' | 'month';
  currentDate: Date;
  shifts: Array<Shift & { profiles: { first_name: string; last_name: string; } }>;
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: (open: boolean) => void;
}

export const ScheduleActions = ({
  currentView,
  currentDate,
  shifts,
  isCreateDialogOpen,
  setIsCreateDialogOpen
}: ScheduleActionsProps) => {
  const {
    isGenerating,
    isLoadingSettings,
    showPreview,
    setShowPreview,
    generatedShifts,
    setGeneratedShifts,
    generateSchedule,
    profiles
  } = useScheduleGeneration(currentDate, currentView);

  const {
    handleSettingsClick,
    handlePublishSchedule,
    handleClearUnpublished,
    handleApplySchedule,
  } = useScheduleActionHandlers();

  const handleCancelPreview = () => {
    setShowPreview(false);
    setGeneratedShifts([]);
  };

  return (
    <div className="flex items-center gap-2">
      <GenerateButton
        isGenerating={isGenerating}
        isLoadingSettings={isLoadingSettings}
        onClick={generateSchedule}
      />

      <ScheduleGenerationPreview 
        open={showPreview}
        onOpenChange={setShowPreview}
        generatedShifts={generatedShifts}
        profiles={profiles}
        onApply={() => handleApplySchedule(generatedShifts, () => {
          setShowPreview(false);
          setGeneratedShifts([]);
        })}
        onCancel={handleCancelPreview}
      />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <ScheduleActionsMenu
          onPublishClick={handlePublishSchedule}
          onClearClick={handleClearUnpublished}
          onSettingsClick={handleSettingsClick}
        />
        <DialogContent>
          <ShiftForm
            isOpen={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            defaultValues={{
              start_time: new Date().toISOString().slice(0, 16),
              end_time: new Date(new Date().setHours(new Date().getHours() + 8)).toISOString().slice(0, 16)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
