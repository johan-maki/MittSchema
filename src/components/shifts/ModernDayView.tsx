import { Shift, ShiftType } from "@/types/shift";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShiftForm } from "./ShiftForm";
import { format, isSameDay, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { 
  Clock, 
  Plus, 
  Sun, 
  Sunset, 
  Moon, 
  Users,
  Calendar,
  MapPin
} from "lucide-react";

interface DayViewProps {
  date: Date;
  shifts: Shift[];
}

const ModernDayView = ({ date, shifts }: DayViewProps) => {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newShiftParams, setNewShiftParams] = useState<{date: Date, shiftType: ShiftType} | null>(null);

  // Filter shifts for the current day
  const dayShifts = shifts.filter(shift => 
    isSameDay(parseISO(shift.start_time), date)
  );

  // Group shifts by type
  const shiftsByType = {
    day: dayShifts.filter(s => s.shift_type === 'day'),
    evening: dayShifts.filter(s => s.shift_type === 'evening'),
    night: dayShifts.filter(s => s.shift_type === 'night')
  };

  const shiftTypeConfig = {
    day: {
      title: 'Dagpass',
      icon: Sun,
      time: '08:00 - 16:00',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    },
    evening: {
      title: 'Kvällspass',
      icon: Sunset,
      time: '16:00 - 00:00',
      color: 'bg-orange-50 border-orange-200 text-orange-800'
    },
    night: {
      title: 'Nattpass',
      icon: Moon,
      time: '00:00 - 08:00',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    }
  };

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setIsEditDialogOpen(true);
  };

  const handleAddShift = (shiftType: ShiftType) => {
    setNewShiftParams({ date, shiftType });
    setIsCreateDialogOpen(true);
  };

  const getEmployeeName = (shift: Shift) => {
    if (shift.profiles) {
      return `${shift.profiles.first_name} ${shift.profiles.last_name}`;
    }
    return 'Okänd medarbetare';
  };

  const getEmployeeInitials = (shift: Shift) => {
    if (shift.profiles) {
      return `${shift.profiles.first_name[0]}${shift.profiles.last_name[0]}`;
    }
    return '??';
  };

  const getDefaultStartTime = (shiftType: ShiftType): string => {
    const times = {
      'day': '08:00',
      'evening': '16:00', 
      'night': '00:00'
    };
    return times[shiftType] || '09:00';
  };

  const getDefaultEndTime = (shiftType: ShiftType): string => {
    const times = {
      'day': '16:00',
      'evening': '00:00',
      'night': '08:00'
    };
    return times[shiftType] || '17:00';
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50/30 to-blue-50/30 min-h-[calc(100vh-200px)]">
      {/* Enhanced Day Header */}
      <div className="text-center bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-purple-100">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent mb-2">
          {format(date, 'EEEE', { locale: sv })}
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          {format(date, 'd MMMM yyyy', { locale: sv })}
        </p>
        <div className="flex items-center justify-center space-x-6">
          <Badge variant="outline" className="flex items-center space-x-2 bg-white/80 border-purple-200">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="font-medium">{dayShifts.length} pass schemalagda</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-2 bg-white/80 border-blue-200">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="font-medium">
              {dayShifts.reduce((total, shift) => total + (shift.profiles ? 1 : 0), 0)} medarbetare
            </span>
          </Badge>
        </div>
      </div>

      {/* Enhanced Shifts by Type */}
      <div className="grid gap-6">
        {Object.entries(shiftTypeConfig).map(([shiftType, config]) => {
          const Icon = config.icon;
          const shiftsOfType = shiftsByType[shiftType as keyof typeof shiftsByType];
          
          return (
            <Card key={shiftType} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className={`${config.color} rounded-t-lg relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                <div className="relative flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-white/30 rounded-full">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-lg">{config.title}</span>
                      <Badge variant="secondary" className="ml-3 bg-white/80 text-gray-700">
                        {config.time}
                      </Badge>
                    </div>
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => handleAddShift(shiftType as ShiftType)}
                    className="bg-white/90 hover:bg-white text-gray-700 border-0 shadow-sm hover:shadow-md transition-all"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till pass
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {shiftsOfType.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="bg-gray-50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-10 w-10 text-gray-300" />
                    </div>
                    <p className="text-lg font-medium mb-2">Inga pass schemalagda</p>
                    <p className="text-sm text-gray-400 mb-4">Klicka nedan för att lägga till ett nytt pass</p>
                    <Button
                      variant="outline"
                      onClick={() => handleAddShift(shiftType as ShiftType)}
                      className="border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Lägg till pass
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {shiftsOfType.map((shift) => (
                      <div
                        key={shift.id}
                        onClick={() => handleShiftClick(shift)}
                        className="group p-5 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1"
                      >
                        <div className="flex items-center space-x-3 mb-4">
                          <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm group-hover:ring-purple-200">
                            <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700 text-sm font-bold">
                              {getEmployeeInitials(shift)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-lg">
                              {getEmployeeName(shift)}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              Medarbetare
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                            <div className="flex items-center space-x-2 text-blue-700">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">
                                {format(parseISO(shift.start_time), 'HH:mm')} - {format(parseISO(shift.end_time), 'HH:mm')}
                              </span>
                            </div>
                            <Badge variant="secondary" className="bg-white/80 text-blue-700">
                              {(() => {
                                const start = parseISO(shift.start_time);
                                const end = parseISO(shift.end_time);
                                const hours = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                return `${hours.toFixed(1)}h`;
                              })()}
                            </Badge>
                          </div>
                          
                          {shift.department && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{shift.department}</span>
                            </div>
                          )}
                          
                          {shift.notes && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-xs text-amber-800 font-medium">
                                💡 {shift.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

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
                start_time: `${format(newShiftParams.date, 'yyyy-MM-dd')}T${getDefaultStartTime(newShiftParams.shiftType)}`,
                end_time: `${format(newShiftParams.date, 'yyyy-MM-dd')}T${getDefaultEndTime(newShiftParams.shiftType)}`,
                shift_type: newShiftParams.shiftType
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModernDayView;
