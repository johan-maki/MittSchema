
import { format } from "date-fns";
import { Profile } from "@/types/profile";
import { Shift } from "@/types/shift";
import { Alert } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ExperienceLevelSummaryProps {
  shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name'> }>;
  profiles: Profile[];
  date: Date;
}

const MINIMUM_EXPERIENCE_POINTS = 7;

export const ExperienceLevelSummary = ({ shifts, profiles, date }: ExperienceLevelSummaryProps) => {
  const calculateExperienceForDay = (day: Date) => {
    const dayShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return shiftDate.getDate() === day.getDate() &&
             shiftDate.getMonth() === day.getMonth() &&
             shiftDate.getFullYear() === day.getFullYear();
    });

    const totalExperience = dayShifts.reduce((sum, shift) => {
      const profile = profiles.find(p => p.id === shift.employee_id);
      return sum + (profile?.experience_level || 0);
    }, 0);

    return totalExperience;
  };

  const experiencePoints = calculateExperienceForDay(date);
  const isSufficient = experiencePoints >= MINIMUM_EXPERIENCE_POINTS;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200">
      <div className="p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-medium text-gray-600">Exp. level:</div>
          <div
            className={`px-2 py-0.5 rounded-md text-sm font-semibold ${
              isSufficient
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {experiencePoints}
          </div>
        </div>
        {!isSufficient && (
          <div className="mt-1 text-[10px] text-red-600 font-medium">
            Min. required: {MINIMUM_EXPERIENCE_POINTS}
          </div>
        )}
      </div>
    </div>
  );
};
