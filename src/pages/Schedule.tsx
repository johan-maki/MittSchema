
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sv } from "date-fns/locale";
import { startOfWeek, endOfWeek } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import { PlusCircle } from "lucide-react";
import { CalendarHeader } from "@/components/shifts/CalendarHeader";
import { WeekView } from "@/components/shifts/WeekView";
import { motion, AnimatePresence } from "framer-motion";

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts', currentDate],
    queryFn: async () => {
      if (!user) return [];
      
      const weekStart = startOfWeek(currentDate, { locale: sv });
      const weekEnd = endOfWeek(currentDate, { locale: sv });
      
      const { data, error } = await supabase
        .from('shifts')
        .select('*, profiles!shifts_employee_id_fkey(first_name, last_name)')
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString());

      if (error) throw error;
      return data || [];
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
      case 'week':
        return <WeekView date={currentDate} shifts={shifts} />;
      default:
        return (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            {currentView} vy kommer snart
          </div>
        );
    }
  }
};

export default Schedule;
