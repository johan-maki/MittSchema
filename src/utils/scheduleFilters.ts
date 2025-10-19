/**
 * Shift Filtering Utilities
 * Provides comprehensive filtering logic for shift schedules
 */

import { Shift } from '@/types/shift';
import type { ScheduleFilterOptions } from '@/components/schedule/ScheduleFilters';

/**
 * Filter shifts based on provided filter options
 */
export function filterShifts(
  shifts: Shift[],
  filters: ScheduleFilterOptions
): Shift[] {
  let filtered = [...shifts];

  // Filter by employee
  if (filters.employee) {
    filtered = filtered.filter(shift => shift.employee_id === filters.employee);
  }

  // Filter by department
  if (filters.department) {
    filtered = filtered.filter(shift => {
      if (!shift.profiles) return false;
      const profile = shift.profiles as { department?: string | null };
      return profile.department === filters.department;
    });
  }

  // Filter by shift type
  if (filters.shiftType && filters.shiftType !== 'all') {
    filtered = filtered.filter(shift => shift.shift_type === filters.shiftType);
  }

  // Filter by experience level
  if (filters.experienceLevel && filters.experienceLevel !== 'all') {
    filtered = filtered.filter(shift => {
      if (!shift.profiles) return false;
      const profile = shift.profiles as { experience_level?: number };
      return profile.experience_level === filters.experienceLevel;
    });
  }

  // Filter by publication status
  if (filters.publicationStatus && filters.publicationStatus !== 'all') {
    const shouldBePublished = filters.publicationStatus === 'published';
    filtered = filtered.filter(shift => {
      const isPublished = shift.is_published === true;
      return isPublished === shouldBePublished;
    });
  }

  return filtered;
}

/**
 * Count active filters
 */
export function countActiveFilters(filters: ScheduleFilterOptions): number {
  let count = 0;
  
  if (filters.employee) count++;
  if (filters.department) count++;
  if (filters.shiftType && filters.shiftType !== 'all') count++;
  if (filters.experienceLevel && filters.experienceLevel !== 'all') count++;
  if (filters.publicationStatus && filters.publicationStatus !== 'all') count++;
  
  return count;
}

/**
 * Get unique departments from employees
 */
export function getUniqueDepartments(
  employees: Array<{ role?: string; department?: string | null }>
): string[] {
  const departments = new Set<string>();
  
  employees.forEach(emp => {
    if (emp.department) {
      departments.add(emp.department);
    }
  });
  
  return Array.from(departments).sort();
}

/**
 * Get filter summary text
 */
export function getFilterSummary(
  filters: ScheduleFilterOptions,
  totalShifts: number,
  filteredShifts: number,
  employees: Array<{ id: string; first_name: string; last_name: string }>
): string {
  const activeCount = countActiveFilters(filters);
  
  if (activeCount === 0) {
    return `Visar alla ${totalShifts} pass`;
  }
  
  const parts: string[] = [];
  
  if (filters.employee) {
    const emp = employees.find(e => e.id === filters.employee);
    if (emp) {
      parts.push(`${emp.first_name} ${emp.last_name}`);
    }
  }
  
  if (filters.department) {
    parts.push(filters.department);
  }
  
  if (filters.shiftType && filters.shiftType !== 'all') {
    const typeMap = {
      day: 'dagpass',
      evening: 'kvällspass',
      night: 'nattpass'
    };
    parts.push(typeMap[filters.shiftType]);
  }
  
  if (filters.experienceLevel && filters.experienceLevel !== 'all') {
    parts.push(`nivå ${filters.experienceLevel}`);
  }
  
  if (filters.publicationStatus && filters.publicationStatus !== 'all') {
    parts.push(filters.publicationStatus === 'published' ? 'publicerade' : 'ej publicerade');
  }
  
  return `Visar ${filteredShifts} av ${totalShifts} pass${parts.length > 0 ? ': ' + parts.join(', ') : ''}`;
}
