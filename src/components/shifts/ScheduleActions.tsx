
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import { PlusCircle, Settings, FileDown, Wand2, Ban, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import { Shift } from "@/types/shift";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useScheduleGeneration } from "./useScheduleGeneration";
import { ScheduleGenerationPreview } from "./ScheduleGenerationPreview";

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
  const navigate = useNavigate();
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

  const handleGenerateSchedule = async () => {
    const success = await generateSchedule();
    if (!success) {
      navigate('/schedule/settings');
    }
  };

  const handleApplySchedule = async () => {
    try {
      const shiftsToInsert = generatedShifts.map(shift => ({
        start_time: shift.start_time,
        end_time: shift.end_time,
        shift_type: shift.shift_type,
        department: shift.department,
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

  const handleCancelPreview = () => {
    setShowPreview(false);
    setGeneratedShifts([]);
  };

  const handlePublishSchedule = async () => {
    try {
      const { error: updateError } = await supabase
        .from('shifts')
        .update({ is_published: true })
        .filter('is_published', 'is', null);

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
        .filter('is_published', 'is', null);

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

  const handleExportToExcel = () => {
    if (currentView !== 'month') {
      toast({
        title: "Export endast tillgänglig i månadsvy",
        description: "Byt till månadsvy för att exportera schemat.",
        variant: "default",
      });
      return;
    }

    try {
      const excelData = shifts.map(shift => ({
        'Datum': format(new Date(shift.start_time), 'yyyy-MM-dd'),
        'Personal': `${shift.profiles.first_name} ${shift.profiles.last_name}`,
        'Roll': shift.shift_type === 'day' ? 'Dagpass' : shift.shift_type === 'evening' ? 'Kvällspass' : 'Nattpass',
        'Starttid': format(new Date(shift.start_time), 'HH:mm'),
        'Sluttid': format(new Date(shift.end_time), 'HH:mm'),
        'Avdelning': shift.department
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Schema');
      const monthYear = format(currentDate, 'yyyy-MM');
      XLSX.writeFile(wb, `schema-${monthYear}.xlsx`);

      toast({
        title: "Schema exporterat",
        description: "Schemat har exporterats som Excel-fil.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Exportering misslyckades",
        description: "Ett fel uppstod vid exportering av schemat.",
        variant: "destructive",
      });
    }
  };

  const handleSettingsClick = () => {
    navigate('/schedule/settings');
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleGenerateSchedule}
        disabled={isGenerating || isLoadingSettings}
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

      <Button
        variant="outline"
        className="bg-green-800 text-white hover:bg-green-900"
        onClick={handlePublishSchedule}
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Publicera
      </Button>

      <Button
        variant="outline"
        className="border-red-500 text-red-500 hover:bg-red-50"
        onClick={handleClearUnpublished}
      >
        <Ban className="mr-2 h-4 w-4" />
        Rensa opublicerat
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSettingsClick}>
            <Settings className="mr-2 h-4 w-4" />
            Inställningar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportToExcel}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportera schema
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
