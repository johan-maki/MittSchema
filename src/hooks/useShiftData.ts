
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
      console.log('🔍 DEBUG: Date calculation details:', {
        currentDate: currentDate.toISOString(),
        currentView,
        dayOfWeek: currentView === 'week' ? currentDate.getDay() : 'N/A',
        startDate: startDateStr,
        endDate: endDateStr
      });
      
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
      console.log('🔍 DEBUG: First 3 shifts:', shifts?.slice(0, 3).map(s => ({
        id: s.id,
        start_time: s.start_time,
        shift_type: s.shift_type,
        employee: s.profiles ? `${s.profiles.first_name} ${s.profiles.last_name}` : 'NO PROFILE'
      })));
      
      if (currentView === 'week') {
        // Log Monday shifts specifically for July week
        const mondayShifts = shifts?.filter(s => s.start_time.startsWith('2025-07-07')) || [];
        console.log('🔍 DEBUG: Monday 2025-07-07 shifts:', mondayShifts.map(s => ({
          shift_type: s.shift_type,
          employee: s.profiles ? `${s.profiles.first_name} ${s.profiles.last_name}` : 'NO PROFILE',
          start_time: s.start_time
        })));
      }
      
      return shifts || [];
    },
    enabled: !!user,
    staleTime: 0, // Force fresh data
    refetchOnWindowFocus: true
  });
};
