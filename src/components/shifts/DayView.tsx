
import { Shift } from "@/types/shift";
import { format, isSameDay } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShiftForm } from "./ShiftForm";

interface DayViewProps {
  date: Date;
  shifts: Shift[];
}

type Role = {
  name: string;
  color: string;
  bgColor: string;
  department: string;
};

const ROLES: Role[] = [
  { 
    name: "Time off", 
    color: "#6B7280", 
    bgColor: "#F3F4F6",
    department: "Time off" 
  },
  { 
    name: "Manager", 
    color: "#DC2626", 
    bgColor: "#FEE2E2",
    department: "Vården" 
  },
  { 
    name: "Admin", 
    color: "#7C3AED", 
    bgColor: "#EDE9FE",
    department: "Vården" 
  },
  { 
    name: "Security", 
    color: "#EA580C", 
    bgColor: "#FFEDD5",
    department: "Vården" 
  },
  { 
    name: "Staff", 
    color: "#2563EB", 
    bgColor: "#EFF6FF",
    department: "Vården" 
  }
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface OverlappingShifts {
  shift: Shift;
  overlap: number;
  position: number;
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
      
      // Find overlapping shifts
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
        {/* Time header */}
        <div className="grid grid-cols-[200px,1fr] bg-gray-50 border-b">
          <div className="p-4 font-medium text-gray-500">Role</div>
          <div className="grid grid-cols-24 border-l">
            {HOURS.map((hour) => (
              <div 
                key={hour} 
                className="text-center text-sm text-gray-500 p-4 border-r"
              >
                {hour}:00
              </div>
            ))}
          </div>
        </div>

        {/* Role rows */}
        {ROLES.map(role => {
          const roleShifts = todaysShifts.filter(shift => {
            if (role.name === "Time off") {
              return shift.shift_type === "time_off";
            }
            // Map the roles to the appropriate shifts based on your data structure
            // This is an example mapping, adjust according to your needs
            return shift.department === role.department;
          });

          const overlappingShifts = calculateOverlappingShifts(roleShifts);

          return (
            <div key={role.name} className="grid grid-cols-[200px,1fr]">
              {/* Role header */}
              <div 
                className="p-4 flex items-center gap-2 border-b cursor-pointer hover:bg-gray-50"
                onClick={() => toggleRole(role.name)}
              >
                {hiddenRoles.has(role.name) ? (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: role.color }}
                  />
                  <span className="font-medium">{role.name}</span>
                </div>
              </div>

              {/* Time grid */}
              <div className={`relative border-b border-l ${hiddenRoles.has(role.name) ? 'h-[52px]' : 'h-24'}`}>
                {!hiddenRoles.has(role.name) && overlappingShifts.map(({ shift, overlap, position }) => {
                  const start = new Date(shift.start_time);
                  const end = new Date(shift.end_time);
                  const startPercent = (start.getHours() + start.getMinutes() / 60) * (100 / 24);
                  const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  const widthPercent = (duration / 24) * 100;
                  const maxWidth = 100 / (overlap + 1);
                  
                  return (
                    <div
                      key={shift.id}
                      className="absolute top-0 h-24 rounded-lg border text-sm transition-all cursor-pointer hover:brightness-95"
                      style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: role.bgColor,
                        borderColor: role.color,
                        maxWidth: `${maxWidth}%`,
                        transform: `translateY(${position * 33}%)`,
                      }}
                      onClick={() => handleShiftClick(shift)}
                    >
                      <div className="p-2">
                        <div className="font-medium">
                          {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
                        </div>
                        {shift.profiles && (
                          <div className="text-gray-600 truncate">
                            {shift.profiles.first_name} {shift.profiles.last_name}
                          </div>
                        )}
                        {shift.notes && (
                          <div className="text-gray-500 text-xs truncate">{shift.notes}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
    </div>
  );
};

export default DayView;
