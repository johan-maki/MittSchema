import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Sun,
  Sunrise,
  Moon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  MoreHorizontal,
  UserCheck,
  UserX
} from "lucide-react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  parseISO,
  addWeeks,
  subWeeks,
  isToday,
  isSameMonth,
  differenceInHours
} from "date-fns";
import { sv } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Shift } from "@/types/shift";
import { Profile } from "@/types/profile";

interface ManagerScheduleViewProps {
  shifts: Shift[];
  profiles: Profile[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onShiftClick?: (shift: Shift) => void;
  onAddShift?: (day: Date, role: string) => void;
  currentView?: 'day' | 'week' | 'month';
  onViewChange?: (view: 'day' | 'week' | 'month') => void;
}

// Modern shift type configuration
const SHIFT_TYPES = {
  day: {
    icon: Sun,
    label: 'Dag',
    time: '08:00-16:00',
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-50 border-amber-200',
    textColor: 'text-amber-900',
    badgeColor: 'bg-amber-100 text-amber-800'
  },
  evening: {
    icon: Sunrise,
    label: 'Kväll',
    time: '16:00-00:00',
    color: 'from-orange-400 to-red-500',
    bgColor: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-900',
    badgeColor: 'bg-orange-100 text-orange-800'
  },
  night: {
    icon: Moon,
    label: 'Natt',
    time: '00:00-08:00',
    color: 'from-indigo-400 to-purple-500',
    bgColor: 'bg-indigo-50 border-indigo-200',
    textColor: 'text-indigo-900',
    badgeColor: 'bg-indigo-100 text-indigo-800'
  }
};

const ROLE_COLORS = {
  'Läkare': 'from-blue-500 to-cyan-500',
  'Sjuksköterska': 'from-green-500 to-emerald-500',
  'Undersköterska': 'from-purple-500 to-violet-500'
};

export const ManagerScheduleView = ({ 
  shifts, 
  profiles, 
  currentDate, 
  onDateChange, 
  onShiftClick,
  onAddShift,
  currentView = 'week',
  onViewChange
}: ManagerScheduleViewProps) => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('detailed');
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Get shifts for the current week
  const weekShifts = shifts.filter(shift => {
    const shiftDate = parseISO(shift.start_time);
    return shiftDate >= weekStart && shiftDate <= weekEnd;
  });

  // Calculate statistics
  const stats = {
    totalShifts: weekShifts.length,
    totalHours: weekShifts.reduce((sum, shift) => {
      return sum + differenceInHours(parseISO(shift.end_time), parseISO(shift.start_time));
    }, 0),
    staffedDays: weekDays.filter(day => 
      weekShifts.some(shift => isSameDay(parseISO(shift.start_time), day))
    ).length,
    coverage: Math.round((weekShifts.length / (weekDays.length * 3)) * 100) // Assuming 3 shifts per day
  };

  const getShiftsForDay = (day: Date) => {
    return weekShifts.filter(shift => 
      isSameDay(parseISO(shift.start_time), day)
    );
  };

  const getEmployeeById = (employeeId: string) => {
    return profiles.find(p => p.id === employeeId);
  };

  const getEmployeeInitials = (employee: Profile | undefined) => {
    if (!employee) return '?';
    return `${employee.first_name[0]}${employee.last_name[0]}`;
  };

  const getShiftsByType = (dayShifts: Shift[]) => {
    return {
      day: dayShifts.filter(s => s.shift_type === 'day'),
      evening: dayShifts.filter(s => s.shift_type === 'evening'),
      night: dayShifts.filter(s => s.shift_type === 'night')
    };
  };

  const isFullyStaffed = (dayShifts: Shift[]) => {
    const shiftsByType = getShiftsByType(dayShifts);
    return shiftsByType.day.length >= 1 && 
           shiftsByType.evening.length >= 1 && 
           shiftsByType.night.length >= 1;
  };

