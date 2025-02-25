
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WeekView } from "@/components/shifts/WeekView";
import { MonthlySchedule } from "@/components/shifts/MonthlySchedule";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, FileDown } from "lucide-react";
import { addWeeks, subWeeks, format, addMonths, subMonths } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from 'xlsx';
import { useToast } from "@/components/ui/use-toast";

interface EmployeeScheduleProps {
  employeeId: string;
}

export const EmployeeSchedule = ({ employeeId }: EmployeeScheduleProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');
  const { toast } = useToast();

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['employee-shifts', employeeId, currentDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          profiles:employee_id (
            first_name,
            last_name,
            experience_level
          )
        `)
        .eq('employee_id', employeeId);

      if (error) throw error;
      return data;
    }
  });

  const handleDateChange = (direction: 'prev' | 'next') => {
    if (view === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    }
  };

  const handleExportToExcel = () => {
    try {
      if (!shifts?.length) {
        toast({
          title: "Inga pass att exportera",
          description: "Det finns inga schemalagda pass att exportera.",
          variant: "default",
        });
        return;
      }

      const excelData = shifts.map(shift => ({
        'Datum': format(new Date(shift.start_time), 'yyyy-MM-dd'),
        'Starttid': format(new Date(shift.start_time), 'HH:mm'),
        'Sluttid': format(new Date(shift.end_time), 'HH:mm'),
        'Avdelning': shift.department,
        'Typ': shift.shift_type === 'day' ? 'Dagpass' : shift.shift_type === 'evening' ? 'Kvällspass' : 'Nattpass'
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Mitt Schema');
      
      // Get employee name from first shift for filename
      const employeeName = shifts[0]?.profiles?.first_name || 'schema';
      const monthYear = format(currentDate, 'yyyy-MM');
      XLSX.writeFile(wb, `${employeeName}-schema-${monthYear}.xlsx`);

      toast({
        title: "Schema exporterat",
        description: "Ditt schema har exporterats som Excel-fil.",
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

  if (isLoading) {
    return <Skeleton className="w-full h-[500px]" />;
  }

  return (
    <div className="space-y-4 max-w-full">
      <Card className="p-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium">
              {view === 'week' 
                ? `Vecka ${format(currentDate, 'w', { locale: sv })}`
                : format(currentDate, 'MMMM yyyy', { locale: sv })}
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateChange('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
              >
                Idag
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateChange('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                onClick={() => setView('week')}
              >
                Vecka
              </Button>
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                onClick={() => setView('month')}
              >
                Månad
              </Button>
              <Button
                variant="outline"
                onClick={handleExportToExcel}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportera
              </Button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {view === 'week' ? (
            <WeekView date={currentDate} shifts={shifts || []} />
          ) : (
            <MonthlySchedule 
              date={currentDate}
              shifts={shifts || []}
              profiles={[]}
            />
          )}
        </div>
      </Card>
    </div>
  );
};
