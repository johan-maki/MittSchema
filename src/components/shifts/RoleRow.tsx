
import { Role, OverlappingShifts } from "./types/dayView";
import { Shift } from "@/types/shift";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ShiftItem } from "./ShiftItem";

interface RoleRowProps {
  role: Role;
  isHidden: boolean;
  overlappingShifts: OverlappingShifts[];
  onToggle: (roleName: string) => void;
  onShiftClick: (shift: Shift) => void;
}

export const RoleRow = ({
  role,
  isHidden,
  overlappingShifts,
  onToggle,
  onShiftClick,
}: RoleRowProps) => {
  return (
    <div className="grid grid-cols-[200px,1fr]">
      <div 
        className="p-4 flex items-center gap-2 border-b cursor-pointer hover:bg-gray-50"
        onClick={() => onToggle(role.name)}
      >
        {isHidden ? (
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

      <div className={`relative border-b border-l ${isHidden ? 'h-[52px]' : 'h-24'}`}>
        {!isHidden && overlappingShifts.map(({ shift, overlap, position }) => {
          const start = new Date(shift.start_time);
          const end = new Date(shift.end_time);
          const startPercent = (start.getHours() + start.getMinutes() / 60) * (100 / 24);
          const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          const widthPercent = (duration / 24) * 100;
          const maxWidth = 100 / (overlap + 1);
          
          return (
            <ShiftItem
              key={shift.id}
              shift={shift}
              startPercent={startPercent}
              widthPercent={widthPercent}
              maxWidth={maxWidth}
              position={position}
              bgColor={role.bgColor}
              borderColor={role.color}
              onClick={onShiftClick}
            />
          );
        })}
      </div>
    </div>
  );
};
