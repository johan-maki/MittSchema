import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { CalendarHeader } from "@/components/shifts/CalendarHeader";
import { WeekView } from "@/components/shifts/WeekView";
import { ManagerScheduleView } from "@/components/shifts/ManagerScheduleView";
import { ModernMonthlySchedule } from "@/components/shifts/ModernMonthlySchedule";
import ModernDayView from "@/components/shifts/ModernDayView";
import { GanttScheduleView } from "@/components/schedule/GanttScheduleView";
import { ScheduleEditorView } from "@/components/schedule/ScheduleEditorView";
import { AIConstraintInput } from "@/components/schedule/AIConstraintInput";
import { motion, AnimatePresence } from "framer-motion";
import { useShiftData } from "@/hooks/useShiftData";
import { ScheduleActions } from "@/components/shifts/ScheduleActions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { convertDatabaseProfile } from "@/types/profile";
import type { DatabaseProfile } from "@/types/profile";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import { Shift } from "@/types/shift";
import { Button } from "@/components/ui/button";
import { Calendar, GanttChartSquare, Edit3, Brain } from "lucide-react";
import type { ParsedConstraint } from "@/utils/constraintParser";
import { bulkSaveShifts } from "@/utils/shiftBulkOperations";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";


const Schedule = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('month');
  const [scheduleViewMode, setScheduleViewMode] = useState<'standard' | 'gantt' | 'editor'>('standard');
  const [aiConstraints, setAiConstraints] = useState<ParsedConstraint[]>([]);
  const [showAIConstraints, setShowAIConstraints] = useState(false); // New: control visibility
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [newShiftParams, setNewShiftParams] = useState<{day: Date, role: string} | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

    // Gantt view - works regardless of day/week/month selection
    if (scheduleViewMode === 'gantt') {
      const ganttShifts = typedShifts.map(shift => ({
        id: shift.id,
        employee_id: shift.employee_id || '',
        employee_name: shift.profiles ? `${shift.profiles.first_name} ${shift.profiles.last_name}` : 'Unknown',
        date: new Date(shift.start_time).toISOString().split('T')[0],
        shift_type: shift.shift_type as 'day' | 'evening' | 'night',
        start_time: new Date(shift.start_time).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
        end_time: new Date(shift.end_time).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
      }));

      // Calculate date range based on shifts
      const dates = ganttShifts.map(s => new Date(s.date));
      const startDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : currentDate;
      const endDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : currentDate;

      return <GanttScheduleView shifts={ganttShifts} startDate={startDate} endDate={endDate} />;
    }

    // Editor view
    if (scheduleViewMode === 'editor') {
      const editorShifts = typedShifts.map(shift => ({
        id: shift.id,
        employee_id: shift.employee_id || '',
        employee_name: shift.profiles ? `${shift.profiles.first_name} ${shift.profiles.last_name}` : 'Unknown',
        date: new Date(shift.start_time).toISOString().split('T')[0],
        shift_type: shift.shift_type as 'day' | 'evening' | 'night' | 'off',
      }));

      // Calculate date range
      const dates = editorShifts.map(s => new Date(s.date));
      const startDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : currentDate;
      const endDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : currentDate;

      return (
        <ScheduleEditorView 
          shifts={editorShifts} 
          employees={employees}
          profiles={profiles}
          startDate={startDate}
          endDate={endDate}
          onSave={async (modifiedShifts) => {
            if (!user) {
              toast({
                title: "Fel",
                description: "Du måste vara inloggad för att spara ändringar",
                variant: "destructive",
              });
              return;
            }

            console.log('Saving modified shifts:', modifiedShifts);
            
            const result = await bulkSaveShifts(editorShifts, modifiedShifts, user.id);
            
            if (result.success) {
              toast({
                title: "Schema sparat",
                description: "Alla ändringar har sparats",
              });
              
              // Invalidate queries to refresh the schedule
              queryClient.invalidateQueries({ queryKey: ['shifts'] });
              queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
              
              // Optionally switch back to standard view
              // setScheduleViewMode('standard');
            } else {
              toast({
                title: "Fel vid sparande",
                description: result.error || "Kunde inte spara schemat",
                variant: "destructive",
              });
            }
          }}
        />
      );
    }

    // Standard calendar views
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
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        {/* Enhanced unified header with better visual hierarchy */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-20 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                <CalendarHeader
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
                  currentView={currentView}
                  onViewChange={setCurrentView}
                />
                {/* View mode toggle */}
                <div className="flex gap-1 border rounded-lg p-1 bg-white">
                  <Button
                    variant={scheduleViewMode === 'standard' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setScheduleViewMode('standard')}
                    className="gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Kalender
                  </Button>
                  <Button
                    variant={scheduleViewMode === 'gantt' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setScheduleViewMode('gantt')}
                    className="gap-2"
                  >
                    <GanttChartSquare className="h-4 w-4" />
                    Gantt
                  </Button>
                  <Button
                    variant={scheduleViewMode === 'editor' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setScheduleViewMode('editor')}
                    className="gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Redigera
                  </Button>
                </div>
              </div>
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

        {/* AI Constraint Input Section - Only show when schedule exists and in standard view */}
        {scheduleViewMode === 'standard' && typedShifts.length > 0 && (
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-4">
            {!showAIConstraints ? (
              <Button
                variant="outline"
                onClick={() => setShowAIConstraints(true)}
                className="w-full border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <Brain className="h-4 w-4 mr-2" />
                Lägg till AI-baserade schemavillkor
              </Button>
            ) : (
              <div className="space-y-4">
                <AIConstraintInput 
                  employees={profiles.map(p => ({
                    id: p.id,
                    first_name: p.first_name,
                    last_name: p.last_name
                  }))}
                  onConstraintsChange={(constraints) => {
                    setAiConstraints(constraints);
                    console.log('AI Constraints updated:', constraints);
                    // TODO: Pass to scheduler optimization
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIConstraints(false)}
                  className="w-full"
                >
                  Dölj AI-villkor
                </Button>
              </div>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto"
          >
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
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
