
export type ShiftTimeConfig = {
  start_time: string;
  end_time: string;
  min_staff: number;
  min_experience_sum: number;
  min_senior_count: number;
};

export type ScheduleSettings = {
  id: string;
  department: string;
  morning_shift: ShiftTimeConfig;
  afternoon_shift: ShiftTimeConfig;
  night_shift: ShiftTimeConfig;
  max_consecutive_days: number;
  min_rest_hours: number;
  require_night_shift_qualification: boolean;
  min_weekly_rest_hours: number;
  senior_experience_threshold: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
};
