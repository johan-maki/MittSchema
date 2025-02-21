
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { Profile } from "@/types/profile";
import { Shift } from "@/types/shift";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { ShiftForm } from "./ShiftForm";
import { Button } from "@/components/ui/button";

interface MonthlyScheduleProps {
  date: Date;
  shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name'> }>;
  profiles: Profile[];
}

type Role = 'Läkare' | 'Undersköterska' | 'Sjuksköterska';

const ROLES: Role[] = ['Läkare', 'Undersköterska', 'Sjuksköterska'];

const ROLE_COLORS: Record<Role, { bg: string, border: string, text: string }> = {
  'Läkare': { 
    bg: 'bg-[#9b87f5]/10', 
    border: 'border-[#9b87f5]',
    text: 'text-[#6E59A5]'
  },
  'Undersköterska': { 
    bg: 'bg-[#F2FCE2]/50', 
    border: 'border-[#7E69AB]',
    text: 'text-[#7E69AB]'
  },
  'Sjuksköterska': { 
    bg: 'bg-[#FEC6A1]/10', 
    border: 'border-[#FEC6A1]',
    text: 'text-[#D4956A]'
  }
};

export const MonthlySchedule = ({ date, shifts, profiles }: MonthlyScheduleProps) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isAddShiftDialogOpen, setIsAddShiftDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isEditShiftDialogOpen, setIsEditShiftDialogOpen] = useState(false);

  const getShiftsForRoleAndDay = (role: Role, day: Date) => {
    return shifts.filter(shift => 
      isSameDay(new Date(shift.start_time), day) && 
      profiles.find(p => p.id === shift.employee_id)?.role === role
    );
  };

  const handleAddClick = (day: Date, role: Role) => {
    setSelectedDate(day);
    setSelectedRole(role);
    setIsAddShiftDialogOpen(true);
  };

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setIsEditShiftDialogOpen(true);
  };

  return (
    <div className="min-w-[1000px]">
      <div className="grid grid-cols-[200px,1fr]">
        <div className="border-b border-r border-gray-200 p-2 font-medium text-gray-500">
          Roll
        </div>
        <div className="grid grid-cols-[repeat(31,minmax(100px,1fr))]">
          {daysInMonth.map((day) => (
            <div
              key={day.toISOString()}
              className="border-b border-r border-gray-200 p-2 font-medium text-gray-500 text-center"
            >
              {format(day, 'd EEE', { locale: sv })}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[200px,1fr]">
        {ROLES.map((role) => (
          <div key={role} className="contents">
            <div className={`border-b border-r border-gray-200 p-2 font-medium ${ROLE_COLORS[role].text}`}>
              {role}
            </div>
            <div className="grid grid-cols-[repeat(31,minmax(100px,1fr))]">
              {daysInMonth.map((day) => {
                const dayShifts = getShiftsForRoleAndDay(role, day);
                return (
                  <div
                    key={`${role}-${day.toISOString()}`}
                    className="border-b border-r border-gray-200 p-1 min-h-[100px] relative"
                  >
                    <div className="space-y-1">
                      {dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          onClick={() => handleShiftClick(shift)}
                          className={`
                            rounded-md p-1 text-xs border cursor-pointer
                            ${ROLE_COLORS[role].bg}
                            ${ROLE_COLORS[role].border}
                            hover:brightness-95 transition-all
                          `}
                        >
                          <div className="font-medium">
                            {format(new Date(shift.start_time), 'HH:mm')} - 
                            {format(new Date(shift.end_time), 'HH:mm')}
                          </div>
                          <div className="truncate">
                            {shift.profiles.first_name} {shift.profiles.last_name}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute bottom-1 right-1 h-6 w-6 p-0"
                      onClick={() => handleAddClick(day, role)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add Shift Dialog */}
      <Dialog open={isAddShiftDialogOpen} onOpenChange={setIsAddShiftDialogOpen}>
        <DialogContent>
          <ShiftForm
            isOpen={isAddShiftDialogOpen}
            onOpenChange={setIsAddShiftDialogOpen}
            defaultValues={{
              start_time: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : "",
              end_time: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : "",
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={isEditShiftDialogOpen} onOpenChange={setIsEditShiftDialogOpen}>
        <DialogContent>
          {selectedShift && (
            <ShiftForm
              isOpen={isEditShiftDialogOpen}
              onOpenChange={setIsEditShiftDialogOpen}
              defaultValues={{
                start_time: selectedShift.start_time.slice(0, 16),
                end_time: selectedShift.end_time.slice(0, 16),
                department: selectedShift.department,
                notes: selectedShift.notes || "",
                employee_id: selectedShift.employee_id,
                shift_type: selectedShift.shift_type
              }}
              editMode
              shiftId={selectedShift.id}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
