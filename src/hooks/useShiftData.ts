
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shift, ShiftType } from "@/types/shift";
import { format, addDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export const useShiftData = (currentDate: Date, currentView: 'day' | 'week' | 'month') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shifts', currentDate, currentView],
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
      }
      
      // Format dates to ISO strings in UTC
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      console.log(`Fetching shifts from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
      console.log(`🔍 QUERY FILTERS: start_time >= '${startDateStr}' AND start_time <= '${endDateStr}'`);
      
      // Get shifts from Supabase
      const { data: shifts, error } = await supabase
        .from('shifts')
        .select(`
          *,
          profiles:employees!shifts_employee_id_fkey (
            first_name,
            last_name,
            experience_level
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
      
      // 🔍 CRITICAL DEBUG: Analyze retrieved shifts for date issues
      if (shifts && shifts.length > 0) {
        const dateAnalysis = {};
        const problemShifts = [];
        
        shifts.forEach((shift, index) => {
          const startTime = shift.start_time;
          const dateFromStartTime = startTime ? startTime.split('T')[0] : null;
          
          if (dateFromStartTime) {
            const [year, month, day] = dateFromStartTime.split('-').map(Number);
            dateAnalysis[month] = (dateAnalysis[month] || 0) + 1;
            
            if (month !== 8) {
              problemShifts.push({
                index,
                id: shift.id,
                start_time: startTime,
                end_time: shift.end_time,
                shift_type: shift.shift_type,
                employee_id: shift.employee_id,
                start_month: month,
                date_from_start_time: dateFromStartTime
              });
            }
          }
        });
        
        console.log('🔍 RETRIEVED SHIFTS DATE ANALYSIS:');
        console.log('  Date distribution by month:', dateAnalysis);
        
        if (problemShifts.length > 0) {
          console.warn(`🚨 FOUND ${problemShifts.length} RETRIEVED SHIFTS WITH WRONG START_TIME MONTH:`, problemShifts);
        }
        
        // Sample first and last shifts
        console.log('🔍 SAMPLE RETRIEVED SHIFTS (First 3):');
        shifts.slice(0, 3).forEach((shift, i) => {
          console.log(`  Retrieved Shift ${i + 1}:`, {
            id: shift.id,
            start_time: shift.start_time,
            end_time: shift.end_time,
            shift_type: shift.shift_type,
            date_from_start_time: shift.start_time ? shift.start_time.split('T')[0] : null
          });
        });
        
        if (shifts.length > 3) {
          console.log('🔍 SAMPLE RETRIEVED SHIFTS (Last 3):');
          shifts.slice(-3).forEach((shift, i) => {
            console.log(`  Retrieved Shift ${shifts.length - 2 + i}:`, {
              id: shift.id,
              start_time: shift.start_time,
              end_time: shift.end_time,
              shift_type: shift.shift_type,
              date_from_start_time: shift.start_time ? shift.start_time.split('T')[0] : null
            });
          });
        }
      }
      
      // Filter out shifts with invalid profile data and type-safe transform
      const validShifts: Shift[] = (shifts || [])
        .filter(shift => {
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
