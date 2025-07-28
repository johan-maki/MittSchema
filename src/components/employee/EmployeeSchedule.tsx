
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
import { useQueryClient } from "@tanstack/react-query";

interface EmployeeScheduleProps {
  employeeId: string;
}

interface ExtendedShift extends Shift {
  employees?: {
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
  const queryClient = useQueryClient();

  const { data: shifts, isLoading, error } = useQuery({
    queryKey: ['employee-shifts', employeeId],
    queryFn: async () => {
      console.log('🔍 Fetching shifts for employee:', employeeId);
      
      // Get shifts for the last 3 months and next 3 months to provide comprehensive view
      const now = new Date();
      const startDate = subMonths(now, 3);
      const endDate = addMonths(now, 3);
      
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          id,
          start_time,
          end_time,
          shift_type,
          department,
          is_published,
          notes,
          employee_id,
          employees!inner (
            first_name,
            last_name,
            experience_level
          )
        `)
        .eq('employee_id', employeeId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time');

      if (error) {
        console.error('❌ Error fetching shifts:', error);
        // Fallback to simpler query if JOIN fails
        console.log('🔄 Attempting fallback query without JOIN...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('shifts')
          .select('*')
          .eq('employee_id', employeeId)
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString())
          .order('start_time');
          
        if (fallbackError) {
          console.error('❌ Fallback query also failed:', fallbackError);
          throw fallbackError;
        }
        
        console.log('✅ Fallback query successful:', fallbackData?.length || 0, 'shifts');
        return fallbackData as Shift[];
      }
      
      console.log('✅ Fetched shifts with employee data:', data?.length || 0, 'shifts for employee', employeeId);
      console.log('Shifts data:', data);
      
      return data as ExtendedShift[];
    },
    // Optimize caching for better UX
    staleTime: 5 * 60 * 1000, // 5 minutes - reasonable for schedule data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2 // Retry failed requests twice
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

  const handleExportToExcel = async () => {
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

      // Get employee information for better export
      const { data: employeeData } = await supabase
        .from('employees')
        .select('first_name, last_name, role, department')
        .eq('id', employeeId)
        .single();

      const employeeName = employeeData 
        ? `${employeeData.first_name}_${employeeData.last_name}` 
        : 'employee';

      // Enhanced Excel data with more useful information
      const excelData = filteredShifts.map((shift, index) => {
        const shiftDate = parseISO(shift.start_time);
        const duration = getShiftDuration(shift);
        
        return {
          'Nr': index + 1,
          'Datum': format(shiftDate, 'yyyy-MM-dd'),
          'Veckodag': format(shiftDate, 'EEEE', { locale: sv }),
          'Starttid': format(parseISO(shift.start_time), 'HH:mm'),
          'Sluttid': format(parseISO(shift.end_time), 'HH:mm'),
          'Passtyp': SHIFT_CONFIG[shift.shift_type].label,
          'Avdelning': shift.department,
          'Timmar': duration,
          'Status': shift.is_published ? 'Publicerat' : 'Utkast',
          'Anteckningar': shift.notes || ''
        };
      });

      // Add summary row
      const totalHours = filteredShifts.reduce((sum, shift) => sum + getShiftDuration(shift), 0);
      const shiftTypeCounts = filteredShifts.reduce((acc, shift) => {
        acc[shift.shift_type] = (acc[shift.shift_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      excelData.push({
        'Nr': '',
        'Datum': '',
        'Veckodag': '',
        'Starttid': '',
        'Sluttid': '',
        'Passtyp': 'TOTALT:',
        'Avdelning': '',
        'Timmar': totalHours,
        'Status': '',
        'Anteckningar': `Dagpass: ${shiftTypeCounts.day || 0}, Kvällspass: ${shiftTypeCounts.evening || 0}, Nattpass: ${shiftTypeCounts.night || 0}`
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 5 },  // Nr
        { wch: 12 }, // Datum
        { wch: 10 }, // Veckodag
        { wch: 8 },  // Starttid
        { wch: 8 },  // Sluttid
        { wch: 12 }, // Passtyp
        { wch: 15 }, // Avdelning
        { wch: 8 },  // Timmar
        { wch: 10 }, // Status
        { wch: 30 }  // Anteckningar
      ];
      ws['!cols'] = columnWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Mitt Schema');
      
      const periodText = view === 'week' 
        ? `vecka-${format(currentDate, 'w', { locale: sv })}-${format(currentDate, 'yyyy')}`
        : format(currentDate, 'yyyy-MM');
      
      const filename = `${employeeName}-schema-${periodText}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({
        title: "Schema exporterat! 📊",
        description: `Ditt schema har exporterats som ${filename}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Exportering misslyckades",
        description: "Ett fel uppstod vid exportering av schemat.",
        variant: "destructive",
      });
    }
  };
        variant: "destructive",
      });
    }
  };

  const handleRefreshData = () => {
    console.log('🔄 Manually refreshing data...');
    queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
    queryClient.invalidateQueries({ queryKey: ['debug-all-shifts'] });
    toast({
      title: "Data uppdaterad",
      description: "Schemat har uppdaterats från databasen.",
      variant: "default",
    });
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

  if (error) {
    console.error('Query error:', error);
    return (
      <Card className="p-8 text-center">
        <h3 className="text-lg font-medium mb-2 text-red-600">Fel vid hämtning av schema</h3>
        <p className="text-muted-foreground mb-4">
          Kunde inte hämta schemaData från databasen.
        </p>
        <p className="text-sm text-red-500">
          Error: {error?.message || 'Okänt fel'}
        </p>
      </Card>
    );
  }

  const filteredShifts = getFilteredShifts();
  const totalHours = filteredShifts.reduce((sum, shift) => sum + getShiftDuration(shift), 0);
  
  // Calculate statistics for current period
  const stats = {
    totalShifts: filteredShifts.length,
    totalHours,
    averageHoursPerShift: filteredShifts.length > 0 ? Math.round((totalHours / filteredShifts.length) * 10) / 10 : 0,
    shiftTypes: filteredShifts.reduce((acc, shift) => {
      acc[shift.shift_type] = (acc[shift.shift_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    weekends: filteredShifts.filter(shift => {
      const day = parseISO(shift.start_time).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    }).length,
    publishedShifts: filteredShifts.filter(shift => shift.is_published).length
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalShifts}</p>
              <p className="text-sm text-muted-foreground">Pass totalt</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.totalHours}</p>
              <p className="text-sm text-muted-foreground">Timmar totalt</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TimerIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.averageHoursPerShift}</p>
              <p className="text-sm text-muted-foreground">Snitt per pass</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CalendarDays className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.weekends}</p>
              <p className="text-sm text-muted-foreground">Helgpass</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Shift type breakdown */}
      {stats.totalShifts > 0 && (
        <Card className="p-4">
          <CardTitle className="text-lg mb-4">Fördelning av passtyper</CardTitle>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(SHIFT_CONFIG).map(([type, config]) => {
              const count = stats.shiftTypes[type] || 0;
              const percentage = stats.totalShifts > 0 ? Math.round((count / stats.totalShifts) * 100) : 0;
              const Icon = config.icon;
              
              return (
                <div key={type} className="text-center">
                  <div className={`p-3 rounded-lg ${config.color} mb-2`}>
                    <Icon className={`h-6 w-6 mx-auto ${config.iconColor}`} />
                  </div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{percentage}%</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
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
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
              >
                🔄 Uppdatera
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
                                    {!shift.is_published && (
                                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                        Utkast
                                      </Badge>
                                    )}
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
                              {!shift.is_published && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                  Utkast
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
