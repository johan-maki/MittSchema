
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { Profile } from "@/types/profile";
import { Shift } from "@/types/shift";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { ShiftForm } from "./ShiftForm";
import { DayCell } from "./DayCell";
import { useToast } from "@/components/ui/use-toast";
import { ROLES, ROLE_COLORS, Role } from "./schedule.constants";
import { ExperienceLevelSummary } from "./ExperienceLevelSummary";

interface MonthlyScheduleProps {
  date: Date;
  shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name'> }>;
  profiles: Profile[];
}

export const MonthlySchedule = ({ date, shifts, profiles }: MonthlyScheduleProps) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isAddShiftDialogOpen, setIsAddShiftDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isEditShiftDialogOpen, setIsEditShiftDialogOpen] = useState(false);
  const { toast } = useToast();

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
    const remainingExperience = shifts
      .filter(s => isSameDay(new Date(s.start_time), new Date(shift.start_time)) && s.id !== shift.id)
      .reduce((sum, s) => {
        const profile = profiles.find(p => p.id === s.employee_id);
        return sum + (profile?.experience_level || 0);
      }, 0);

    if (remainingExperience < 7) {
      toast({
        title: "Warning",
        description: "Editing this shift may result in insufficient experience levels for this day.",
        variant: "destructive",
      });
    }

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
            <div key={day.toISOString()} className="border-b border-r border-gray-200">
              <div className="p-2 font-medium text-gray-500 text-center">
                {format(day, 'd EEE', { locale: sv })}
              </div>
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
                  <DayCell
                    key={`${role}-${day.toISOString()}`}
                    day={day}
                    role={role}
                    isLastRole={false}
                    shifts={shifts}
                    profiles={profiles}
                    roleColors={ROLE_COLORS[role]}
                    onAddClick={handleAddClick}
                    onShiftClick={handleShiftClick}
                    dayShifts={dayShifts}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Experience Level Summary Row */}
        <div className="contents">
          <div className="border-b border-r border-gray-200 p-2 font-medium text-gray-500">
            Experience Level
          </div>
          <div className="grid grid-cols-[repeat(31,minmax(100px,1fr))]">
            {daysInMonth.map((day) => (
              <div key={`summary-${day.toISOString()}`} className="border-b border-r border-gray-200">
                <ExperienceLevelSummary
                  date={day}
                  shifts={shifts}
                  profiles={profiles}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

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
