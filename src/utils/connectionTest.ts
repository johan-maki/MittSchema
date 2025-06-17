import { supabase } from "@/integrations/supabase/client";

export const testSupabaseConnection = async () => {
  try {
    console.log("Testing Supabase connection...");
    console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL ? "✓ Set" : "✗ Missing");
    console.log("Supabase Key:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing");
    
    // Test basic database connection
    const { data, error } = await supabase
      .from('employees')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error("Supabase connection error:", error);
      return { success: false, error: error.message };
    }
    
    console.log("✅ Supabase connection successful");
    return { success: true, data };
  } catch (err) {
    console.error("Network error:", err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown network error' };
  }
};
