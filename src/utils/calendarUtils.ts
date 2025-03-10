
import { addDays, format, getDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';

/**
 * Get an array of dates for a week starting from a given date
 */
export const getWeekDays = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Start on Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });
  
  const days = [];
  let day = start;
  
  while (day <= end) {
    days.push(day);
    day = addDays(day, 1);
  }
  
  return days;
};

/**
 * Get an array of dates for a month arranged in weeks
 */
export const getCalendarDays = (date: Date): Date[][] => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  let day = startDate;
  
  while (day <= endDate) {
    if (getDay(day) === 1 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    
    currentWeek.push(day);
    day = addDays(day, 1);
  }
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  
  return weeks;
};

/**
 * Format date for display
 */
export const formatDate = (date: Date, formatStr: string = 'yyyy-MM-dd'): string => {
  return format(date, formatStr);
};

/**
 * Check if date is in the current month
 */
export const isCurrentMonth = (date: Date, currentDate: Date): boolean => {
  return isSameMonth(date, currentDate);
};