  const handlePrevWeek = () => {
    onDateChange(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    onDateChange(addWeeks(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Header with statistics and controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-xl">
                    Vecka {format(currentDate, 'w', { locale: sv })} • {format(currentDate, 'yyyy')}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(weekStart, 'd MMM', { locale: sv })} - {format(weekEnd, 'd MMM', { locale: sv })}
                  </p>
                </div>
              </div>
              
              {/* Quick stats */}
              <div className="hidden lg:flex items-center gap-6 ml-8">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{stats.totalHours}h</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{stats.totalShifts} pass</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">{stats.coverage}% täckning</span>
                </div>
              </div>
            </div>

            {/* Navigation and controls */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleToday} className="text-sm">
                Idag
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              {/* View selector */}
              {onViewChange && (
                <div className="ml-4 flex items-center gap-1">
                  <Button 
                    variant={currentView === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onViewChange('day')}
                  >
                    Dag
                  </Button>
                  <Button 
                    variant={currentView === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onViewChange('week')}
                  >
                    Vecka
                  </Button>
                  <Button 
                    variant={currentView === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onViewChange('month')}
                  >
                    Månad
                  </Button>
                </div>
              )}
              
              <div className="ml-4 flex items-center gap-2">
                <Button 
                  variant={viewMode === 'compact' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('compact')}
                >
                  Kompakt
                </Button>
                <Button 
                  variant={viewMode === 'detailed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('detailed')}
                >
                  Detaljerad
                </Button>
              </div>


            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:hidden">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{stats.totalHours}h</p>
                <p className="text-xs text-muted-foreground">Totalt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">{stats.totalShifts}</p>
                <p className="text-xs text-muted-foreground">Pass</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">{stats.coverage}%</p>
                <p className="text-xs text-muted-foreground">Täckning</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-sm font-medium">{stats.staffedDays}/7</p>
                <p className="text-xs text-muted-foreground">Dagar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main schedule grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map((day, dayIndex) => {
          const dayShifts = getShiftsForDay(day);
          const shiftsByType = getShiftsByType(dayShifts);
          const isFullStaffed = isFullyStaffed(dayShifts);
          const isCurrentDay = isToday(day);
          
          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.1 }}
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
                    <div className="flex items-center gap-1">
                      {isFullStaffed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : dayShifts.length > 0 ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <UserX className="h-4 w-4 text-red-500" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {dayShifts.length}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Day shifts */}
                    {Object.entries(shiftsByType).map(([shiftType, shifts]) => {
                      const config = SHIFT_TYPES[shiftType as keyof typeof SHIFT_TYPES];
                      const Icon = config.icon;
                      
                      return (
                        <div key={shiftType} className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">
                              {config.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {config.time}
                            </span>
                          </div>
                          
                          {shifts.length === 0 ? (
                            <div 
                              className="h-8 border-2 border-dashed border-gray-200 rounded flex items-center justify-center cursor-pointer hover:border-gray-300 transition-colors"
                              onClick={() => onAddShift?.(day, shiftType)}
                            >
                              <span className="text-xs text-gray-400">Lägg till</span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {shifts.map((shift) => {
                                const employee = getEmployeeById(shift.employee_id);
                                const roleGradient = employee ? ROLE_COLORS[employee.role as keyof typeof ROLE_COLORS] : 'from-gray-400 to-gray-500';
                                
                                return (
                                  <motion.div
                                    key={shift.id}
                                    whileHover={{ scale: 1.02 }}
                                    className={`${config.bgColor} border rounded-lg p-2 cursor-pointer hover:shadow-sm transition-all`}
                                    onClick={() => onShiftClick?.(shift)}
                                  >
                                    {viewMode === 'detailed' ? (
                                      <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${roleGradient} flex items-center justify-center`}>
                                          <span className="text-xs font-medium text-white">
                                            {getEmployeeInitials(employee)}
                                          </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium truncate">
                                            {employee ? `${employee.first_name} ${employee.last_name}` : 'Okänd'}
                                          </p>
                                          <p className="text-xs text-muted-foreground truncate">
                                            {employee?.role}
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center">
                                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${roleGradient} flex items-center justify-center`}>
                                          <span className="text-xs font-medium text-white">
                                            {getEmployeeInitials(employee)}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-xs">Fullbemannat</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-xs">Delbemannat</span>
              </div>
              <div className="flex items-center gap-1">
                <UserX className="h-4 w-4 text-red-500" />
                <span className="text-xs">Obemannat</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Roller:</span>
              {Object.entries(ROLE_COLORS).map(([role, gradient]) => (
                <div key={role} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${gradient}`} />
                  <span className="text-xs">{role}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
