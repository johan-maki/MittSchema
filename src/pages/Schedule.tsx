
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
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts', currentDate, currentView],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          profiles:employee_id (
            first_name,
            last_name,
            role,
            experience_level
          )
        `)
        .gte('start_time', new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString())
        .lte('start_time', new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString());

      if (error) {
        console.error('Error fetching shifts:', error);
        return [];
      }

      return data || [];
    }
  });

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

      return data || [];
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
