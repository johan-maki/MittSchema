
import { Shift } from "@/types/shift";
import { Profile } from "@/types/profile";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShiftForm } from "./ShiftForm";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLES, ROLE_COLORS } from "./schedule.constants";
import { ShiftCard } from "./ShiftCard";
import { ExperienceLevelSummary } from "./ExperienceLevelSummary";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface DayViewProps {
  date: Date;
  shifts: Shift[];
}

const DayView = ({ date, shifts }: DayViewProps) => {
  const [hiddenRoles, setHiddenRoles] = useState<Set<string>>(new Set());
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Add profiles property to shifts if missing
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

  const getShiftsForRole = (role: string) => {
    return shiftsWithProfiles.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return (
        shiftDate.getDate() === date.getDate() &&
        shiftDate.getMonth() === date.getMonth() &&
        shiftDate.getFullYear() === date.getFullYear() &&
        shift.shift_type === role
      );
    });
  };

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="min-w-[1000px]">
      <div className="grid grid-cols-[200px,1fr] bg-white">
        <div className="border-b border-r border-gray-100 p-2 font-medium text-gray-400 text-sm">
          Roll
        </div>
        <div className="border-b border-r border-gray-100">
          <div className="p-2 font-medium text-gray-400 text-center">
            <div className="text-sm">{format(date, 'EEEE', { locale: sv })}</div>
            <div className="text-lg">{format(date, 'd')}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[200px,1fr]">
        {ROLES.map((role) => (
          <div key={role} className="grid grid-cols-subgrid col-span-2">
            <div 
              className="border-b border-r border-gray-100 p-2 font-medium text-sm flex items-start gap-2 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleRole(role)}
            >
              {hiddenRoles.has(role) ? (
                <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400 mt-0.5" />
              )}
              <span className={ROLE_COLORS[role].text}>{role}</span>
            </div>
            
            <div className={`${hiddenRoles.has(role) ? 'hidden' : ''}`}>
              <div className="border-b border-r border-gray-100 p-1 min-h-[120px] relative">
                <div className="space-y-1 mb-8">
                  {getShiftsForRole(role).map((shift) => (
                    <ShiftCard
                      key={shift.id}
                      shift={shift}
                      profile={undefined}
                      roleColors={ROLE_COLORS[role]}
                      onClick={handleShiftClick}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute bottom-2 right-1 h-6 w-6 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-subgrid col-span-2">
          <div className="border-b border-r border-gray-100 p-2 font-medium text-gray-400 text-sm">
            Experience Level
          </div>
          <div className="border-b border-r border-gray-100">
            <ExperienceLevelSummary
              date={date}
              shifts={shiftsWithProfiles}
              profiles={[]}
            />
          </div>
        </div>
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
    </div>
  );
};

export default DayView;
