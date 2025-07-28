
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DatabaseProfile } from "@/types/profile";
import { convertDatabaseProfile } from "@/types/profile";

export const useProfileData = () => {
  const { data: profiles = [], isLoading, error } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*');

      if (error) {
        console.error('❌ useProfileData: Error fetching profiles:', error);
        throw error;
      }

      const convertedProfiles = (data as DatabaseProfile[] || []).map(convertDatabaseProfile);
      // Only log when data is actually fetched, not on every render
      if (convertedProfiles.length > 0) {
        console.log(`✅ Loaded ${convertedProfiles.length} employee profiles`);
      }
      return convertedProfiles;
    },
    refetchOnWindowFocus: false
  });

  return { profiles, isLoading, error };
};
