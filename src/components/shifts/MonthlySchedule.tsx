
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { Profile } from "@/types/profile";
import { Shift, Role } from "@/types/shift";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { ShiftForm } from "./ShiftForm";
import { DayCell } from "./DayCell";
import { useToast } from "@/components/ui/use-toast";
import { ROLES, ROLE_COLORS } from "./schedule.constants";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ExperienceLevelSummary } from "./ExperienceLevelSummary";

interface MonthlyScheduleProps {
  date: Date;
  shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }>;
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
  const [hiddenRoles, setHiddenRoles] = useState<Set<Role>>(new Set());
  const { toast } = useToast();

  const getShiftsForRoleAndDay = (role: Role, day: Date) => {
    return shifts.filter(shift => {
      // Find the profile for this shift
      const profile = profiles.find(p => p.id === shift.employee_id);
      
      // Check if the shift is on the correct day and the employee has the correct role
      return isSameDay(new Date(shift.start_time), day) && profile?.role === role;
    });
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

  const toggleRole = (role: Role) => {
    const newHiddenRoles = new Set(hiddenRoles);
    if (hiddenRoles.has(role)) {
      newHiddenRoles.delete(role);
    } else {
      newHiddenRoles.add(role);
    }
    setHiddenRoles(newHiddenRoles);
  };

  return (
    <div className="min-w-[1000px]">
      <div className="grid grid-cols-[200px,1fr] bg-white">
        <div className="border-b border-r border-gray-100 p-2 font-medium text-gray-400 text-sm self-start">
          Roll
        </div>
        <div className="grid grid-cols-[repeat(31,minmax(100px,1fr))]">
          {daysInMonth.map((day) => (
            <div key={day.toISOString()} className="border-b border-r border-gray-100">
              <div className="p-2 font-medium text-gray-400 text-center text-sm">
                {format(day, 'd EEE', { locale: sv })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[200px,1fr]">
        {ROLES.map((role) => (
          <div key={role} className="grid grid-cols-subgrid col-span-2">
            <div 
              className={`border-b border-r border-gray-100 p-2 font-medium text-sm flex items-start gap-2 cursor-pointer hover:bg-gray-50`}
              onClick={() => toggleRole(role)}
            >
              {hiddenRoles.has(role) ? (
                <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400 mt-0.5" />
              )}
              <span className={ROLE_COLORS[role].text}>{role}</span>
            </div>
            <div className={`grid grid-cols-[repeat(31,minmax(100px,1fr))] ${hiddenRoles.has(role) ? 'hidden' : ''}`}>
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

        <div className="grid grid-cols-subgrid col-span-2">
          <div className="border-b border-r border-gray-100 p-2 font-medium text-gray-400 text-sm">
            Experience Level
          </div>
          <div className="grid grid-cols-[repeat(31,minmax(100px,1fr))]">
            {daysInMonth.map((day) => (
              <div key={`summary-${day.toISOString()}`} className="border-b border-r border-gray-100">
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
                department: selectedShift.department || "",
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
