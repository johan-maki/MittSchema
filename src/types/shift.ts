
export type ShiftType = 'day' | 'evening' | 'night';

export type Shift = {
  id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  shift_type: ShiftType;
  department: string;
  notes?: string;
  created_by?: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
};

export type ShiftFormData = {
  start_time: string;
  end_time: string;
  shift_type: ShiftType;
  department: string;
  notes: string;
  employee_id?: string;
};
