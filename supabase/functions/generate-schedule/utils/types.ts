
export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  experience_level: number;
  department?: string;
  work_preferences?: {
    preferred_shifts?: string[];
    max_shifts_per_week?: number;
    available_days?: string[];
  };
}

export interface Settings {
  max_consecutive_days: number;
  min_rest_hours: number;
  morning_shift: { min_staff: number; min_experience_sum: number };
  afternoon_shift: { min_staff: number; min_experience_sum: number };
  night_shift: { min_staff: number; min_experience_sum: number };
  senior_experience_threshold: number;
}

export interface Shift {
  id: string;
  employee_id: string;
  shift_type: 'day' | 'evening' | 'night';
  start_time: string;
  end_time: string;
  department?: string;
}

export interface StaffingIssue {
  date: string;
  shiftType: string;
  current: number;
  required: number;
}

export interface ScheduleRequest {
  start_date: string;
  end_date: string;
  department?: string;
}

export interface ScheduleResponse {
  schedule: Shift[];
  staffingIssues: StaffingIssue[];
}
