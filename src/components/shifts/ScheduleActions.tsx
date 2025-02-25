
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import { PlusCircle, Settings, FileDown, Wand2, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import { Shift } from "@/types/shift";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedShifts, setGeneratedShifts] = useState<Shift[]>([]);

  // Fetch settings for validation
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['schedule-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_settings')
        .select('*')
        .eq('department', 'General')
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch employee profiles for schedule generation
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }

      return data;
    }
  });

  const validateConstraints = () => {
    // Don't validate while settings are still loading
    if (isLoadingSettings) return true;

    if (!settings) {
      toast({
        title: "Inställningar saknas",
        description: "Vänligen konfigurera schemaläggningsinställningar först.",
        variant: "destructive",
      });
      return false;
    }

    // Check basic constraints
    if (!settings.max_consecutive_days || !settings.min_rest_hours) {
      toast({
        title: "Ofullständiga inställningar",
        description: "Vänligen kontrollera att alla grundläggande begränsningar är konfigurerade.",
        variant: "destructive",
      });
      return false;
    }

    // Check shift requirements
    const shifts = ['morning_shift', 'afternoon_shift', 'night_shift'] as const;
    for (const shift of shifts) {
      const shiftSettings = settings[shift];
      if (!shiftSettings?.min_staff || !shiftSettings?.min_experience_sum) {
        toast({
          title: "Ofullständiga skiftinställningar",
          description: `Vänligen kontrollera inställningarna för ${shift}.`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleGenerateSchedule = async () => {
    // First check if settings are still loading
    if (isLoadingSettings) {
      toast({
        title: "Laddar inställningar",
        description: "Vänta medan inställningarna laddas...",
      });
      return;
    }

    // Then validate constraints
    if (!validateConstraints()) {
      navigate('/schedule/settings');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: {
          settings,
          profiles,
          currentDate: currentDate.toISOString(),
          view: currentView
        }
      });

      if (error) throw error;

      if (data?.shifts?.length > 0) {
        setGeneratedShifts(data.shifts);
        setShowPreview(true);
      } else {
        toast({
          title: "Kunde inte generera schema",
          description: "Det gick inte att hitta en giltig schemaläggning med nuvarande begränsningar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte generera schema. Kontrollera begränsningar och försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySchedule = async () => {
    try {
      const { error: insertError } = await supabase
        .from('shifts')
        .insert(generatedShifts);

      if (insertError) throw insertError;

      toast({
        title: "Schema applicerat",
        description: "Det nya schemat har sparats.",
      });

      // Clear preview and refresh shifts
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

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Förhandsgranska genererat schema</DialogTitle>
            <DialogDescription>
              Granska det genererade schemat innan du applicerar det.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              {generatedShifts.map((shift, index) => {
                const employee = profiles.find(p => p.id === shift.employee_id);
                return (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-semibold">
                            {format(new Date(shift.start_time), 'yyyy-MM-dd')}
                          </p>
                          <p>
                            {format(new Date(shift.start_time), 'HH:mm')} - 
                            {format(new Date(shift.end_time), 'HH:mm')}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">
                            {employee ? `${employee.first_name} ${employee.last_name}` : 'Ingen tilldelad'}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {shift.shift_type === 'day' ? 'Dagpass' : 
                             shift.shift_type === 'evening' ? 'Kvällspass' : 'Nattpass'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="destructive" onClick={handleCancelPreview}>
              <X className="mr-2 h-4 w-4" />
              Avbryt
            </Button>
            <Button onClick={handleApplySchedule}>
              <Check className="mr-2 h-4 w-4" />
              Applicera schema
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
