
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import type { Shift } from "@/types/shift";
import { useScheduleGeneration } from "./hooks/useScheduleGeneration";
import { ScheduleGenerationPreview } from "./ScheduleGenerationPreview";
import { useScheduleActionHandlers } from "./actions/useScheduleActionHandlers";
import { ScheduleActionsMenu } from "./actions/ScheduleActionsMenu";
import { GenerateButton } from "./actions/GenerateButton";
import { useSchedulePublishing } from "./actions/useSchedulePublishing";
import { ScheduleSummaryModal } from "@/components/ui/ScheduleSummaryModal";
import { PublicationStatus } from "./PublicationStatus";

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
    generationProgress,
    progressMessage,
    showPreview,
    setShowPreview,
    generatedShifts,
    setGeneratedShifts,
    generateSchedule,
    profiles,
    staffingIssues,
    showSummary,
    setShowSummary,
    summaryData
  } = useScheduleGeneration(currentDate, currentView);

  const {
    handleSettingsClick,
    handleApplySchedule
  } = useScheduleActionHandlers();
  
  const {
    handlePublishSchedule,
    handleUnpublishSchedule,
    handleClearUnpublished
  } = useSchedulePublishing();

  // Check if there are any published shifts
  const hasPublishedShifts = shifts.some(shift => shift.is_published);
  const hasAnyShifts = shifts.length > 0;

  const handleCancelPreview = () => {
    setShowPreview(false);
    setGeneratedShifts([]);
  };

  return (
    <div className="flex items-center gap-3">
      <PublicationStatus 
        hasPublishedShifts={hasPublishedShifts}
        hasAnyShifts={hasAnyShifts}
      />
      
      <GenerateButton
        isGenerating={isGenerating}
        isLoadingSettings={isLoadingSettings}
        generationProgress={generationProgress}
        progressMessage={progressMessage}
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

      {/* Schedule Summary Modal */}
      {showSummary && summaryData && (
        <ScheduleSummaryModal
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
          shifts={summaryData.shifts}
          employees={profiles}
          startDate={summaryData.startDate}
          endDate={summaryData.endDate}
          staffingIssues={summaryData.staffingIssues || []}
          onAccept={() => {
            // Acceptera schemat och stäng modal
            setShowSummary(false);
            // TODO: Implementera acceptfunktionalitet (t.ex. spara som "godkänt")
          }}
          onRegenerate={() => {
            // Stäng modal och generera om
            setShowSummary(false);
            // Återanropa generateSchedule
            generateSchedule();
          }}
          onCancel={() => {
            // Bara stäng modal utan att göra något
            setShowSummary(false);
          }}
        />
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <ScheduleActionsMenu
          onPublishClick={handlePublishSchedule}
          onUnpublishClick={handleUnpublishSchedule}
          onClearClick={handleClearUnpublished}
          onSettingsClick={handleSettingsClick}
          hasPublishedShifts={hasPublishedShifts}
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
