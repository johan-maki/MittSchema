
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Shift } from "@/types/shift";
import { Profile } from "@/types/profile";
import { format, addDays, addMinutes } from "date-fns";

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
          profiles: { first_name: 'Meryl', last_name: 'Streep', experience_level: 5 }
        },
        {
          id: 'doc2',
          employee_id: 'doc2',
          shift_type: 'evening',
          department: 'Surgery',
          profiles: { first_name: 'Morgan', last_name: 'Freeman', experience_level: 4 }
        },
        {
          id: 'nurse1',
          employee_id: 'nurse1',
          shift_type: 'day',
          department: 'Emergency',
          profiles: { first_name: 'Emma', last_name: 'Thompson', experience_level: 3 }
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
          profiles: { first_name: 'Tom', last_name: 'Hanks', experience_level: 2 }
        },
        {
          id: 'asst2',
          employee_id: 'asst2',
          shift_type: 'evening',
          department: 'Surgery',
          profiles: { first_name: 'Julia', last_name: 'Roberts', experience_level: 3 }
        }
      ];

      // Map roles to shift types for proper filtering
      const roleShiftTypes = {
        'Läkare': 'day',
        'Sjuksköterska': 'evening',
        'Undersköterska': 'night'
      };

      // Generate shifts for current view with more variety
      const allShifts = shiftTemplates.flatMap(template => {
        const shiftDate = new Date(currentDate);
        const shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }> = [];
        
        // For week and month views, create shifts across multiple days
        const daysToGenerate = currentView === 'day' ? 1 : currentView === 'week' ? 7 : 31;
        
        // Not every day will have a shift (70% chance)
        for (let i = 0; i < daysToGenerate; i++) {
          if (Math.random() > 0.3) { // 70% chance of having a shift
            const currentShiftDate = addDays(shiftDate, i);
            
            // Add variety to shift times
            let baseStartHour: number;
            let shiftDuration: number;
            
            switch (template.shift_type) {
              case 'day':
                // Day shifts start between 6:00 and 9:00
                baseStartHour = 6 + Math.floor(Math.random() * 3);
                // Duration between 8 and 10 hours
                shiftDuration = 8 + Math.floor(Math.random() * 2);
                break;
              case 'evening':
                // Evening shifts start between 14:00 and 16:00
                baseStartHour = 14 + Math.floor(Math.random() * 2);
                // Duration between 7 and 9 hours
                shiftDuration = 7 + Math.floor(Math.random() * 2);
                break;
              case 'night':
                // Night shifts start between 22:00 and 23:00
                baseStartHour = 22 + Math.floor(Math.random() * 1);
                // Duration between 8 and 10 hours
                shiftDuration = 8 + Math.floor(Math.random() * 2);
                break;
              default:
                baseStartHour = 8;
                shiftDuration = 8;
            }
            
            // Add random minutes (0, 15, 30, or 45)
            const randomMinutes = Math.floor(Math.random() * 4) * 15;
            
            const startTime = new Date(currentShiftDate);
            startTime.setHours(baseStartHour, randomMinutes, 0);
            
            const endTime = addMinutes(startTime, shiftDuration * 60);
            
            // Only create the shift if it matches the role-shift type mapping
            // Add more variety to shift types for Undersköterska
            if (template.employee_id.startsWith('asst')) {
              // For Undersköterska, create both evening and night shifts
              const shiftTypes = ['evening', 'night'];
              const selectedType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
              
              const shift: Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> } = {
                ...template,
                shift_type: selectedType,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString()
              };
              
              shifts.push(shift);
            } else {
              const shift: Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> } = {
                ...template,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString()
              };
              
              shifts.push(shift);
            }
          }
        }
        
        return shifts;
      });

      return allShifts;
    },
    enabled: !!user
  });
};
