
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, getDay, startOfMonth, startOfWeek } from 'date-fns';

/**
 * Get an array of dates for the calendar view
 */
export const getCalendarDays = (date: Date): Date[] => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start from Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 }); // End on Sunday

  return eachDayOfInterval({ start: startDate, end: endDate });
};

// For backward compatibility if needed
export const generateDaysInMonth = getCalendarDays;
