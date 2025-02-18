
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string | null;
  phone?: string | null;
  is_manager: boolean;
  created_at: string;
  updated_at: string;
}

export type NewProfile = Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
