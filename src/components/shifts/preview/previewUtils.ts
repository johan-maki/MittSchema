
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import type { Shift } from "@/types/shift";

// Get shift type translation in Swedish
export const getShiftTypeInSwedish = (type: string) => {
  switch (type) {
    case 'day':
      return 'Dagpass';
    case 'evening':
      return 'Kvällspass';
    case 'night':
      return 'Nattpass';
    default:
      return type;
  }
};

// Sort shifts by date and shift type for better organization
export const sortShifts = (shifts: Shift[]) => {
  return [...shifts].sort((a, b) => {
    // First sort by date
    const dateComparison = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    if (dateComparison !== 0) return dateComparison;
    
    // Then by shift type (day, evening, night)
    const shiftTypeOrder = { day: 1, evening: 2, night: 3 };
    return (shiftTypeOrder[a.shift_type as keyof typeof shiftTypeOrder] || 0) - 
           (shiftTypeOrder[b.shift_type as keyof typeof shiftTypeOrder] || 0);
  });
};

// Group shifts by date for better display
export const groupShiftsByDate = (shifts: Shift[]) => {
  return shifts.reduce<Record<string, Shift[]>>((acc, shift) => {
    const dateKey = format(new Date(shift.start_time), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(shift);
    return acc;
  }, {});
};

// Format date to Swedish locale
export const formatDateSwedish = (date: string) => {
  return format(new Date(date), 'EEEE d MMMM', { locale: sv });
};
