
import { Shift } from "@/types/shift";
import { isSameDay } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShiftForm } from "./ShiftForm";
import { TimeHeader } from "./TimeHeader";
import { RoleRow } from "./RoleRow";
import { ROLES } from "./types/dayView";
import type { OverlappingShifts } from "./types/dayView";

interface DayViewProps {
  date: Date;
  shifts: Shift[];
}

const DayView = ({ date, shifts }: DayViewProps) => {
  const [hiddenRoles, setHiddenRoles] = useState<Set<string>>(new Set());
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const todaysShifts = shifts.filter(shift => isSameDay(new Date(shift.start_time), date));

  const calculateOverlappingShifts = (shifts: Shift[]): OverlappingShifts[] => {
    const sortedShifts = [...shifts].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    const overlappingGroups: OverlappingShifts[] = [];
    
    sortedShifts.forEach((shift, index) => {
      const shiftStart = new Date(shift.start_time);
      const shiftEnd = new Date(shift.end_time);
      
      const overlapping = sortedShifts.filter((otherShift, otherIndex) => {
        if (otherIndex === index) return false;
        const otherStart = new Date(otherShift.start_time);
        const otherEnd = new Date(otherShift.end_time);
        return (
          (shiftStart <= otherEnd && shiftEnd >= otherStart) ||
          (otherStart <= shiftEnd && otherEnd >= shiftStart)
        );
      });

      const position = overlappingGroups
        .filter(g => 
          new Date(g.shift.start_time) <= shiftEnd && 
          new Date(g.shift.end_time) >= shiftStart
        )
        .map(g => g.position)
        .sort((a, b) => a - b)
        .reduce((pos, current) => pos === current ? pos + 1 : pos, 0);

      overlappingGroups.push({
        shift,
        overlap: overlapping.length,
        position
      });
    });

    return overlappingGroups;
  };

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setIsEditDialogOpen(true);
  };

  const toggleRole = (roleName: string) => {
    const newHiddenRoles = new Set(hiddenRoles);
    if (hiddenRoles.has(roleName)) {
      newHiddenRoles.delete(roleName);
    } else {
      newHiddenRoles.add(roleName);
    }
    setHiddenRoles(newHiddenRoles);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
      <div className="min-w-[1200px]">
        <TimeHeader />
        
        {ROLES.map(role => {
          const roleShifts = todaysShifts.filter(shift => 
            shift.shift_type === role.shiftType && 
            shift.department === role.department
          );

          const overlappingShifts = calculateOverlappingShifts(roleShifts);

          return (
            <RoleRow
              key={role.name}
              role={role}
              isHidden={hiddenRoles.has(role.name)}
              overlappingShifts={overlappingShifts}
              onToggle={toggleRole}
              onShiftClick={handleShiftClick}
            />
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
    </div>
  );
};

export default DayView;
