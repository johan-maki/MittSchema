
import { Shift } from "@/types/shift";
import { DayViewShift } from "./DayViewShift";

interface DayViewShiftListProps {
  shifts: Array<Shift & { profiles: { first_name: string; last_name: string } }>;
  onShiftClick: (shift: Shift) => void;
  onAddClick: () => void;
}

export const DayViewShiftList = ({ shifts, onShiftClick, onAddClick }: DayViewShiftListProps) => {
  return (
    <div 
      className="border-b border-r border-gray-200 h-40 relative" 
      onDoubleClick={onAddClick}
    >
      {shifts.map((shift) => (
        <DayViewShift
          key={shift.id}
          shift={shift}
          onClick={() => onShiftClick(shift)}
        />
      ))}
    </div>
  );
};
