export type ShiftType = 'day' | 'evening' | 'night';

export type Role = 'Läkare' | 'Sjuksköterska' | 'Undersköterska';

export type Shift = {
  id: string;
  employee_id: string;
  date?: string; // Add date field for proper scheduling
  start_time: string;
  end_time: string;
  shift_type: ShiftType;
  department: string;
  notes?: string;
  created_by?: string;
  is_published?: boolean;
  profiles?: {
    first_name: string;
    last_name: string;
    hourly_rate?: number;
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

// Cost calculation types
export type ShiftCost = {
  shift_id: string;
  employee_id: string;
  employee_name: string;
  shift_type: ShiftType;
  date: string;
  hours: number;
  hourly_rate: number;
  total_cost: number;
};

export type ScheduleCostSummary = {
  total_cost: number;
  total_hours: number;
  employee_costs: Array<{
    employee_id: string;
    employee_name: string;
    hours: number;
    cost: number;
  }>;
  shift_type_costs: Array<{
    shift_type: ShiftType;
    hours: number;
    cost: number;
  }>;
  daily_costs: Array<{
    date: string;
    cost: number;
  }>;
};
