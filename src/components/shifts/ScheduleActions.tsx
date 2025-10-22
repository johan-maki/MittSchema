
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
import { ScheduleChangesModal } from "@/components/schedule/ScheduleChangesModal";

interface ScheduleActionsProps {
  currentView: 'day' | 'week' | 'month';
  currentDate: Date;
  onDateChange: (date: Date) => void;
  shifts: Shift[];
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: (open: boolean) => void;
  aiConstraints?: any[];
}

export const ScheduleActions = ({
  currentView,
  currentDate,
  onDateChange,
  shifts,
  isCreateDialogOpen,
  setIsCreateDialogOpen,
  aiConstraints
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
    acceptSchedule,
    cancelSchedule,
    acceptScheduleChanges,
    startEditingPublishedSchedule,
    isEditingPublished,
    showChangesModal,
    setShowChangesModal,
    scheduleChanges,
    profiles,
    staffingIssues,
    showSummary,
    setShowSummary,
    summaryData,
    previousOptimizationScore,
    currentOptimizationScore
  } = useScheduleGeneration(currentDate, currentView, onDateChange, aiConstraints);

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
          coverageStats={summaryData.coverage_stats}
          previousOptimizationScore={previousOptimizationScore}
          currentOptimizationScore={currentOptimizationScore}
          onAccept={acceptSchedule}
          onRegenerate={() => {
            // Stäng modal och generera om
            setShowSummary(false);
            // Återanropa generateSchedule
            generateSchedule();
          }}
          onCancel={cancelSchedule}
        />
      )}

      {/* Schedule Changes Modal - shows diff when editing published schedule */}
      {showChangesModal && scheduleChanges && (
        <ScheduleChangesModal
          isOpen={showChangesModal}
          onClose={() => setShowChangesModal(false)}
          onAccept={acceptScheduleChanges}
          changes={scheduleChanges}
          unchangedCount={summaryData?.shifts ? summaryData.shifts.length - scheduleChanges.length : 0}
          totalChangedEmployees={new Set(scheduleChanges.map(c => c.employeeName)).size}
        />
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <ScheduleActionsMenu
          onPublishClick={handlePublishSchedule}
          onUnpublishClick={handleUnpublishSchedule}
          onClearClick={handleClearUnpublished}
          onSettingsClick={handleSettingsClick}
          hasPublishedShifts={hasPublishedShifts}
          onEditPublishedClick={() => startEditingPublishedSchedule(currentDate)}
          isEditingPublished={isEditingPublished}
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
