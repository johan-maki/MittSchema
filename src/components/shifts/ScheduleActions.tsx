
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import { Wand2, MoreVertical, CheckCircle2, Ban, PlusCircle, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { Shift } from "@/types/shift";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useScheduleGeneration } from "./useScheduleGeneration";
import { ScheduleGenerationPreview } from "./ScheduleGenerationPreview";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  
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

  const handleAddClick = () => {
    setIsCreateDialogOpen(true);
  };

  const handleSettingsClick = () => {
    navigate('/schedule/settings');
  };

  const handleApplySchedule = async () => {
    try {
      const shiftsToInsert = generatedShifts.map(shift => ({
        start_time: shift.start_time,
        end_time: shift.end_time,
        shift_type: shift.shift_type,
        department: shift.department || 'General',
        employee_id: shift.employee_id,
        is_published: false
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

  const handlePublishSchedule = async () => {
    try {
      const { error: updateError } = await supabase
        .from('shifts')
        .update({ is_published: true })
        .eq('is_published', false);

      if (updateError) throw updateError;

      toast({
        title: "Schema publicerat",
        description: "Alla schemalagda pass har publicerats.",
      });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (error) {
      console.error('Error publishing schedule:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte publicera schemat. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleClearUnpublished = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .eq('is_published', false);

      if (deleteError) throw deleteError;

      toast({
        title: "Schema rensat",
        description: "Alla opublicerade pass har tagits bort.",
      });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (error) {
      console.error('Error clearing schedule:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte rensa schemat. Försök igen.",
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
      <Button
        onClick={generateSchedule}
        disabled={isGenerating || isLoadingSettings}
        className="bg-violet-500 hover:bg-violet-600 text-white"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            Genererar schema...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Generera schema
          </>
        )}
      </Button>

      <ScheduleGenerationPreview 
        open={showPreview}
        onOpenChange={setShowPreview}
        generatedShifts={generatedShifts}
        profiles={profiles}
        onApply={handleApplySchedule}
        onCancel={handleCancelPreview}
      />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handlePublishSchedule} className="text-green-600">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Publicera
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleClearUnpublished} className="text-red-600">
              <Ban className="mr-2 h-4 w-4" />
              Rensa opublicerat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettingsClick} className="text-gray-600">
              <Settings className="mr-2 h-4 w-4" />
              Schemainställningar
            </DropdownMenuItem>
            <DialogTrigger asChild>
              <DropdownMenuItem>
                <PlusCircle className="mr-2 h-4 w-4" />
                Lägg till pass
              </DropdownMenuItem>
            </DialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
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
