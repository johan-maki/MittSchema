
import { Shift, ShiftType } from "@/types/shift";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShiftForm } from "./ShiftForm";
import { format, isSameDay, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DayViewHeader } from "./day-view/DayViewHeader";
import { DayViewRoles } from "./day-view/DayViewRoles";

interface DayViewProps {
  date: Date;
  shifts: Shift[];
}

const DayView = ({ date, shifts }: DayViewProps) => {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newShiftParams, setNewShiftParams] = useState<{date: Date, role: string} | null>(null);

  const shiftsWithProfiles = shifts.map(shift => ({
    ...shift,
    profiles: shift.profiles || { first_name: '', last_name: '' }
  }));

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
        <DayViewHeader />
        <DayViewRoles 
          date={date} 
          shifts={shiftsWithProfiles} 
          onShiftClick={handleShiftClick} 
          onAddClick={handleAddClick} 
        />

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
                  shift_type: getRoleShiftType(newShiftParams.role)
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
};

const getRoleShiftType = (role: string): ShiftType => {
  const roleToShiftType: { [key: string]: ShiftType } = {
    'Läkare': 'day',
    'Sjuksköterska': 'evening',
    'Undersköterska': 'night'
  };
  return roleToShiftType[role] || 'day';
};

export default DayView;
