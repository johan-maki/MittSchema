
import { addDays, startOfWeek, format } from "date-fns";
import { sv } from "date-fns/locale";

export const getWeekDays = (date: Date) => {
  const start = startOfWeek(date, { locale: sv });
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i);
    return {
      date: day,
      dayName: format(day, 'EEEE', { locale: sv }),
      dayNumber: format(day, 'd', { locale: sv }),
    };
  });
};

export const formatShiftTime = (date: Date) => {
  return format(date, 'HH:mm');
};
