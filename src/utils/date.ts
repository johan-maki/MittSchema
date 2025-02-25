
import { addDays, startOfWeek, format as dateFnsFormat } from "date-fns";
import { sv } from "date-fns/locale";

export const getWeekDays = (date: Date) => {
  const start = startOfWeek(date, { locale: sv, weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i);
    return {
      date: day,
      dayName: dateFnsFormat(day, 'EEEE', { locale: sv }),
      dayNumber: dateFnsFormat(day, 'd', { locale: sv }),
    };
  });
};

export const formatShiftTime = (date: Date) => {
  return dateFnsFormat(date, 'HH:mm');
};

export const format = dateFnsFormat;
