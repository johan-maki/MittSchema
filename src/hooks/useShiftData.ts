
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shift, ShiftType } from "@/types/shift";
import { format, addDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export const useShiftData = (currentDate: Date, currentView: 'day' | 'week' | 'month') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shifts', currentDate, currentView, 'department-fix-v1'], // Force cache refresh with department data
    queryFn: async () => {
      if (!user) return [];
      
      let startDate, endDate;
      
      // Determine the date range based on the view
      if (currentView === 'day') {
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0); // Set to start of day
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
      } else if (currentView === 'week') {
        // Start from Monday of the current week
        const dayOfWeek = currentDate.getDay();
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        startDate.setHours(0, 0, 0, 0); // Set to start of day
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // End on Sunday
        endDate.setHours(23, 59, 59, 999); // Set to end of day
      } else { // month
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        
        // 🔧 CRITICAL FIX: Extend end date to capture night shifts that start on last day
        // Problem: Night shifts starting 31/8 22:00 are filtered out by strict month boundary
        // Solution: Add 6 hours to capture night shifts starting late in the month
        const originalEndDate = new Date(endDate);
        endDate = new Date(endDate);
        endDate.setHours(23, 59, 59, 999);
        endDate = addDays(endDate, 1); // Include next day's early hours for night shifts
        endDate.setHours(5, 59, 59, 999); // Capture until 06:00 next day
      }
      
      // Format dates to ISO strings in UTC
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      // Get shifts from Supabase
      const { data: shifts, error } = await supabase
        .from('shifts')
        .select(`
          *,
          profiles:employees!shifts_employee_id_fkey (
            first_name,
            last_name,
            experience_level,
            department
          )
        `)
        .gte('start_time', startDateStr)
        .lte('start_time', endDateStr)
        .order('start_time', { ascending: true });
      
      if (error) {
        console.error('Error fetching shifts:', error);
        return [];
      }
      
      console.log(`Retrieved ${shifts?.length || 0} shifts from Supabase`);
      
      // Quick validation for month boundary issues (debug only)
      if (currentView === 'month' && shifts && shifts.length > 0) {
        const targetMonth = currentDate.getMonth() + 1; // 1-indexed month
        const actualMonthShifts = shifts.filter(shift => {
          const shiftMonth = shift.start_time ? parseInt(shift.start_time.split('-')[1]) : null;
          return shiftMonth === targetMonth;
        });
        
        // Only log when there are potential issues
        if (actualMonthShifts.length !== shifts.length && shifts.length > 0) {
          console.warn(`⚠️ Month boundary issue: Retrieved ${shifts.length} shifts, ${actualMonthShifts.length} in target month ${targetMonth}`);
        }
      }
      
      // Filter out shifts with invalid profile data and type-safe transform
      const validShifts: Shift[] = (shifts || [])
        .filter(shift => {
          // 🔧 IMPROVED MONTH BOUNDARY FILTERING
          // For month view, we need special handling of night shifts that cross month boundaries
          if (currentView === 'month') {
            const targetMonth = currentDate.getMonth() + 1; // 1-indexed month
            const targetYear = currentDate.getFullYear();
            const shiftStartTime = shift.start_time;
            
            if (shiftStartTime) {
              const [shiftYear, shiftMonth] = shiftStartTime.split('-').map(Number);
              
              // ✅ KEEP: Shifts that start in the target month (normal case)
              if (shiftMonth === targetMonth && shiftYear === targetYear) {
                return true;
              }
              
              // ✅ SPECIAL CASE: Previous month's night shifts that belong to target month's first day
              // Example: July 31st 22:00 night shift should appear on August 1st
              if (shiftMonth === (targetMonth === 1 ? 12 : targetMonth - 1) && 
                  shift.shift_type === 'night') {
                const shiftDate = new Date(shiftStartTime);
                const shiftDay = shiftDate.getUTCDate();
                const daysInPrevMonth = new Date(targetYear, targetMonth - 1, 0).getDate();
                
                // Only include if it's the last day of previous month (night shift spillover)
                if (shiftDay === daysInPrevMonth) {
                  return true;
                }
              }
              
              // ❌ EXCLUDE: All other shifts from wrong months
              console.warn(`🚨 FILTERING OUT BOUNDARY SHIFT IN UI:`, {
                id: shift.id,
                start_time: shiftStartTime,
                shift_month: shiftMonth,
                target_month: targetMonth,
                shift_year: shiftYear,
                target_year: targetYear,
                shift_type: shift.shift_type,
                reason: 'Boundary shift excluded from month view'
              });
              return false;
            }
          }
          
          if (!shift.profiles || typeof shift.profiles !== 'object') {
            console.warn('Invalid profile data for shift:', shift.id);
            return false;
          }
          // Check if profiles has error property (SelectQueryError)
          if ('error' in shift.profiles && shift.profiles.error) {
            console.warn('Profile query error for shift:', shift.id, shift.profiles);
            return false;
          }
          // Ensure required profile fields exist
          return shift.profiles && 
                 typeof shift.profiles === 'object' &&
                 'first_name' in shift.profiles && 
                 'last_name' in shift.profiles &&
                 shift.profiles.first_name && 
                 shift.profiles.last_name;
        })
        .map(shift => {
          const profileData = shift.profiles as { first_name: string; last_name: string; experience_level?: number };
          return {
            ...shift,
            profiles: {
              first_name: profileData.first_name,
              last_name: profileData.last_name,
              hourly_rate: undefined, // Default since it doesn't exist in employees table
              experience_level: profileData.experience_level || 1 // Add experience_level with default
            }
          };
        });
      
      return validShifts;
    },
    enabled: !!user,
    staleTime: 0, // Force fresh data
    refetchOnWindowFocus: true
  });
};
