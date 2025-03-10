
import { startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

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
