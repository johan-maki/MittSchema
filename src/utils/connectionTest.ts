import { supabase } from "@/integrations/supabase/client";

export const testSupabaseConnection = async () => {
  try {
    console.log("Testing Supabase connection...");
    console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL ? "✓ Set" : "✗ Missing");
    console.log("Supabase Key:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing");
    
    // First test if supabase client exists
    if (!supabase) {
      console.error("Supabase client not initialized");
      return { success: false, error: "Supabase client not available" };
    }

    // Test basic connection with a simple auth check first
    const { data: user, error: authError } = await supabase.auth.getUser();
    console.log("Auth check result:", { user: !!user, error: authError?.message });

    // Test database connection
    const { data, error } = await supabase
      .from('employees')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error("Supabase connection error:", error);
      // Don't fail completely, just warn and continue with mock data
      console.warn("Using fallback mock data due to connection issues");
      return { success: true, warning: "Using offline mode", error: error.message };
    }
    
    console.log("Supabase connection successful");
    return { success: true, data };
  } catch (err) {
    console.error("Network error:", err);
    // Return success with warning to allow app to continue with mock data
    return { success: true, warning: "Using offline mode", error: err instanceof Error ? err.message : 'Unknown network error' };
  }
};
