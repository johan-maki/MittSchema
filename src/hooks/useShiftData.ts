
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Shift } from "@/types/shift";
import { Profile } from "@/types/profile";
import { format } from "date-fns";

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
          shift_type: 'night',
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

      // Generate shifts based on templates
      const allShifts = shiftTemplates.flatMap(template => {
        const shiftDate = new Date(currentDate);
        shiftDate.setHours(1, 0, 0);
        const shift: Shift & { profiles: Pick<Profile, 'first_name' | 'last_name'> } = {
          ...template,
          start_time: shiftDate.toISOString(),
          end_time: new Date(shiftDate.setHours(9)).toISOString()
        };
        return shift;
      });

      return allShifts;
    },
    enabled: !!user
  });
};
