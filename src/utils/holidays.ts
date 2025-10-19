/**
 * Swedish public holidays (röda dagar) calculator
 * Includes both fixed and movable holidays
 */

import { format, addDays, getYear } from 'date-fns';

export interface Holiday {
  date: Date;
  name: string;
  type: 'public' | 'eve'; // public = röd dag, eve = afton
}

/**
 * Calculate Easter Sunday for a given year using the Anonymous Gregorian algorithm
 */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month, day);
}

/**
 * Get Midsummer Eve (Friday between June 19-25)
 */
function getMidsummerEve(year: number): Date {
  // Midsummer Eve is the Friday between June 19-25
  for (let day = 19; day <= 25; day++) {
    const date = new Date(year, 5, day); // June is month 5 (0-indexed)
    if (date.getDay() === 5) { // Friday
      return date;
    }
  }
  return new Date(year, 5, 19); // Fallback
}

/**
 * Get All Saints' Day (Saturday between October 31 - November 6)
 */
function getAllSaintsDay(year: number): Date {
  // All Saints' Day is the Saturday between October 31 - November 6
  for (let day = 31; day <= 31; day++) {
    const date = new Date(year, 9, day); // October
    if (date.getDay() === 6) return date;
  }
  for (let day = 1; day <= 6; day++) {
    const date = new Date(year, 10, day); // November
    if (date.getDay() === 6) return date;
  }
  return new Date(year, 10, 1); // Fallback
}

/**
 * Get all Swedish public holidays for a given year
 */
export function getSwedishHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];
  
  // Fixed holidays
  holidays.push({ date: new Date(year, 0, 1), name: 'Nyårsdagen', type: 'public' });
  holidays.push({ date: new Date(year, 0, 6), name: 'Trettondedag jul', type: 'public' });
  holidays.push({ date: new Date(year, 4, 1), name: 'Första maj', type: 'public' });
  holidays.push({ date: new Date(year, 5, 6), name: 'Sveriges nationaldag', type: 'public' });
  holidays.push({ date: new Date(year, 11, 24), name: 'Julafton', type: 'eve' });
  holidays.push({ date: new Date(year, 11, 25), name: 'Juldagen', type: 'public' });
  holidays.push({ date: new Date(year, 11, 26), name: 'Annandag jul', type: 'public' });
  holidays.push({ date: new Date(year, 11, 31), name: 'Nyårsafton', type: 'eve' });
  
  // Easter-based holidays (movable)
  const easter = getEasterSunday(year);
  
  holidays.push({ 
    date: addDays(easter, -2), 
    name: 'Långfredagen', 
    type: 'public' 
  });
  holidays.push({ 
    date: addDays(easter, -1), 
    name: 'Påskafton', 
    type: 'eve' 
  });
  holidays.push({ 
    date: easter, 
    name: 'Påskdagen', 
    type: 'public' 
  });
  holidays.push({ 
    date: addDays(easter, 1), 
    name: 'Annandag påsk', 
    type: 'public' 
  });
  holidays.push({ 
    date: addDays(easter, 39), 
    name: 'Kristi himmelsfärdsdag', 
    type: 'public' 
  });
  holidays.push({ 
    date: addDays(easter, 49), 
    name: 'Pingstdagen', 
    type: 'public' 
  });
  
  // Midsummer
  const midsummerEve = getMidsummerEve(year);
  holidays.push({ 
    date: midsummerEve, 
    name: 'Midsommarafton', 
    type: 'eve' 
  });
  holidays.push({ 
    date: addDays(midsummerEve, 1), 
    name: 'Midsommardagen', 
    type: 'public' 
  });
  
  // All Saints' Day
  holidays.push({ 
    date: getAllSaintsDay(year), 
    name: 'Alla helgons dag', 
    type: 'public' 
  });
  
  return holidays;
}

/**
 * Check if a given date is a Swedish public holiday
 */
export function isSwedishHoliday(date: Date): Holiday | null {
  const year = getYear(date);
  const holidays = getSwedishHolidays(year);
  
  const dateStr = format(date, 'yyyy-MM-dd');
  
  for (const holiday of holidays) {
    const holidayStr = format(holiday.date, 'yyyy-MM-dd');
    if (dateStr === holidayStr) {
      return holiday;
    }
  }
  
  return null;
}

/**
 * Get all holidays for a given month
 */
export function getHolidaysForMonth(year: number, month: number): Holiday[] {
  const allHolidays = getSwedishHolidays(year);
  return allHolidays.filter(holiday => holiday.date.getMonth() === month);
}
