import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Shift, ShiftType } from "@/types/shift";
import { Profile } from "@/types/profile";
import { format, addDays, addMinutes, startOfMonth, endOfMonth } from "date-fns";

export const useShiftData = (currentDate: Date, currentView: 'day' | 'week' | 'month') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shifts', currentDate, currentView],
    queryFn: async () => {
      if (!user) return [];
      
      // Sample profiles with first names matching the screenshot
      const profileTemplates: Profile[] = [
        { id: 'maki1', first_name: 'Maki', last_name: 'Zenin', role: 'Doctor', experience_level: 5, department: 'Emergency', created_at: '', updated_at: '', phone: null },
        { id: 'felix1', first_name: 'Felix', last_name: 'Leiter', role: 'Doctor', experience_level: 4, department: 'Surgery', created_at: '', updated_at: '', phone: null },
        { id: 'peter1', first_name: 'Peter', last_name: 'Parker', role: 'Nurse', experience_level: 3, department: 'Emergency', created_at: '', updated_at: '', phone: null },
        { id: 'scarl1', first_name: 'Scarlette', last_name: 'Johansson', role: 'Nurse', experience_level: 4, department: 'Pediatrics', created_at: '', updated_at: '', phone: null },
        { id: 'max1', first_name: 'Max', last_name: 'Payne', role: 'Assistant', experience_level: 2, department: 'Emergency', created_at: '', updated_at: '', phone: null },
      ];

      // Create shift templates using the profiles
      const shiftTemplates: Omit<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }, 'start_time' | 'end_time'>[] = [
        {
          id: 'doc1',
          employee_id: 'maki1',
          shift_type: 'day',
          department: 'Emergency',
          profiles: { first_name: 'Maki', last_name: 'Zenin', experience_level: 5 }
        },
        {
          id: 'doc2',
          employee_id: 'felix1',
          shift_type: 'day',
          department: 'Surgery',
          profiles: { first_name: 'Felix', last_name: 'Leiter', experience_level: 4 }
        },
        {
          id: 'nurse1',
          employee_id: 'peter1',
          shift_type: 'evening',
          department: 'Emergency',
          profiles: { first_name: 'Peter', last_name: 'Parker', experience_level: 3 }
        },
        {
          id: 'nurse2',
          employee_id: 'scarl1',
          shift_type: 'evening',
          department: 'Pediatrics',
          profiles: { first_name: 'Scarlette', last_name: 'Johansson', experience_level: 4 }
        },
        {
          id: 'asst1',
          employee_id: 'max1',
          shift_type: 'night',
          department: 'Emergency',
          profiles: { first_name: 'Max', last_name: 'Payne', experience_level: 2 }
        }
      ];

      // Generate a month range
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      // Map roles to employee IDs
      const roleEmployeeMap: Record<string, string[]> = {
        'Läkare': ['maki1', 'felix1'],
        'Sjuksköterska': ['peter1', 'scarl1'],
        'Undersköterska': ['max1']
      };
      
      // Role to shift type mapping (for filtering)
      const roleShiftTypes: Record<string, ShiftType> = {
        'Läkare': 'day',
        'Sjuksköterska': 'evening',
        'Undersköterska': 'night'
      };

      // Generate shifts with more realistic patterns
      const allShifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }> = [];
      
      // Days in the month
      const daysInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // For each employee, generate a realistic monthly schedule
      Object.entries(roleEmployeeMap).forEach(([role, employeeIds]) => {
        employeeIds.forEach(employeeId => {
          const template = shiftTemplates.find(t => t.employee_id === employeeId);
          if (!template) return;
          
          // Realistic shift pattern - generate for specific days per week (e.g., Mon-Fri or weekends)
          const isWeekendStaff = Math.random() > 0.7; // 30% chance employee works weekends
          
          for (let day = 0; day < daysInMonth; day++) {
            const currentDay = addDays(monthStart, day);
            const dayOfWeek = currentDay.getDay(); // 0 = Sunday, 6 = Saturday
            
            // Determine if this employee should work this day based on their pattern
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const shouldWork = (isWeekendStaff && isWeekend) || (!isWeekendStaff && !isWeekend);
            
            if (shouldWork && Math.random() > 0.3) { // 70% chance of scheduled shift on eligible days
              // Always make shifts 9-4 to match the screenshot
              const startHour = 9;
              const endHour = 16; // 4 PM in 24-hour time
              
              // Create the shift
              const startTime = new Date(currentDay);
              startTime.setHours(startHour, 0, 0);
              
              const endTime = new Date(currentDay);
              endTime.setHours(endHour, 0, 0);
              
              // Create unique ID for each shift
              const shiftId = `${template.id}-${format(currentDay, 'yyyyMMdd')}`;
              
              allShifts.push({
                ...template,
                id: shiftId,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString()
              });
            }
          }
        });
      });
      
      return allShifts;
    },
    enabled: !!user
  });
};
