
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  FileDown,
  Clock,
  MapPin,
  Sunrise,
  Sun,
  Moon,
  CalendarDays,
  TimerIcon
} from "lucide-react";
import { 
  addWeeks, 
  subWeeks, 
  format, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  differenceInHours,
  isSameMonth,
  isToday,
  isThisWeek
} from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from 'xlsx';
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { Shift, ShiftType } from "@/types/shift";

interface EmployeeScheduleProps {
  employeeId: string;
}

interface ExtendedShift extends Shift {
  profiles?: {
    first_name: string;
    last_name: string;
    experience_level?: number;
  };
}

// Shift type configurations with modern icons and colors
const SHIFT_CONFIG = {
  day: {
    icon: Sun,
    label: 'Dagpass',
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    badgeColor: 'bg-amber-100 text-amber-800',
    iconColor: 'text-amber-600'
  },
  evening: {
    icon: Sunrise,
    label: 'Kvällspass',
    color: 'bg-orange-50 border-orange-200 text-orange-800',
    badgeColor: 'bg-orange-100 text-orange-800',
    iconColor: 'text-orange-600'
  },
  night: {
    icon: Moon,
    label: 'Nattpass',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    iconColor: 'text-indigo-600'
  }
};

export const EmployeeSchedule = ({ employeeId }: EmployeeScheduleProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');
  const { toast } = useToast();

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['employee-shifts', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          profiles:employee_id (
            first_name,
            last_name,
            experience_level
          )
        `)
        .eq('employee_id', employeeId)
        .order('start_time');

      if (error) throw error;
      return data as ExtendedShift[];
    }
  });

  const handleDateChange = (direction: 'prev' | 'next') => {
    if (view === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    }
  };

  const getFilteredShifts = () => {
    if (!shifts) return [];
    
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return shifts.filter(shift => {
        const shiftDate = parseISO(shift.start_time);
        return shiftDate >= weekStart && shiftDate <= weekEnd;
      });
    } else {
      return shifts.filter(shift => {
        const shiftDate = parseISO(shift.start_time);
        return isSameMonth(shiftDate, currentDate);
      });
    }
  };

  const getShiftDuration = (shift: ExtendedShift) => {
    const start = parseISO(shift.start_time);
    const end = parseISO(shift.end_time);
    return differenceInHours(end, start);
  };

  const getWeekDays = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  };

  const getShiftsForDay = (day: Date) => {
    return getFilteredShifts().filter(shift => 
      isSameDay(parseISO(shift.start_time), day)
    );
  };

  const handleExportToExcel = () => {
    try {
      const filteredShifts = getFilteredShifts();
      if (!filteredShifts.length) {
        toast({
          title: "Inga pass att exportera",
          description: "Det finns inga schemalagda pass för denna period.",
          variant: "default",
        });
        return;
      }

      const excelData = filteredShifts.map(shift => ({
        'Datum': format(parseISO(shift.start_time), 'yyyy-MM-dd'),
        'Starttid': format(parseISO(shift.start_time), 'HH:mm'),
        'Sluttid': format(parseISO(shift.end_time), 'HH:mm'),
        'Avdelning': shift.department,
        'Typ': SHIFT_CONFIG[shift.shift_type].label,
        'Timmar': getShiftDuration(shift)
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Mitt Schema');
      
      // Get employee name from first shift for filename
      const employeeName = filteredShifts[0]?.profiles?.first_name || 'schema';
      const periodText = view === 'week' 
        ? `vecka-${format(currentDate, 'w', { locale: sv })}`
        : format(currentDate, 'yyyy-MM');
      XLSX.writeFile(wb, `${employeeName}-schema-${periodText}.xlsx`);

      toast({
        title: "Schema exporterat",
        description: "Ditt schema har exporterats som Excel-fil.",
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-full h-24" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const filteredShifts = getFilteredShifts();
  const totalHours = filteredShifts.reduce((sum, shift) => sum + getShiftDuration(shift), 0);

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl">
                  {view === 'week' 
                    ? `Vecka ${format(currentDate, 'w', { locale: sv })}`
                    : format(currentDate, 'MMMM yyyy', { locale: sv })}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredShifts.length} pass • {totalHours} timmar
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDateChange('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentDate(new Date())}
                  className="text-sm px-3"
                >
                  Idag
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDateChange('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant={view === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('week')}
                >
                  Vecka
                </Button>
                <Button
                  variant={view === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('month')}
                >
                  Månad
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportToExcel}
                disabled={!filteredShifts.length}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportera
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Week view */}
      {view === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {getWeekDays().map((day, index) => {
            const dayShifts = getShiftsForDay(day);
            const isCurrentDay = isToday(day);
            
            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full ${isCurrentDay ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {format(day, 'EEEE', { locale: sv })}
                        </p>
                        <p className={`text-lg font-semibold ${isCurrentDay ? 'text-primary' : ''}`}>
                          {format(day, 'd')}
                        </p>
                      </div>
                      {dayShifts.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {dayShifts.length}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {dayShifts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Ledig
                        </p>
                      ) : (
                        dayShifts.map((shift) => {
                          const config = SHIFT_CONFIG[shift.shift_type];
                          const Icon = config.icon;
                          
                          return (
                            <div
                              key={shift.id}
                              className={`p-3 rounded-lg border ${config.color} transition-all hover:shadow-sm`}
                            >
                              <div className="flex items-start gap-2">
                                <Icon className={`h-4 w-4 mt-0.5 ${config.iconColor}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge className={`text-xs ${config.badgeColor}`}>
                                      {config.label}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-sm">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        {format(parseISO(shift.start_time), 'HH:mm')} - {format(parseISO(shift.end_time), 'HH:mm')}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm">
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate">{shift.department}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <TimerIcon className="h-3 w-3" />
                                      <span>{getShiftDuration(shift)} timmar</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {shift.notes && (
                                <p className="text-xs text-muted-foreground mt-2 italic">
                                  {shift.notes}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Month view */}
      {view === 'month' && (
        <div className="space-y-4">
          {filteredShifts.length === 0 ? (
            <Card className="p-12 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Inga pass denna månad</h3>
              <p className="text-muted-foreground">
                Du har inga schemalagda pass för {format(currentDate, 'MMMM yyyy', { locale: sv })}.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShifts.map((shift, index) => {
                const config = SHIFT_CONFIG[shift.shift_type];
                const Icon = config.icon;
                const shiftDate = parseISO(shift.start_time);
                const isThisWeekShift = isThisWeek(shiftDate);
                
                return (
                  <motion.div
                    key={shift.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`${isThisWeekShift ? 'ring-2 ring-primary/20' : ''} hover:shadow-md transition-all`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-1 ${config.iconColor}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`text-xs ${config.badgeColor}`}>
                                {config.label}
                              </Badge>
                              {isThisWeekShift && (
                                <Badge variant="outline" className="text-xs">
                                  Denna vecka
                                </Badge>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {format(shiftDate, 'EEEE d MMMM', { locale: sv })}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {format(parseISO(shift.start_time), 'HH:mm')} - {format(parseISO(shift.end_time), 'HH:mm')}
                                </span>
                                <span className="text-muted-foreground">
                                  ({getShiftDuration(shift)}h)
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{shift.department}</span>
                              </div>
                            </div>
                            
                            {shift.notes && (
                              <p className="text-sm text-muted-foreground mt-3 italic">
                                {shift.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
