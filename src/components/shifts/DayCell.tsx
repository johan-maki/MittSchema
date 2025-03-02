
import { Profile } from "@/types/profile";
import { Shift } from "@/types/shift";
import { ShiftCard } from "./ShiftCard";

interface DayCellProps {
  day: Date;
  role: string;
  isLastRole: boolean;
  shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }>;
  profiles: Profile[];
  roleColors: {
    bg: string;
    border: string;
    text: string;
  };
  onAddClick: (day: Date, role: string) => void;
  onShiftClick: (shift: Shift) => void;
  dayShifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }>;
}

export const DayCell = ({
  day,
  role,
  isLastRole,
  shifts,
  profiles,
  roleColors,
  onAddClick,
  onShiftClick,
  dayShifts,
}: DayCellProps) => {
  return (
    <div 
      className="border-b border-r border-gray-200 p-1 min-h-[180px] relative bg-white"
      onDoubleClick={() => onAddClick(day, role)}
    >
      <div className="space-y-2 mb-8">
        {dayShifts.map((shift) => (
          <ShiftCard
            key={shift.id}
            shift={shift}
            profile={shift.profiles}
            roleColors={roleColors}
            onClick={() => onShiftClick(shift)}
          />
        ))}
      </div>
    </div>
  );
};
