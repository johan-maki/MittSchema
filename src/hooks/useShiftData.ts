
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Shift } from "@/types/shift";
import { Profile } from "@/types/profile";
import { format, addDays } from "date-fns";

export const useShiftData = (currentDate: Date, currentView: 'day' | 'week' | 'month') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shifts', currentDate, currentView],
    queryFn: async () => {
      if (!user) return [];
      
      const shiftTemplates: Omit<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name'> }, 'start_time' | 'end_time'>[] = [
        {
          id: 'doc1',
          employee_id: 'doc1',
          shift_type: 'day',
          department: 'Emergency',
          profiles: { first_name: 'Meryl', last_name: 'Streep' }
        },
        {
          id: 'doc2',
          employee_id: 'doc2',
          shift_type: 'day',
          department: 'Surgery',
          profiles: { first_name: 'Morgan', last_name: 'Freeman' }
        },
        {
          id: 'nurse1',
          employee_id: 'nurse1',
          shift_type: 'day',
          department: 'Emergency',
          profiles: { first_name: 'Emma', last_name: 'Thompson' }
        },
        {
          id: 'nurse2',
          employee_id: 'nurse2',
          shift_type: 'evening',
          department: 'Pediatrics',
          profiles: { first_name: 'Sandra', last_name: 'Bullock' }
        },
        {
          id: 'asst1',
          employee_id: 'asst1',
          shift_type: 'day',
          department: 'Emergency',
          profiles: { first_name: 'Tom', last_name: 'Hanks' }
        },
        {
          id: 'asst2',
          employee_id: 'asst2',
          shift_type: 'evening',
          department: 'Surgery',
          profiles: { first_name: 'Julia', last_name: 'Roberts' }
        }
      ];

      // Generate shifts for current view
      const allShifts = shiftTemplates.flatMap(template => {
        const shiftDate = new Date(currentDate);
        const shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name'> }> = [];

        // For week and month views, create shifts across multiple days
        const daysToGenerate = currentView === 'day' ? 1 : currentView === 'week' ? 7 : 31;
        
        for (let i = 0; i < daysToGenerate; i++) {
          const currentShiftDate = addDays(shiftDate, i);
          
          // Generate different shift times based on shift_type
          let startHour = 8; // default for day shift
          let endHour = 16;
          
          if (template.shift_type === 'evening') {
            startHour = 16;
            endHour = 24;
          } else if (template.shift_type === 'night') {
            startHour = 0;
            endHour = 8;
          }
          
          const shift: Shift & { profiles: Pick<Profile, 'first_name' | 'last_name'> } = {
            ...template,
            start_time: new Date(currentShiftDate.setHours(startHour, 0, 0)).toISOString(),
            end_time: new Date(currentShiftDate.setHours(endHour, 0, 0)).toISOString()
          };
          
          shifts.push(shift);
        }
        
        return shifts;
      });

      return allShifts;
    },
    enabled: !!user
  });
};
