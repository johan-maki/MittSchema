
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
      
      const shiftTemplates: Omit<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }, 'start_time' | 'end_time'>[] = [
        {
          id: 'doc1',
          employee_id: 'doc1',
          shift_type: 'day',
          department: 'Emergency',
          profiles: { first_name: 'Tommy', last_name: 'Hanks', experience_level: 5 }
        },
        {
          id: 'doc2',
          employee_id: 'doc2',
          shift_type: 'day',
          department: 'Surgery',
          profiles: { first_name: 'Brad', last_name: 'Pitt', experience_level: 4 }
        },
        {
          id: 'nurse1',
          employee_id: 'nurse1',
          shift_type: 'evening',
          department: 'Emergency',
          profiles: { first_name: 'Leonardo', last_name: 'DiCaprio', experience_level: 3 }
        },
        {
          id: 'nurse2',
          employee_id: 'nurse2',
          shift_type: 'evening',
          department: 'Pediatrics',
          profiles: { first_name: 'Sandra', last_name: 'Bullock', experience_level: 4 }
        },
        {
          id: 'asst1',
          employee_id: 'asst1',
          shift_type: 'night',
          department: 'Emergency',
          profiles: { first_name: 'Robert', last_name: 'Downey', experience_level: 2 }
        },
        {
          id: 'asst2',
          employee_id: 'asst2',
          shift_type: 'night',
          department: 'Surgery',
          profiles: { first_name: 'Julia', last_name: 'Roberts', experience_level: 3 }
        }
      ];

      // Generate a month range
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      // For day and week views, we'll still generate a full month's worth of data
      // but filter it when rendering
      
      // Map roles to employee IDs
      const roleEmployeeMap: Record<string, string[]> = {
        'Läkare': ['doc1', 'doc2'],
        'Sjuksköterska': ['nurse1', 'nurse2'],
        'Undersköterska': ['asst1', 'asst2']
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
              // Create shift times based on role
              let startHour: number;
              let shiftDuration: number;
              
              switch (template.shift_type) {
                case 'day':
                  startHour = 8; // Day shifts usually start at 8:00
                  shiftDuration = 8; // 8-hour shifts
                  break;
                case 'evening':
                  startHour = 16; // Evening shifts start at 16:00
                  shiftDuration = 8; // 8-hour shifts
                  break;
                case 'night':
                  startHour = 22; // Night shifts start at 22:00
                  shiftDuration = 10; // 10-hour shifts
                  break;
                default:
                  startHour = 8;
                  shiftDuration = 8;
              }
              
              // Add some variation to start times
              startHour = startHour + (Math.random() > 0.5 ? 0 : 1); // 50% chance of starting an hour later
              
              // Create the shift
              const startTime = new Date(currentDay);
              startTime.setHours(startHour, 0, 0);
              
              const endTime = addMinutes(startTime, shiftDuration * 60);
              
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
