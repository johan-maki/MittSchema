import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { CalendarHeader } from "@/components/shifts/CalendarHeader";
import { WeekView } from "@/components/shifts/WeekView";
import { ManagerScheduleView } from "@/components/shifts/ManagerScheduleView";
import { ModernMonthlySchedule } from "@/components/shifts/ModernMonthlySchedule";
import ModernDayView from "@/components/shifts/ModernDayView";
import { GanttScheduleView } from "@/components/schedule/GanttScheduleView";
import { ScheduleEditorView } from "@/components/schedule/ScheduleEditorView";
import { AIConstraintInput } from "@/components/schedule/AIConstraintInput";
import { OptimizationScoreComparison } from "@/components/schedule/OptimizationScoreComparison";
import { ScheduleFilters, type ScheduleFilterOptions } from "@/components/schedule/ScheduleFilters";
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
import { Badge } from "@/components/ui/badge";
import { Calendar, GanttChartSquare, Edit3, Brain, Filter, FilterX } from "lucide-react";
import { bulkSaveShifts } from "@/utils/shiftBulkOperations";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { filterShifts, countActiveFilters, getUniqueDepartments, getFilterSummary } from "@/utils/scheduleFilters";


const Schedule = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('month');
  const [scheduleViewMode, setScheduleViewMode] = useState<'standard' | 'gantt' | 'editor'>('standard');
  const [aiConstraints, setAiConstraints] = useState<unknown[]>([]);
  const [showAIConstraints, setShowAIConstraints] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ScheduleFilterOptions>({
    shiftType: 'all',
    experienceLevel: 'all',
    publicationStatus: 'all',
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [newShiftParams, setNewShiftParams] = useState<{day: Date, role: string} | null>(null);
  
  // Schedule generation state from ScheduleActions
  const [scheduleGenerationState, setScheduleGenerationState] = useState<{
    isGenerating: boolean;
    previousOptimizationScore?: number;
    currentOptimizationScore?: number;
    generateSchedule?: () => void;
  }>({
    isGenerating: false
  });

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
        .select('id, first_name, last_name, role, department')
        .order('first_name');

      if (error) {
        console.error('Error fetching employees:', error);
        return [];
      }

      return data;
    }
  });

  // Compute unique departments from employees
  const availableDepartments = useMemo(() => {
    return getUniqueDepartments(employees);
  }, [employees]);

  // Apply filters to shifts
  const filteredShifts = useMemo(() => {
    return filterShifts(typedShifts, filters);
  }, [typedShifts, filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return countActiveFilters(filters);
  }, [filters]);

  // Get filter summary
  const filterSummary = useMemo(() => {
    return getFilterSummary(filters, typedShifts.length, filteredShifts.length, employees);
  }, [filters, typedShifts.length, filteredShifts.length, employees]);

  // Ensure profiles are required for components that need them
  const shiftsWithProfiles = filteredShifts.map(shift => ({
    ...shift,
    profiles: {
      first_name: shift.profiles!.first_name,
      last_name: shift.profiles!.last_name,
      experience_level: shift.profiles!.experience_level || 1
    }
  }));

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
      const ganttShifts = filteredShifts.map(shift => ({
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
      const editorShifts = filteredShifts.map(shift => ({
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
        return <ModernDayView date={currentDate} shifts={filteredShifts} />;
      case 'week':
        return (
          <ManagerScheduleView 
            shifts={filteredShifts} 
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
        {/* Enhanced unified header with better visual hierarchy - positioned below AppLayout header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-14 z-20 shadow-sm">
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

                {/* Filter toggle button */}
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-indigo-600 text-white">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </div>
              <ScheduleActions
                currentView={currentView}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                shifts={shiftsWithProfiles}
                isCreateDialogOpen={isCreateDialogOpen}
                setIsCreateDialogOpen={setIsCreateDialogOpen}
                aiConstraints={aiConstraints}
                onScheduleStateChange={setScheduleGenerationState}
              />
            </div>
          </div>
        </header>

        {/* Filters Section - Show when filters are toggled */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-b border-gray-200/60 bg-white/50 backdrop-blur-sm"
            >
              <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
                <ScheduleFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  employees={employees}
                  availableDepartments={availableDepartments}
                  activeFilterCount={activeFilterCount}
                />
                
                {/* Filter summary badge */}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {filterSummary}
                  </p>
                  {activeFilterCount > 0 && (
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      {filteredShifts.length} resultat
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  }}
                  onGenerateSchedule={scheduleGenerationState.generateSchedule}
                  isGenerating={scheduleGenerationState.isGenerating}
                  previousOptimizationScore={scheduleGenerationState.previousOptimizationScore}
                  currentOptimizationScore={scheduleGenerationState.currentOptimizationScore}
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
              {/* Empty state when filters return no results */}
              {activeFilterCount > 0 && filteredShifts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full p-6 mb-4">
                    <Filter className="h-12 w-12 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Inga pass matchar dina filter
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-md">
                    Inga schemapass hittades med de valda filterkriterierna. 
                    Prova att justera filtren eller rensa dem för att se alla pass.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ 
                      shiftType: 'all', 
                      experienceLevel: 'all', 
                      publicationStatus: 'all' 
                    })}
                    className="gap-2"
                  >
                    <FilterX className="h-4 w-4" />
                    Rensa alla filter
                  </Button>
                </div>
              ) : (
                renderView()
              )}
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
