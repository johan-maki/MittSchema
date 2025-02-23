import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { CalendarHeader } from "@/components/shifts/CalendarHeader";
import { WeekView } from "@/components/shifts/WeekView";
import { MonthlySchedule } from "@/components/shifts/MonthlySchedule";
import DayView from "@/components/shifts/DayView";
import { motion, AnimatePresence } from "framer-motion";
import { useShiftData } from "@/hooks/useShiftData";
import { ScheduleActions } from "@/components/shifts/ScheduleActions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2025, 2, 1));
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('month');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: shifts = [], isLoading } = useShiftData(currentDate, currentView);

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
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
    }
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
            <ScheduleActions
              currentView={currentView}
              currentDate={currentDate}
              shifts={shifts}
              isCreateDialogOpen={isCreateDialogOpen}
              setIsCreateDialogOpen={setIsCreateDialogOpen}
            />
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
