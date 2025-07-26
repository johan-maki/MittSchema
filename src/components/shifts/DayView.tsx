
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

const DayView = ({ date, shifts }: DayViewProps) => {
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

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 min-h-[calc(100vh-200px)]">
      {/* Day Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {format(date, 'EEEE', { locale: sv })}
        </h1>
        <p className="text-lg text-gray-600">
          {format(date, 'd MMMM yyyy', { locale: sv })}
        </p>
        <div className="mt-4 flex items-center justify-center space-x-4">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{dayShifts.length} pass schemalagda</span>
          </Badge>
        </div>
      </div>

      {/* Shifts by Type */}
      <div className="grid gap-6">
        {Object.entries(shiftTypeConfig).map(([shiftType, config]) => {
          const Icon = config.icon;
          const shiftsOfType = shiftsByType[shiftType as keyof typeof shiftsByType];
          
          return (
            <Card key={shiftType} className="shadow-lg border-0">
              <CardHeader className={`${config.color} rounded-t-lg`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Icon className="h-5 w-5" />
                    <span>{config.title}</span>
                    <Badge variant="secondary" className="ml-2">
                      {config.time}
                    </Badge>
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => handleAddShift(shiftType as ShiftType)}
                    className="bg-white/80 hover:bg-white text-gray-700 border-0"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Lägg till
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {shiftsOfType.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Inga pass schemalagda</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddShift(shiftType as ShiftType)}
                      className="mt-3"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Lägg till pass
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {shiftsOfType.map((shift) => (
                      <div
                        key={shift.id}
                        onClick={() => handleShiftClick(shift)}
                        className="p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-purple-100 text-purple-700 text-sm font-medium">
                              {getEmployeeInitials(shift)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {getEmployeeName(shift)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Medarbetare
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(parseISO(shift.start_time), 'HH:mm')} - {format(parseISO(shift.end_time), 'HH:mm')}
                            </span>
                          </div>
                          {shift.department && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{shift.department}</span>
                            </div>
                          )}
                          {shift.notes && (
                            <p className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                              {shift.notes}
                            </p>
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

export default DayView;
