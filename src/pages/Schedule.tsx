
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sv } from "date-fns/locale";
import { startOfWeek, endOfWeek } from "date-fns"; // Added these imports
import { useAuth } from "@/contexts/AuthContext";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import { PlusCircle } from "lucide-react";
import { CalendarHeader } from "@/components/shifts/CalendarHeader";

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const isManager = profile?.is_manager ?? false;

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['shifts', currentDate, isManager],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('shifts')
        .select('*, profiles!shifts_employee_id_fkey(first_name, last_name)');

      if (isManager) {
        const weekStart = startOfWeek(currentDate, { locale: sv });
        const weekEnd = endOfWeek(currentDate, { locale: sv });
        query = query
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString());
      } else {
        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .eq('employee_id', user.id)
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  return (
    <AppLayout>
      <div className="h-[calc(100vh-56px)] flex flex-col bg-gradient-to-br from-sage-50 to-lavender-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 bg-white/30 backdrop-blur-sm border-b">
          <CalendarHeader
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            currentView={currentView}
            onViewChange={setCurrentView}
          />
          {isManager && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Lägg till pass
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <ShiftForm isOpen={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="flex-1 p-2 sm:p-4 overflow-auto">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            {currentView} vy kommer snart
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Schedule;
