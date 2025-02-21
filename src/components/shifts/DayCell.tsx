
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Profile } from "@/types/profile";
import { Shift } from "@/types/shift";
import { ShiftCard } from "./ShiftCard";
import { ExperienceLevelSummary } from "./ExperienceLevelSummary";

interface DayCellProps {
  day: Date;
  role: string;
  isLastRole: boolean;
  shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name'> }>;
  profiles: Profile[];
  roleColors: {
    bg: string;
    border: string;
    text: string;
  };
  onAddClick: (day: Date, role: string) => void;
  onShiftClick: (shift: Shift) => void;
  dayShifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name'> }>;
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
    <div className="border-b border-r border-gray-200 p-1 min-h-[120px] relative">
      <div className="space-y-1 mb-8">
        {dayShifts.map((shift) => {
          const profile = profiles.find(p => p.id === shift.employee_id);
          return (
            <ShiftCard
              key={shift.id}
              shift={shift}
              profile={profile}
              roleColors={roleColors}
              onClick={onShiftClick}
            />
          );
        })}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="absolute bottom-9 right-1 h-6 w-6 p-0"
        onClick={() => onAddClick(day, role)}
      >
        <Plus className="h-4 w-4" />
      </Button>
      {isLastRole && (
        <ExperienceLevelSummary
          date={day}
          shifts={shifts}
          profiles={profiles}
        />
      )}
    </div>
  );
};
