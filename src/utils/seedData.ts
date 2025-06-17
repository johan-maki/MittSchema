import { supabase } from "@/integrations/supabase/client";

// Sample employees data
const sampleEmployees = [
  {
    id: "emp-001",
    first_name: "Anna",
    last_name: "Andersson",
    role: "Undersköterska",
    department: "Medicin",
    experience_level: 3,
    is_manager: false,
    phone: "+46 70 123 4567",
    work_preferences: {
      preferred_shifts: ["day", "evening"],
      max_shifts_per_week: 5,
      unavailable_dates: []
    }
  },
  {
    id: "emp-002", 
    first_name: "Erik",
    last_name: "Eriksson",
    role: "Sjuksköterska",
    department: "Akutmottagning",
    experience_level: 5,
    is_manager: true,
    phone: "+46 70 234 5678",
    work_preferences: {
      preferred_shifts: ["day", "night"],
      max_shifts_per_week: 4,
      unavailable_dates: []
    }
  },
  {
    id: "emp-003",
    first_name: "Maria",
    last_name: "Johansson", 
    role: "Läkare",
    department: "Kirurgi",
    experience_level: 7,
    is_manager: false,
    phone: "+46 70 345 6789",
    work_preferences: {
      preferred_shifts: ["day"],
      max_shifts_per_week: 5,
      unavailable_dates: []
    }
  },
  {
    id: "emp-004",
    first_name: "Lars",
    last_name: "Larsson",
    role: "Undersköterska",
    department: "Ortopedi",
    experience_level: 2,
    is_manager: false,
    phone: "+46 70 456 7890",
    work_preferences: {
      preferred_shifts: ["evening", "night"],
      max_shifts_per_week: 4,
      unavailable_dates: []
    }
  },
  {
    id: "emp-005",
    first_name: "Karin",
    last_name: "Karlsson",
    role: "Sjuksköterska",
    department: "Medicin",
    experience_level: 4,
    is_manager: false,
    phone: "+46 70 567 8901",
    work_preferences: {
      preferred_shifts: ["day", "evening"],
      max_shifts_per_week: 5,
      unavailable_dates: []
    }
  }
];

// Sample shifts data for next week
const sampleShifts = [
  {
    id: "shift-001",
    employee_id: "emp-001",
    start_time: "2025-06-18T07:00:00",
    end_time: "2025-06-18T15:00:00", 
    shift_type: "day" as const,
    department: "Medicin",
    notes: "Morgonpass medicinavdelning"
  },
  {
    id: "shift-002",
    employee_id: "emp-002",
    start_time: "2025-06-18T15:00:00",
    end_time: "2025-06-18T23:00:00",
    shift_type: "evening" as const, 
    department: "Akutmottagning",
    notes: "Kvällspass akuten"
  },
  {
    id: "shift-003",
    employee_id: "emp-003",
    start_time: "2025-06-19T08:00:00",
    end_time: "2025-06-19T16:00:00",
    shift_type: "day" as const,
    department: "Kirurgi",
    notes: "Dagpass kirurgi"
  },
  {
    id: "shift-004",
    employee_id: "emp-004",
    start_time: "2025-06-19T23:00:00",
    end_time: "2025-06-20T07:00:00",
    shift_type: "night" as const,
    department: "Ortopedi",
    notes: "Nattpass ortopedi"
  },
  {
    id: "shift-005",
    employee_id: "emp-005",
    start_time: "2025-06-20T07:00:00",
    end_time: "2025-06-20T15:00:00",
    shift_type: "day" as const,
    department: "Medicin", 
    notes: "Morgonpass medicin"
  }
];

export const seedSupabaseData = async () => {
  try {
    console.log("🌱 Starting data seeding...");
    
    // First, check if data already exists
    const { data: existingEmployees } = await supabase
      .from('employees')
      .select('id')
      .limit(1);
      
    if (existingEmployees && existingEmployees.length > 0) {
      console.log("✅ Data already exists, skipping seeding");
      return { success: true, message: "Data already exists" };
    }

    // Insert employees
    console.log("📝 Inserting employees...");
    const { error: employeeError } = await supabase
      .from('employees')
      .insert(sampleEmployees);

    if (employeeError) {
      console.error("❌ Failed to insert employees:", employeeError);
      return { success: false, error: employeeError.message };
    }

    // Insert shifts
    console.log("📅 Inserting shifts...");
    const { error: shiftError } = await supabase
      .from('shifts')
      .insert(sampleShifts);

    if (shiftError) {
      console.error("❌ Failed to insert shifts:", shiftError);
      return { success: false, error: shiftError.message };
    }

    console.log("✅ Data seeding completed successfully!");
    return { 
      success: true, 
      message: `Added ${sampleEmployees.length} employees and ${sampleShifts.length} shifts` 
    };

  } catch (error) {
    console.error("💥 Data seeding failed:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
