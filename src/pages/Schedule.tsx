
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sv } from "date-fns/locale";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import { PlusCircle } from "lucide-react";
import { CalendarHeader } from "@/components/shifts/CalendarHeader";
import { WeekView } from "@/components/shifts/WeekView";
import { MonthlySchedule } from "@/components/shifts/MonthlySchedule";
import DayView from "@/components/shifts/DayView";
import { motion, AnimatePresence } from "framer-motion";
import { Shift } from "@/types/shift";

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2025, 2, 1));
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('month');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();

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

      // Base shift templates with required properties
      const shiftTemplates = [
        // Doctors (Läkare)
        {
          id: 'doc1',
          employee_id: 'doc1',
          shift_type: 'night' as const,
          department: 'Emergency',
          profiles: { first_name: 'Meryl', last_name: 'Streep' },
          start_time: '',
          end_time: ''
        },
        {
          id: 'doc2',
          employee_id: 'doc2',
          shift_type: 'day' as const,
          department: 'Surgery',
          profiles: { first_name: 'Morgan', last_name: 'Freeman' },
          start_time: '',
          end_time: ''
        },
        // Nurses (Sjuksköterska)
        {
          id: 'nurse1',
          employee_id: 'nurse1',
          shift_type: 'day' as const,
          department: 'Emergency',
          profiles: { first_name: 'Emma', last_name: 'Thompson' },
          start_time: '',
          end_time: ''
        },
        {
          id: 'nurse2',
          employee_id: 'nurse2',
          shift_type: 'evening' as const,
          department: 'Pediatrics',
          profiles: { first_name: 'Sandra', last_name: 'Bullock' },
          start_time: '',
          end_time: ''
        },
        // Assistant Nurses (Undersköterska)
        {
          id: 'asst1',
          employee_id: 'asst1',
          shift_type: 'day' as const,
          department: 'Emergency',
          profiles: { first_name: 'Tom', last_name: 'Hanks' },
          start_time: '',
          end_time: ''
        },
        {
          id: 'asst2',
          employee_id: 'asst2',
          shift_type: 'evening' as const,
          department: 'Surgery',
          profiles: { first_name: 'Julia', last_name: 'Roberts' },
          start_time: '',
          end_time: ''
        }
      ];

      // Function to determine if a person should work on a given day
      const shouldWork = (employeeId: string, date: Date) => {
        const dayOfMonth = date.getDate();
        const dayOfWeek = date.getDay();
        
        // Weekend rotation (some staff work weekends, others don't)
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Different patterns for different employees
        switch(employeeId) {
          case 'doc1': // Works 3 days on, 2 days off
            return dayOfMonth % 5 < 3;
          case 'doc2': // Works weekdays only
            return !isWeekend;
          case 'nurse1': // Works 4 days on, 3 days off
            return dayOfMonth % 7 < 4;
          case 'nurse2': // Works alternative weekends and some weekdays
            return isWeekend ? dayOfMonth % 14 < 7 : dayOfMonth % 3 === 0;
          case 'asst1': // Works 5 days on, 2 days off, including some weekends
            return (dayOfMonth + 3) % 7 < 5;
          case 'asst2': // Works mainly evenings, with regular days off
            return dayOfMonth % 4 !== 0;
          default:
            return false;
        }
      };

      const allShifts: Shift[] = [];
      let iterDate = new Date(rangeStart);

      while (iterDate <= rangeEnd) {
        shiftTemplates.forEach(template => {
          if (shouldWork(template.employee_id, iterDate)) {
            const shift = { ...template };
            shift.id = `${template.id}-${iterDate.getDate()}`;
            
            // Set shift times based on shift type
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
            } else { // evening
              shiftDate.setHours(15, 0, 0);
              shift.start_time = shiftDate.toISOString();
              shiftDate.setHours(23, 0, 0);
              shift.end_time = shiftDate.toISOString();
            }
            
            allShifts.push(shift as Shift);
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
      
      // Return sample profiles with all required fields
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
