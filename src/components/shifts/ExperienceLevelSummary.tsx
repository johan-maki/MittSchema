
import { format } from "date-fns";
import { Profile } from "@/types/profile";
import { Shift } from "@/types/shift";

interface ExperienceLevelSummaryProps {
  shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }>;
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
      return sum + (shift.profiles?.experience_level || 0);
    }, 0);

    return totalExperience;
  };

  const experiencePoints = calculateExperienceForDay(date);
  const isSufficient = experiencePoints >= MINIMUM_EXPERIENCE_POINTS;

  // Only render in the summary row, not in the role rows
  if (!profiles) {
    return null;
  }

  return (
    <div className="flex items-center justify-center p-2">
      <div
        className={`px-2 py-0.5 rounded text-sm ${
          isSufficient
            ? "text-green-600"
            : "text-red-600"
        }`}
      >
        {experiencePoints}
      </div>
    </div>
  );
};
