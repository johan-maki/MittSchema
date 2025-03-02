
import { Shift, ShiftType } from "@/types/shift";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShiftForm } from "./ShiftForm";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ROLES, ROLE_COLORS } from "./schedule.constants";
import { format, isSameDay, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DayViewProps {
  date: Date;
  shifts: Shift[];
}

const HOURS = Array.from({ length: 23 }, (_, i) => i + 1);

const DayView = ({ date, shifts }: DayViewProps) => {
  const [hiddenRoles, setHiddenRoles] = useState<Set<string>>(new Set());
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newShiftParams, setNewShiftParams] = useState<{date: Date, role: string} | null>(null);

  const shiftsWithProfiles = shifts.map(shift => ({
    ...shift,
    profiles: shift.profiles || { first_name: '', last_name: '' }
  }));

  const toggleRole = (roleName: string) => {
    const newHiddenRoles = new Set(hiddenRoles);
    if (hiddenRoles.has(roleName)) {
      newHiddenRoles.delete(roleName);
    } else {
      newHiddenRoles.add(roleName);
    }
    setHiddenRoles(newHiddenRoles);
  };

  const roleToShiftType: { [key: string]: ShiftType } = {
    'Läkare': 'day',
    'Sjuksköterska': 'evening',
    'Undersköterska': 'night'
  };

  const getShiftsForRole = (role: string) => {
    return shiftsWithProfiles.filter(shift => {
      const shiftDate = parseISO(shift.start_time);
      const roleShiftType = roleToShiftType[role];
      return isSameDay(shiftDate, date) && shift.shift_type === roleShiftType;
    });
  };

  const calculateShiftPosition = (shift: Shift) => {
    const startTime = new Date(shift.start_time);
    const endTime = new Date(shift.end_time);
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    
    const startPercent = (startHour / 24) * 100;
    const widthPercent = ((endHour - startHour) / 24) * 100;
    
    return { startPercent, widthPercent };
  };

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setIsEditDialogOpen(true);
  };

  const handleAddClick = (cellDate: Date, role: string) => {
    setNewShiftParams({ date: cellDate, role });
    setIsCreateDialogOpen(true);
  };

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="min-w-[1200px] max-w-full">
        <div className="grid grid-cols-[200px,1fr] bg-white sticky top-0 z-10">
          <div className="border-b border-r border-gray-200 p-3 font-medium text-gray-500 text-sm">
            Roll
          </div>
          <div className="grid grid-cols-[repeat(23,1fr)] border-b border-gray-200">
            {HOURS.map((hour) => (
              <div key={hour} className="text-center text-xs text-gray-500 py-3 border-r border-gray-200">
                {hour % 12 || 12}{hour >= 12 ? 'PM' : 'AM'}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[200px,1fr]">
          {ROLES.map((role, index) => {
            const roleShifts = getShiftsForRole(role);
            return (
              <div key={role} className="grid grid-cols-subgrid col-span-2">
                <div 
                  className={`border-b border-r border-gray-200 p-3 font-medium text-sm flex items-start gap-2 cursor-pointer hover:bg-gray-50 sticky left-0 bg-white ${!index ? 'bg-gray-50' : ''}`}
                  onClick={() => toggleRole(role)}
                >
                  {hiddenRoles.has(role) ? (
                    <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 mt-0.5" />
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-purple-500' : 'bg-orange-500'}`} />
                    <span>{role}</span>
                  </div>
                </div>
                
                <div className={`${hiddenRoles.has(role) ? 'hidden' : ''}`}>
                  <div 
                    className="border-b border-r border-gray-200 h-40 relative" 
                    onDoubleClick={() => handleAddClick(date, role)}
                  >
                    {roleShifts.map((shift) => {
                      const { startPercent, widthPercent } = calculateShiftPosition(shift);
                      const bgColor = role === 'Läkare' ? 'bg-blue-50 border-blue-200' : 
                                     role === 'Sjuksköterska' ? 'bg-green-50 border-green-200' : 
                                     'bg-purple-50 border-purple-200';
                      
                      return (
                        <div
                          key={shift.id}
                          className={`absolute top-1 h-[calc(100%-8px)] rounded-md border ${bgColor} cursor-pointer hover:bg-opacity-80`}
                          style={{
                            left: `${startPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          onClick={() => handleShiftClick(shift)}
                        >
                          <div className="p-3 text-sm">
                            <div className="font-medium">
                              {format(parseISO(shift.start_time), 'ha')} – 
                              {format(parseISO(shift.end_time), 'ha')}
                            </div>
                            <div className="text-gray-700">
                              {shift.profiles.first_name}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

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

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            {newShiftParams && (
              <ShiftForm
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                defaultValues={{
                  start_time: `${format(newShiftParams.date, 'yyyy-MM-dd')}T09:00`,
                  end_time: `${format(newShiftParams.date, 'yyyy-MM-dd')}T17:00`,
                  shift_type: roleToShiftType[newShiftParams.role] || 'day'
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
};

export default DayView;
