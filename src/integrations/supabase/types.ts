export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      leave_requests: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          recipient_id: string | null
          recipient_type: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          recipient_id?: string | null
          recipient_type?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          recipient_id?: string | null
          recipient_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          experience_level: number
          first_name: string
          id: string
          is_manager: boolean
          last_name: string
          phone: string | null
          role: string
          updated_at: string
          work_preferences: Json | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          experience_level?: number
          first_name: string
          id: string
          is_manager?: boolean
          last_name: string
          phone?: string | null
          role: string
          updated_at?: string
          work_preferences?: Json | null
        }
        Update: {
          created_at?: string
          department?: string | null
          experience_level?: number
          first_name?: string
          id?: string
          is_manager?: boolean
          last_name?: string
          phone?: string | null
          role?: string
          updated_at?: string
          work_preferences?: Json | null
        }
        Relationships: []
      }
      schedule_settings: {
        Row: {
          afternoon_shift: Database["public"]["CompositeTypes"]["shift_time_config"]
          created_at: string
          created_by: string | null
          department: string
          id: string
          max_consecutive_days: number
          min_rest_hours: number
          min_weekly_rest_hours: number
          morning_shift: Database["public"]["CompositeTypes"]["shift_time_config"]
          night_shift: Database["public"]["CompositeTypes"]["shift_time_config"]
          require_night_shift_qualification: boolean
          senior_experience_threshold: number
          updated_at: string
        }
        Insert: {
          afternoon_shift: Database["public"]["CompositeTypes"]["shift_time_config"]
          created_at?: string
          created_by?: string | null
          department: string
          id?: string
          max_consecutive_days?: number
          min_rest_hours?: number
          min_weekly_rest_hours?: number
          morning_shift: Database["public"]["CompositeTypes"]["shift_time_config"]
          night_shift: Database["public"]["CompositeTypes"]["shift_time_config"]
          require_night_shift_qualification?: boolean
          senior_experience_threshold?: number
          updated_at?: string
        }
        Update: {
          afternoon_shift?: Database["public"]["CompositeTypes"]["shift_time_config"]
          created_at?: string
          created_by?: string | null
          department?: string
          id?: string
          max_consecutive_days?: number
          min_rest_hours?: number
          min_weekly_rest_hours?: number
          morning_shift?: Database["public"]["CompositeTypes"]["shift_time_config"]
          night_shift?: Database["public"]["CompositeTypes"]["shift_time_config"]
          require_night_shift_qualification?: boolean
          senior_experience_threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          created_at: string
          created_by: string | null
          department: string | null
          employee_id: string | null
          end_time: string
          id: string
          is_published: boolean | null
          notes: string | null
          shift_type: Database["public"]["Enums"]["shift_type"]
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          employee_id?: string | null
          end_time: string
          id?: string
          is_published?: boolean | null
          notes?: string | null
          shift_type: Database["public"]["Enums"]["shift_type"]
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          employee_id?: string | null
          end_time?: string
          id?: string
          is_published?: boolean | null
          notes?: string | null
          shift_type?: Database["public"]["Enums"]["shift_type"]
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      updates: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          is_important: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_important?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_important?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      shift_experience_levels: {
        Row: {
          employee_id: string | null
          end_time: string | null
          experience_level: number | null
          role: string | null
          start_time: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_user_with_profile: {
        Args: {
          email: string
          role: string
          first_name: string
          last_name: string
          department: string
          phone: string
          is_manager: boolean
        }
        Returns: string
      }
      dev_add_profile: {
        Args: {
          profile_id: string
          first_name: string
          last_name: string
          role_val: string
          department_val: string
          phone_val: string
          experience_level_val: number
        }
        Returns: {
          created_at: string
          department: string | null
          experience_level: number
          first_name: string
          id: string
          is_manager: boolean
          last_name: string
          phone: string | null
          role: string
          updated_at: string
          work_preferences: Json | null
        }[]
      }
      postgres_fdw_disconnect: {
        Args: {
          "": string
        }
        Returns: boolean
      }
      postgres_fdw_disconnect_all: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      postgres_fdw_get_connections: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, unknown>[]
      }
      postgres_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      shift_type: "day" | "evening" | "night"
    }
    CompositeTypes: {
      shift_time_config: {
        start_time: string | null
        end_time: string | null
        min_staff: number | null
        min_experience_sum: number | null
        min_senior_count: number | null
      }
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
