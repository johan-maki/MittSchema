
import { Button } from "@/components/ui/button";
import { Settings, FileDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import type { Shift } from "@/types/shift";

interface SettingsMenuProps {
  currentView: 'day' | 'week' | 'month';
  currentDate: Date;
  shifts: Array<Shift & { profiles: { first_name: string; last_name: string; } }>;
}

export const SettingsMenu = ({ currentView, currentDate, shifts }: SettingsMenuProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate('/schedule/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Inställningar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportToExcel}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportera schema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
