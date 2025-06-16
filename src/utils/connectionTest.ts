import { supabase } from "@/integrations/supabase/client";

export const testSupabaseConnection = async () => {
  try {
    console.log("Testing Supabase connection...");
    
    // Test basic connection
    const { data, error } = await supabase
      .from('employees')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error("Supabase connection error:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Supabase connection successful");
    return { success: true, data };
  } catch (err) {
    console.error("Network error:", err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown network error' };
  }
};
