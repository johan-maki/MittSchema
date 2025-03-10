
import { startOfWeek, endOfWeek, eachDayOfInterval, addDays, startOfMonth, endOfMonth, format } from 'date-fns';

export const getWeekDays = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const generateDaysInMonth = (date: Date) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  // Get the first day of the month
  const firstDayOfMonth = start.getDay();
  // If it's Sunday (0), make it 7 to align with European calendar (Monday = 1)
  const firstDayIndex = firstDayOfMonth === 0 ? 7 : firstDayOfMonth;
  
  // Calculate how many days we need to show from the previous month
  const daysFromPrevMonth = firstDayIndex - 1;
  
  // Start from the first day to show (might be from previous month)
  const calendarStart = addDays(start, -daysFromPrevMonth);
  
  // We need to show 6 weeks (42 days) total
  const calendarEnd = addDays(calendarStart, 41);
  
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
};
