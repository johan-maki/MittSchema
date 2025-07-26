
import { Employee } from "./types.ts";

// Map role to shift type for consistent assignment
export const roleToShiftType: Record<string, 'day' | 'evening' | 'night'> = {
  'Läkare': 'day',
  'Sjuksköterska': 'evening',
  'Undersköterska': 'night',
  'Professor': 'day'  // Professorer arbetar dagtid som läkare
};

// Helper function to generate random ID
export function generateId(): string {
  return `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to check if employee is available on a given day
export function isEmployeeAvailable(employee: Employee, date: Date): boolean {
  if (!employee.work_preferences?.available_days) {
    return true; // Default to available if no preferences set
  }
  
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
  return employee.work_preferences.available_days.includes(dayName);
}

// Helper function to get shift times for a given day and type
export function getShiftTimes(date: Date, shiftType: 'day' | 'evening' | 'night'): { start: string, end: string } {
  const dateStr = date.toISOString().split('T')[0];
  
  switch (shiftType) {
    case 'day':
      return {
        start: `${dateStr}T08:00:00.000Z`,
        end: `${dateStr}T16:00:00.000Z`,
      };
    case 'evening':
      return {
        start: `${dateStr}T15:00:00.000Z`,
        end: `${dateStr}T23:00:00.000Z`,
      };
    case 'night':
      return {
        start: `${dateStr}T22:00:00.000Z`,
        end: `${dateStr}T06:00:00.000Z`, // Next day, but we'll simplify for now
      };
  }
}

// Create mock profiles for testing
export function getMockProfiles(): Employee[] {
  return [
    {
      id: "1",
      first_name: "Anna",
      last_name: "Andersson",
      role: "Läkare",
      experience_level: 4
    },
    {
      id: "2",
      first_name: "Bengt",
      last_name: "Bengtsson",
      role: "Sjuksköterska",
      experience_level: 3
    },
    {
      id: "3",
      first_name: "Cecilia",
      last_name: "Carlsson",
      role: "Undersköterska",
      experience_level: 2
    },
    {
      id: "4",
      first_name: "David",
      last_name: "Davidsson",
      role: "Läkare",
      experience_level: 5
    },
    {
      id: "5",
      first_name: "Emma",
      last_name: "Eriksson",
      role: "Sjuksköterska",
      experience_level: 4
    },
    {
      id: "6",
      first_name: "Fredrik",
      last_name: "Fredriksson",
      role: "Undersköterska",
      experience_level: 3
    }
  ];
}
