
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type LeaveType = 'vacation' | 'sick' | 'personal' | 'education' | 'other';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason?: string;
  status: LeaveStatus;
  created_at: string;
  updated_at?: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}
