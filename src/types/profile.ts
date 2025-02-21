
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  phone: string | null;
  is_manager: boolean;
  created_at: string;
  updated_at: string;
}

// För nya profiler behöver vi inte id, created_at eller updated_at
// eftersom dessa hanteras av Supabase
export type NewProfile = {
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  phone: string | null;
  is_manager: boolean;
};

// Detta är typen som Supabase förväntar sig vid insättning
export type InsertProfile = {
  first_name: string;
  last_name: string;
  role: string;
  department?: string | null;
  phone?: string | null;
  is_manager?: boolean;
};
