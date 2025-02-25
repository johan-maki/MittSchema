
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { Shift } from "@/types/shift";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useScheduleGeneration } from "./useScheduleGeneration";
import { ScheduleGenerationPreview } from "./ScheduleGenerationPreview";
import { GenerateScheduleButton } from "./GenerateScheduleButton";
import { ScheduleControls } from "./ScheduleControls";
import { SettingsMenu } from "./SettingsMenu";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  const handleApplySchedule = async () => {
    try {
      const shiftsToInsert = generatedShifts.map(shift => ({
        start_time: shift.start_time,
        end_time: shift.end_time,
        shift_type: shift.shift_type,
        department: shift.department || 'General',
        employee_id: shift.employee_id
      }));

      const { error: insertError } = await supabase
        .from('shifts')
        .insert(shiftsToInsert);

      if (insertError) throw insertError;

      toast({
        title: "Schema applicerat",
        description: "Det nya schemat har sparats.",
      });

      setShowPreview(false);
      setGeneratedShifts([]);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (error) {
      console.error('Error applying schedule:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte spara schemat. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setGeneratedShifts([]);
  };

  return (
    <div className="flex items-center gap-2">
      <GenerateScheduleButton
        isGenerating={isGenerating}
        isLoadingSettings={isLoadingSettings}
        onGenerate={generateSchedule}
      />

      <ScheduleControls />

      <ScheduleGenerationPreview 
        open={showPreview}
        onOpenChange={setShowPreview}
        generatedShifts={generatedShifts}
        profiles={profiles}
        onApply={handleApplySchedule}
        onCancel={handleCancelPreview}
      />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Lägg till pass
          </Button>
        </DialogTrigger>
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

      <SettingsMenu
        currentView={currentView}
        currentDate={currentDate}
        shifts={shifts}
      />
    </div>
  );
};
