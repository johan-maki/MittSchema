
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
        endDate = new Date(currentDate);
      } else if (currentView === 'week') {
        // Start from Monday of the current week
        const dayOfWeek = currentDate.getDay();
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // End on Sunday
      } else { // month
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
      }
      
      // Format dates to ISO strings in UTC
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      console.log(`Fetching shifts from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
      
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
      
      return shifts || [];
    },
    enabled: !!user
  });
};
