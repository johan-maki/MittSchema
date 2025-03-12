
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import type { Shift } from "@/types/shift";
import { useScheduleGeneration } from "./hooks/useScheduleGeneration";
import { ScheduleGenerationPreview } from "./ScheduleGenerationPreview";
import { useScheduleActionHandlers } from "./actions/useScheduleActionHandlers";
import { ScheduleActionsMenu } from "./actions/ScheduleActionsMenu";
import { GenerateButton } from "./actions/GenerateButton";
import { useSchedulePublishing } from "./actions/useSchedulePublishing";

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
    profiles,
    staffingIssues
  } = useScheduleGeneration(currentDate, currentView);

  const {
    handleSettingsClick,
  } = useScheduleActionHandlers();
  
  const {
    handlePublishSchedule,
    handleClearUnpublished
  } = useSchedulePublishing();

  const handleCancelPreview = () => {
    setShowPreview(false);
    setGeneratedShifts([]);
  };
  
  const handleApplySchedule = async (shifts: Shift[], onSuccess: () => void) => {
    try {
      const saveResult = await saveScheduleToSupabase(shifts);
      if (saveResult) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error applying schedule:", error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <GenerateButton
        isGenerating={isGenerating}
        isLoadingSettings={isLoadingSettings}
        onClick={generateSchedule}
      />

      {/* Only show preview dialog if needed - when automatic saving fails */}
      {showPreview && (
        <ScheduleGenerationPreview 
          open={showPreview}
          onOpenChange={setShowPreview}
          generatedShifts={generatedShifts}
          profiles={profiles}
          staffingIssues={staffingIssues}
          onApply={() => handleApplySchedule(generatedShifts, () => {
            setShowPreview(false);
            setGeneratedShifts([]);
          })}
          onCancel={handleCancelPreview}
        />
      )}

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
