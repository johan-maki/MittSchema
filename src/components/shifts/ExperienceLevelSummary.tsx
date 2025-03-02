
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
    // Get all shifts for the specific day
    const dayShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return shiftDate.getDate() === day.getDate() &&
             shiftDate.getMonth() === day.getMonth() &&
             shiftDate.getFullYear() === day.getFullYear();
    });

    // Group shifts by type to calculate experience levels per shift type
    const shiftTypeExperience = new Map<string, number>();
    const shiftTypeCounts = new Map<string, number>();
    
    // Track unique employees per shift type
    const employeesByShiftType = new Map<string, Set<string>>();
    
    dayShifts.forEach(shift => {
      if (!shift.profiles?.experience_level) return;
      
      const shiftType = shift.shift_type;
      const employeeId = shift.employee_id;
      
      if (!shiftType || !employeeId) return;
      
      // Initialize tracking for this shift type if needed
      if (!shiftTypeExperience.has(shiftType)) {
        shiftTypeExperience.set(shiftType, 0);
        shiftTypeCounts.set(shiftType, 0);
        employeesByShiftType.set(shiftType, new Set<string>());
      }
      
      const employees = employeesByShiftType.get(shiftType)!;
      
      // Only count each employee once per shift type
      if (!employees.has(employeeId)) {
        employees.add(employeeId);
        shiftTypeExperience.set(
          shiftType, 
          shiftTypeExperience.get(shiftType)! + shift.profiles.experience_level
        );
        shiftTypeCounts.set(
          shiftType,
          shiftTypeCounts.get(shiftType)! + 1
        );
      }
    });
    
    // Calculate total experience and check if we meet requirements
    let totalExperience = 0;
    let allTypesHaveMinimumStaff = true;
    
    shiftTypeExperience.forEach((experience, shiftType) => {
      totalExperience += experience;
      
      // Check if this shift type has enough staff
      const staffCount = shiftTypeCounts.get(shiftType) || 0;
      const minStaff = getMinimumStaffForShiftType(shiftType);
      
      if (staffCount < minStaff) {
        allTypesHaveMinimumStaff = false;
      }
    });

    return {
      totalExperience,
      allTypesHaveMinimumStaff,
      dayShifts
    };
  };
  
  // Helper to get minimum staff requirement by shift type
  const getMinimumStaffForShiftType = (shiftType: string): number => {
    switch (shiftType) {
      case 'day':
        return 3; // Morning shift minimum
      case 'evening':
        return 3; // Afternoon shift minimum
      case 'night':
        return 2; // Night shift minimum
      default:
        return 3;
    }
  };

  const { totalExperience, allTypesHaveMinimumStaff, dayShifts } = calculateExperienceForDay(date);
  const hasAnyShifts = dayShifts.length > 0;
  
  // Experience is sufficient if we have enough total experience and enough staff in each shift type
  const isSufficient = hasAnyShifts && 
                      totalExperience >= MINIMUM_EXPERIENCE_POINTS && 
                      allTypesHaveMinimumStaff;

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div
        className={`px-2 py-0.5 rounded text-sm ${
          !hasAnyShifts 
            ? "text-gray-400"
            : isSufficient
              ? "text-green-600"
              : "text-red-600"
        }`}
      >
        {hasAnyShifts ? totalExperience : "-"}
      </div>
      {hasAnyShifts && !allTypesHaveMinimumStaff && (
        <div className="text-xs text-red-600 mt-1">
          Min. staff
        </div>
      )}
    </div>
  );
};

// This should match the minimum experience sum requirement from schedule settings
const MINIMUM_EXPERIENCE_POINTS = 6;
