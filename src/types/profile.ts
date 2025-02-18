
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  phone?: string;
  is_manager: boolean;
  created_at: string;
  updated_at: string;
}
