
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sv } from "date-fns/locale";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import { PlusCircle } from "lucide-react";
import { CalendarHeader } from "@/components/shifts/CalendarHeader";
import { WeekView } from "@/components/shifts/WeekView";
import { MonthlySchedule } from "@/components/shifts/MonthlySchedule";
import DayView from "@/components/shifts/DayView";
import { motion, AnimatePresence } from "framer-motion";

const Schedule = () => {
  // Initialize with March 2025
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2025, 2, 1)); // Month is 0-based, so 2 is March
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('month');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts', currentDate, currentView],
    queryFn: async () => {
      if (!user) return [];
      
      let startDate, endDate;
      if (currentView === 'week') {
        startDate = startOfWeek(currentDate, { locale: sv });
        endDate = endOfWeek(currentDate, { locale: sv });
      } else {
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
      }

      // For demonstration purposes, let's create some sample shifts
      const sampleShifts = [
        // Doctors (Läkare)
        {
          id: '1',
          employee_id: 'doc1',
          start_time: '2025-03-01T01:00:00',
          end_time: '2025-03-01T09:00:00',
          shift_type: 'night',
          profiles: { first_name: 'Meryl', last_name: 'Streep' }
        },
        {
          id: '2',
          employee_id: 'doc2',
          start_time: '2025-03-01T09:00:00',
          end_time: '2025-03-01T17:00:00',
          shift_type: 'day',
          profiles: { first_name: 'Morgan', last_name: 'Freeman' }
        },
        // Nurses (Sjuksköterska)
        {
          id: '3',
          employee_id: 'nurse1',
          start_time: '2025-03-01T07:00:00',
          end_time: '2025-03-01T15:00:00',
          shift_type: 'day',
          profiles: { first_name: 'Emma', last_name: 'Thompson' }
        },
        {
          id: '4',
          employee_id: 'nurse2',
          start_time: '2025-03-01T15:00:00',
          end_time: '2025-03-01T23:00:00',
          shift_type: 'evening',
          profiles: { first_name: 'Sandra', last_name: 'Bullock' }
        },
        // Assistant Nurses (Undersköterska)
        {
          id: '5',
          employee_id: 'asst1',
          start_time: '2025-03-01T07:00:00',
          end_time: '2025-03-01T15:00:00',
          shift_type: 'day',
          profiles: { first_name: 'Tom', last_name: 'Hanks' }
        },
        {
          id: '6',
          employee_id: 'asst2',
          start_time: '2025-03-01T15:00:00',
          end_time: '2025-03-01T23:00:00',
          shift_type: 'evening',
          profiles: { first_name: 'Julia', last_name: 'Roberts' }
        }
      ];

      // Duplicate shifts for other days in March
      const allShifts = [];
      for (let day = 1; day <= 31; day++) {
        sampleShifts.forEach(shift => {
          const newShift = { ...shift };
          newShift.id = `${shift.id}-${day}`;
          const date = new Date(2025, 2, day); // March 2025
          newShift.start_time = new Date(date.setHours(
            new Date(shift.start_time).getHours(),
            new Date(shift.start_time).getMinutes()
          )).toISOString();
          newShift.end_time = new Date(date.setHours(
            new Date(shift.end_time).getHours(),
            new Date(shift.end_time).getMinutes()
          )).toISOString();
          allShifts.push(newShift);
        });
      }

      // Return sample data instead of actual API call for demonstration
      return allShifts;
    },
    enabled: !!user
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      if (!user) return [];
      
      // Return sample profiles
      return [
        { id: 'doc1', first_name: 'Meryl', last_name: 'Streep', role: 'Läkare', experience_level: 5 },
        { id: 'doc2', first_name: 'Morgan', last_name: 'Freeman', role: 'Läkare', experience_level: 4 },
        { id: 'nurse1', first_name: 'Emma', last_name: 'Thompson', role: 'Sjuksköterska', experience_level: 3 },
        { id: 'nurse2', first_name: 'Sandra', last_name: 'Bullock', role: 'Sjuksköterska', experience_level: 4 },
        { id: 'asst1', first_name: 'Tom', last_name: 'Hanks', role: 'Undersköterska', experience_level: 2 },
        { id: 'asst2', first_name: 'Julia', last_name: 'Roberts', role: 'Undersköterska', experience_level: 3 }
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
