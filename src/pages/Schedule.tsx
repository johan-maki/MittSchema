
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sv } from "date-fns/locale";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import { PlusCircle, Settings, FileDown } from "lucide-react";
import { CalendarHeader } from "@/components/shifts/CalendarHeader";
import { WeekView } from "@/components/shifts/WeekView";
import { MonthlySchedule } from "@/components/shifts/MonthlySchedule";
import DayView from "@/components/shifts/DayView";
import { motion, AnimatePresence } from "framer-motion";
import { Shift } from "@/types/shift";
import { Profile } from "@/types/profile";
import * as XLSX from 'xlsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

type ShiftWithProfiles = Shift & {
  profiles: Pick<Profile, 'first_name' | 'last_name'>;
};

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2025, 2, 1));
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('month');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts', currentDate, currentView],
    queryFn: async () => {
      if (!user) return [];
      
      let rangeStart: Date, rangeEnd: Date;
      if (currentView === 'week') {
        rangeStart = startOfWeek(currentDate, { locale: sv });
        rangeEnd = endOfWeek(currentDate, { locale: sv });
      } else {
        rangeStart = startOfMonth(currentDate);
        rangeEnd = endOfMonth(currentDate);
      }

      const shiftTemplates: Omit<ShiftWithProfiles, 'start_time' | 'end_time'>[] = [
        {
          id: 'doc1',
          employee_id: 'doc1',
          shift_type: 'night' as const,
          department: 'Emergency',
          profiles: { first_name: 'Meryl', last_name: 'Streep' }
        },
        {
          id: 'doc2',
          employee_id: 'doc2',
          shift_type: 'day' as const,
          department: 'Surgery',
          profiles: { first_name: 'Morgan', last_name: 'Freeman' }
        },
        {
          id: 'nurse1',
          employee_id: 'nurse1',
          shift_type: 'day' as const,
          department: 'Emergency',
          profiles: { first_name: 'Emma', last_name: 'Thompson' }
        },
        {
          id: 'nurse2',
          employee_id: 'nurse2',
          shift_type: 'evening' as const,
          department: 'Pediatrics',
          profiles: { first_name: 'Sandra', last_name: 'Bullock' }
        },
        {
          id: 'asst1',
          employee_id: 'asst1',
          shift_type: 'day' as const,
          department: 'Emergency',
          profiles: { first_name: 'Tom', last_name: 'Hanks' }
        },
        {
          id: 'asst2',
          employee_id: 'asst2',
          shift_type: 'evening' as const,
          department: 'Surgery',
          profiles: { first_name: 'Julia', last_name: 'Roberts' }
        }
      ];

      const shouldWork = (employeeId: string, date: Date) => {
        const dayOfMonth = date.getDate();
        const dayOfWeek = date.getDay();
        
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        switch(employeeId) {
          case 'doc1':
            return dayOfMonth % 5 < 3;
          case 'doc2':
            return !isWeekend;
          case 'nurse1':
            return dayOfMonth % 7 < 4;
          case 'nurse2':
            return isWeekend ? dayOfMonth % 14 < 7 : dayOfMonth % 3 === 0;
          case 'asst1':
            return (dayOfMonth + 3) % 7 < 5;
          case 'asst2':
            return dayOfMonth % 4 !== 0;
          default:
            return false;
        }
      };

      const allShifts: ShiftWithProfiles[] = [];
      let iterDate = new Date(rangeStart);

      while (iterDate <= rangeEnd) {
        shiftTemplates.forEach(template => {
          if (shouldWork(template.employee_id, iterDate)) {
            const shift: ShiftWithProfiles = {
              ...template,
              start_time: '',
              end_time: ''
            };
            shift.id = `${template.id}-${iterDate.getDate()}`;
            
            const shiftDate = new Date(iterDate);
            if (template.shift_type === 'night') {
              shiftDate.setHours(1, 0, 0);
              shift.start_time = shiftDate.toISOString();
              shiftDate.setHours(9, 0, 0);
              shift.end_time = shiftDate.toISOString();
            } else if (template.shift_type === 'day') {
              shiftDate.setHours(7, 0, 0);
              shift.start_time = shiftDate.toISOString();
              shiftDate.setHours(15, 0, 0);
              shift.end_time = shiftDate.toISOString();
            } else {
              shiftDate.setHours(15, 0, 0);
              shift.start_time = shiftDate.toISOString();
              shiftDate.setHours(23, 0, 0);
              shift.end_time = shiftDate.toISOString();
            }
            
            allShifts.push(shift);
          }
        });
        
        iterDate = addDays(iterDate, 1);
      }

      return allShifts;
    },
    enabled: !!user
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      if (!user) return [];
      return [
        {
          id: 'doc1',
          first_name: 'Meryl',
          last_name: 'Streep',
          role: 'Läkare',
          experience_level: 5,
          department: 'Emergency',
          phone: '+46701234567',
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 'doc2',
          first_name: 'Morgan',
          last_name: 'Freeman',
          role: 'Läkare',
          experience_level: 4,
          department: 'Surgery',
          phone: '+46701234568',
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 'nurse1',
          first_name: 'Emma',
          last_name: 'Thompson',
          role: 'Sjuksköterska',
          experience_level: 3,
          department: 'Emergency',
          phone: '+46701234569',
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 'nurse2',
          first_name: 'Sandra',
          last_name: 'Bullock',
          role: 'Sjuksköterska',
          experience_level: 4,
          department: 'Pediatrics',
          phone: '+46701234570',
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 'asst1',
          first_name: 'Tom',
          last_name: 'Hanks',
          role: 'Undersköterska',
          experience_level: 2,
          department: 'Emergency',
          phone: '+46701234571',
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 'asst2',
          first_name: 'Julia',
          last_name: 'Roberts',
          role: 'Undersköterska',
          experience_level: 3,
          department: 'Surgery',
          phone: '+46701234572',
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-01T00:00:00.000Z'
        }
      ];
    },
    enabled: !!user
  });

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
      // Prepare data for Excel
      const excelData = shifts.map(shift => ({
        'Datum': format(new Date(shift.start_time), 'yyyy-MM-dd'),
        'Personal': `${shift.profiles.first_name} ${shift.profiles.last_name}`,
        'Roll': shift.shift_type === 'day' ? 'Dagpass' : shift.shift_type === 'evening' ? 'Kvällspass' : 'Nattpass',
        'Starttid': format(new Date(shift.start_time), 'HH:mm'),
        'Sluttid': format(new Date(shift.end_time), 'HH:mm'),
        'Avdelning': shift.department
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Schema');

      // Generate Excel file
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
    <AppLayout>
      <div className="h-[calc(100vh-56px)] flex flex-col bg-gradient-to-br from-sage-50 to-lavender-50">
        <header className="p-4 bg-white/30 backdrop-blur-sm border-b">
          <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
            <CalendarHeader
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              currentView={currentView}
              onViewChange={setCurrentView}
            />
            <div className="flex items-center gap-2">
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
                  <DropdownMenuItem onClick={handleExportToExcel}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportera schema
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 p-2 sm:p-4 overflow-auto"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );

  function renderView() {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (currentView) {
      case 'day':
        return <DayView date={currentDate} shifts={shifts} />;
      case 'week':
        return <WeekView date={currentDate} shifts={shifts} />;
      case 'month':
        return <MonthlySchedule date={currentDate} shifts={shifts} profiles={profiles} />;
      default:
        return null;
    }
  }
};

export default Schedule;
