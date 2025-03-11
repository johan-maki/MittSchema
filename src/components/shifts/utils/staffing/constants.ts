
import type { ShiftType } from "@/types/shift";

/**
 * Constants related to staffing requirements
 */

// Map of role to preferred shift type
export const ROLE_TO_SHIFT_TYPE: Record<string, ShiftType> = {
  'Läkare': 'day',
  'Sjuksköterska': 'evening',
  'Undersköterska': 'night'
};

// Set minimum staffing requirements
export const MIN_STAFF_BY_SHIFT_TYPE: Record<ShiftType, number> = {
  'day': 3,
  'evening': 3,
  'night': 2
};
