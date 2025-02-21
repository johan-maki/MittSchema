
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
    <div className="border-t border-gray-200 p-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Experience Level Total:</div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            isSufficient
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {experiencePoints} points
        </div>
      </div>
      {!isSufficient && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <span className="ml-2">
            Warning: Experience level is below the minimum requirement of {MINIMUM_EXPERIENCE_POINTS} points
          </span>
        </Alert>
      )}
    </div>
  );
};
