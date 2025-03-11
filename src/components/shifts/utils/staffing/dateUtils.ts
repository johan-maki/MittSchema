
/**
 * Utility functions for handling dates in shift scheduling
 */

/**
 * Properly creates a Date object from a date string in the format "YYYY-MM-DD"
 */
export const createDateFromString = (dateStr: string): Date => {
  const dateParts = dateStr.split('-').map(Number);
  // Create date with year, month, and day - note JS months are 0-indexed
  return new Date(dateParts[0], dateParts[1], dateParts[2]);
};

/**
 * Configures start and end times for a shift based on shift type
 */
export const getShiftTimesForDate = (shiftDate: Date, shiftType: string): { 
  startTime: Date, 
  endTime: Date 
} => {
  let startHour = 0, endHour = 0;
  
  switch(shiftType) {
    case 'day':
      startHour = 7;
      endHour = 15;
      break;
    case 'evening':
      startHour = 15;
      endHour = 23;
      break;
    case 'night':
      startHour = 23;
      endHour = 7;
      break;
    default:
      startHour = 9;
      endHour = 17;
  }
  
  const startTime = new Date(shiftDate);
  startTime.setHours(startHour, 0, 0);
  
  const endTime = new Date(shiftDate);
  if (shiftType === 'night') {
    endTime.setDate(endTime.getDate() + 1);
  }
  endTime.setHours(endHour, 0, 0);
  
  return { startTime, endTime };
};
