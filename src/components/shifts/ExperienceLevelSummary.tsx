import { format } from "date-fns";
import { Profile } from "@/types/profile";
import { Shift } from "@/types/shift";
import { minStaffByShiftType } from "@/utils/shifts/shiftValidation";

interface ExperienceLevelSummaryProps {
  shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }>;
  profiles: Profile[];
  date: Date;
}

export const ExperienceLevelSummary = ({ shifts, profiles, date }: ExperienceLevelSummaryProps) => {
  const calculateExperienceForDay = (day: Date) => {
    const dayShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return shiftDate.getDate() === day.getDate() &&
             shiftDate.getMonth() === day.getMonth() &&
             shiftDate.getFullYear() === day.getFullYear();
    });

    const shiftTypeExperience = new Map<string, number>();
    const shiftTypeCounts = new Map<string, number>();
    
    const employeesByShiftType = new Map<string, Set<string>>();
    
    dayShifts.forEach(shift => {
      if (!shift.profiles?.experience_level) return;
      
      const shiftType = shift.shift_type;
      const employeeId = shift.employee_id;
      
      if (!shiftType || !employeeId) return;
      
      if (!shiftTypeExperience.has(shiftType)) {
        shiftTypeExperience.set(shiftType, 0);
        shiftTypeCounts.set(shiftType, 0);
        employeesByShiftType.set(shiftType, new Set<string>());
      }
      
      const employees = employeesByShiftType.get(shiftType)!;
      
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
    
    let totalExperience = 0;
    let allTypesHaveMinimumStaff = true;
    
    shiftTypeExperience.forEach((experience, shiftType) => {
      totalExperience += experience;
      
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
  
  const getMinimumStaffForShiftType = (shiftType: string): number => {
    return minStaffByShiftType[shiftType as keyof typeof minStaffByShiftType] || 3;
  };

  const { totalExperience, allTypesHaveMinimumStaff, dayShifts } = calculateExperienceForDay(date);
  const hasAnyShifts = dayShifts.length > 0;
  
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

const MINIMUM_EXPERIENCE_POINTS = 6;
