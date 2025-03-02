
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Shift, ShiftType } from "@/types/shift";
import { Profile } from "@/types/profile";
import { format, addDays, startOfMonth, endOfMonth, parse, isSameDay } from "date-fns";

export const useShiftData = (currentDate: Date, currentView: 'day' | 'week' | 'month') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shifts', currentDate, currentView],
    queryFn: async () => {
      if (!user) return [];
      
      // Sample profiles
      const profileTemplates: Profile[] = [
        { id: 'maki1', first_name: 'Maki', last_name: 'Zenin', role: 'Läkare', experience_level: 5, department: 'Emergency', created_at: '', updated_at: '', phone: null },
        { id: 'felix1', first_name: 'Felix', last_name: 'Leiter', role: 'Läkare', experience_level: 4, department: 'Surgery', created_at: '', updated_at: '', phone: null },
        { id: 'peter1', first_name: 'Peter', last_name: 'Parker', role: 'Sjuksköterska', experience_level: 3, department: 'Emergency', created_at: '', updated_at: '', phone: null },
        { id: 'scarl1', first_name: 'Scarlette', last_name: 'Johansson', role: 'Sjuksköterska', experience_level: 4, department: 'Pediatrics', created_at: '', updated_at: '', phone: null },
        { id: 'max1', first_name: 'Max', last_name: 'Payne', role: 'Undersköterska', experience_level: 2, department: 'Emergency', created_at: '', updated_at: '', phone: null },
        { id: 'brad1', first_name: 'Brad', last_name: 'Pitt', role: 'Läkare', experience_level: 5, department: 'Surgery', created_at: '', updated_at: '', phone: null },
        { id: 'leo1', first_name: 'Leonardo', last_name: 'DiCaprio', role: 'Sjuksköterska', experience_level: 4, department: 'Geriatrics', created_at: '', updated_at: '', phone: null },
        { id: 'jen1', first_name: 'Jennifer', last_name: 'Lawrence', role: 'Undersköterska', experience_level: 3, department: 'Pediatrics', created_at: '', updated_at: '', phone: null },
      ];

      // Role to employee mapping
      const roleToEmployees: Record<string, string[]> = {
        'Läkare': ['maki1', 'felix1', 'brad1'],
        'Sjuksköterska': ['peter1', 'scarl1', 'leo1'],
        'Undersköterska': ['max1', 'jen1']
      };
      
      // Role to shift type mapping
      const roleToShiftType: Record<string, ShiftType> = {
        'Läkare': 'day',
        'Sjuksköterska': 'evening',
        'Undersköterska': 'night'
      };

      // Generate a month range
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      // Generate shifts for the entire month to ensure coverage
      const allShifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }> = [];
      
      // Days in the month
      const daysInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Generate more shifts per day to ensure visibility
      for (let day = 0; day < daysInMonth; day++) {
        const currentDay = addDays(monthStart, day);
        const dayOfWeek = currentDay.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Generate shifts for each role
        Object.entries(roleToEmployees).forEach(([role, employeeIds]) => {
          // Add multiple shifts per day for each role, especially for weekdays
          const shiftsPerDay = isWeekend ? 1 : 2;
          
          for (let i = 0; i < shiftsPerDay; i++) {
            // Alternate employees for variety
            const employeeIndex = (day + i) % employeeIds.length;
            const employeeId = employeeIds[employeeIndex];
            const profile = profileTemplates.find(p => p.id === employeeId);
            
            if (!profile) continue;
            
            // Create the shift with a consistent schedule (9AM-4PM) for simplicity
            const startTime = new Date(currentDay);
            startTime.setHours(9, 0, 0);
            
            const endTime = new Date(currentDay);
            endTime.setHours(16, 0, 0);
            
            const shiftId = `${role}-${format(currentDay, 'yyyyMMdd')}-${i}`;
            
            allShifts.push({
              id: shiftId,
              employee_id: employeeId,
              shift_type: roleToShiftType[role] as ShiftType,
              department: profile.department || '',
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
              profiles: {
                first_name: profile.first_name,
                last_name: profile.last_name,
                experience_level: profile.experience_level
              }
            });
          }
        });
      }
      
      // Filter shifts based on current view if needed
      if (currentView === 'day') {
        return allShifts.filter(shift => isSameDay(new Date(shift.start_time), currentDate));
      } else if (currentView === 'week') {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Start from Monday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // End on Sunday
        
        return allShifts.filter(shift => {
          const shiftDate = new Date(shift.start_time);
          return shiftDate >= weekStart && shiftDate <= weekEnd;
        });
      }
      
      return allShifts;
    },
    enabled: !!user
  });
};
