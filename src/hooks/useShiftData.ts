
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
        
        // 🔧 CRITICAL FIX: Extend end date to capture night shifts that start on last day
        // Problem: Night shifts starting 31/8 22:00 are filtered out by strict month boundary
        // Solution: Add 6 hours to capture night shifts starting late in the month
        endDate = new Date(endDate);
        endDate.setHours(23, 59, 59, 999);
        endDate = addDays(endDate, 1); // Include next day's early hours for night shifts
        endDate.setHours(5, 59, 59, 999); // Capture until 06:00 next day
        
        // 🔍 Reduced debug logging
        if (currentView === 'month') {
          console.log(`📅 MONTH QUERY RANGE: ${format(startDate, 'yyyy-MM-dd HH:mm')} to ${format(endDate, 'yyyy-MM-dd HH:mm')}`);
        }
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
      
      // 🔍 CRITICAL DEBUG: Check if we're filtering correctly for target month
      if (currentView === 'month' && shifts && shifts.length > 0) {
        const targetMonth = currentDate.getMonth() + 1; // 1-indexed month
        const actualMonthShifts = shifts.filter(shift => {
          const shiftMonth = shift.start_time ? parseInt(shift.start_time.split('-')[1]) : null;
          return shiftMonth === targetMonth;
        });
        
        console.log(`🎯 TARGET MONTH FILTER ANALYSIS:`);
        console.log(`  Viewing month: ${targetMonth}`);
        console.log(`  Total retrieved: ${shifts.length}`);
        console.log(`  In target month: ${actualMonthShifts.length}`);
        console.log(`  Filter range: ${startDateStr} to ${endDateStr}`);
        
        if (actualMonthShifts.length !== shifts.length) {
          const wrongMonthShifts = shifts.filter(shift => {
            const shiftMonth = shift.start_time ? parseInt(shift.start_time.split('-')[1]) : null;
            return shiftMonth !== targetMonth;
          });
          
          console.warn(`🚨 RETRIEVED SHIFTS FROM WRONG MONTHS: ${wrongMonthShifts.length}`, 
            wrongMonthShifts.map(s => ({
              id: s.id,
              start_time: s.start_time,
              month: s.start_time ? parseInt(s.start_time.split('-')[1]) : null,
              expected_month: targetMonth
            }))
          );
        }
      }
      
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
          // 🔧 CRITICAL FIX: Additional safety filter for strict month boundaries
          // Remove any shifts that don't belong to the target month (for month view)
          if (currentView === 'month') {
            const targetMonth = currentDate.getMonth() + 1; // 1-indexed month
            const targetYear = currentDate.getFullYear();
            const shiftStartTime = shift.start_time;
            
            if (shiftStartTime) {
              const [shiftYear, shiftMonth] = shiftStartTime.split('-').map(Number);
              // Only include shifts that start in the exact target month and year
              if (shiftMonth !== targetMonth || shiftYear !== targetYear) {
                console.warn(`🚨 FILTERING OUT BOUNDARY SHIFT IN UI:`, {
                  id: shift.id,
                  start_time: shiftStartTime,
                  shift_month: shiftMonth,
                  target_month: targetMonth,
                  shift_year: shiftYear,
                  target_year: targetYear,
                  reason: 'Boundary shift excluded from month view'
                });
                return false;
              }
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
