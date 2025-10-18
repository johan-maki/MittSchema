import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { CalendarHeader } from "@/components/shifts/CalendarHeader";
import { WeekView } from "@/components/shifts/WeekView";
import { ManagerScheduleView } from "@/components/shifts/ManagerScheduleView";
import { ModernMonthlySchedule } from "@/components/shifts/ModernMonthlySchedule";
import ModernDayView from "@/components/shifts/ModernDayView";
import { motion, AnimatePresence } from "framer-motion";
import { useShiftData } from "@/hooks/useShiftData";
import { ScheduleActions } from "@/components/shifts/ScheduleActions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { convertDatabaseProfile } from "@/types/profile";
import type { DatabaseProfile } from "@/types/profile";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import { Shift } from "@/types/shift";


const Schedule = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('month');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [newShiftParams, setNewShiftParams] = useState<{day: Date, role: string} | null>(null);

  const { data: shifts = [], isLoading } = useShiftData(currentDate, currentView);
  
  // Type-safe shifts with proper error handling
  const typedShifts = (shifts as Shift[]).filter(shift => 
    shift.profiles && 
    typeof shift.profiles === 'object' && 
    'first_name' in shift.profiles && 
    'last_name' in shift.profiles
  );
  
  // Ensure profiles are required for components that need them
  const shiftsWithProfiles = typedShifts.map(shift => ({
    ...shift,
    profiles: {
      first_name: shift.profiles!.first_name,
      last_name: shift.profiles!.last_name,
      experience_level: shift.profiles!.experience_level || 1
    }
  }));

  const { data: profiles = [], error: profileError } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*');

      if (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }

      return (data as DatabaseProfile[] || []).map(convertDatabaseProfile);
    }
  });

  const { data: employees = [], error: employeeError } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, role')
        .order('first_name');

      if (error) {
        console.error('Error fetching employees:', error);
        return [];
      }

      return data;
    }
  });

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setIsEditDialogOpen(true);
  };

  const handleAddShift = (day: Date, role: string) => {
    setNewShiftParams({ day, role });
    setIsCreateDialogOpen(true);
  };

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
        return <ModernDayView date={currentDate} shifts={typedShifts} />;
      case 'week':
        return (
          <ManagerScheduleView 
            shifts={typedShifts} 
            profiles={profiles}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onShiftClick={handleShiftClick}
            onAddShift={handleAddShift}
          />
        );
      case 'month':
        return (
          <ModernMonthlySchedule 
            date={currentDate} 
            shifts={shiftsWithProfiles} 
            profiles={profiles} 
          />
        );
      default:
        return null;
    }
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-56px)] flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        {/* Enhanced unified header with better visual hierarchy */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-20 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
              <CalendarHeader
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                currentView={currentView}
                onViewChange={setCurrentView}
              />
              <ScheduleActions
                currentView={currentView}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                shifts={shiftsWithProfiles}
                isCreateDialogOpen={isCreateDialogOpen}
                setIsCreateDialogOpen={setIsCreateDialogOpen}
              />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden"
          >
            <div className="h-full max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
              {renderView()}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Edit Shift Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            {selectedShift && (
              <ShiftForm
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                defaultValues={{
                  start_time: selectedShift.start_time.slice(0, 16),
                  end_time: selectedShift.end_time.slice(0, 16),
                  department: selectedShift.department || "",
                  notes: selectedShift.notes || "",
                  employee_id: selectedShift.employee_id || "",
                  shift_type: selectedShift.shift_type
                }}
                editMode
                shiftId={selectedShift.id}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Create Shift Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            {newShiftParams && (
              <ShiftForm
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                defaultValues={{
                  start_time: `${newShiftParams.day.toISOString().slice(0, 10)}T09:00`,
                  end_time: `${newShiftParams.day.toISOString().slice(0, 10)}T16:00`,
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Schedule;
