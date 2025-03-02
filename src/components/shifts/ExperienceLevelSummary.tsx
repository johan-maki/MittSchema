
import { format } from "date-fns";
import { Profile } from "@/types/profile";
import { Shift } from "@/types/shift";

interface ExperienceLevelSummaryProps {
  shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }>;
  profiles: Profile[];
  date: Date;
}

export const ExperienceLevelSummary = ({ shifts, profiles, date }: ExperienceLevelSummaryProps) => {
  const calculateExperienceForDay = (day: Date) => {
    // First, get unique employee shifts for the specific day to avoid counting duplicate shifts
    const dayShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return shiftDate.getDate() === day.getDate() &&
             shiftDate.getMonth() === day.getMonth() &&
             shiftDate.getFullYear() === day.getFullYear();
    });

    // Create a Map to track unique employees and their highest experience level for each shift type
    const employeeExperienceByShiftType = new Map<string, Map<string, number>>();
    
    dayShifts.forEach(shift => {
      if (!shift.profiles?.experience_level) return;
      
      const employeeId = shift.employee_id;
      const shiftType = shift.shift_type;
      
      if (!employeeId || !shiftType) return;
      
      // Initialize nested map for this employee if it doesn't exist
      if (!employeeExperienceByShiftType.has(employeeId)) {
        employeeExperienceByShiftType.set(employeeId, new Map<string, number>());
      }
      
      const employeeShiftTypes = employeeExperienceByShiftType.get(employeeId)!;
      
      // Only store the highest experience level if this employee has multiple shifts of the same type
      const currentExp = employeeShiftTypes.get(shiftType) || 0;
      if (shift.profiles.experience_level > currentExp) {
        employeeShiftTypes.set(shiftType, shift.profiles.experience_level);
      }
    });
    
    // Sum up the experience levels, counting each employee only once per shift type
    let totalExperience = 0;
    employeeExperienceByShiftType.forEach(shiftTypes => {
      shiftTypes.forEach(expLevel => {
        totalExperience += expLevel;
      });
    });

    return totalExperience;
  };

  const experiencePoints = calculateExperienceForDay(date);
  const isSufficient = experiencePoints >= MINIMUM_EXPERIENCE_POINTS;

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

// This should match the minimum experience sum requirement from schedule settings
const MINIMUM_EXPERIENCE_POINTS = 6;
