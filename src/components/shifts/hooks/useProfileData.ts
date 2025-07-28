
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DatabaseProfile } from "@/types/profile";
import { convertDatabaseProfile } from "@/types/profile";

export const useProfileData = () => {
  const { data: profiles = [], isLoading, error } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      console.log('🔍 useProfileData: Fetching employees from database...');
      const { data, error } = await supabase
        .from('employees')
        .select('*');

      if (error) {
        console.error('❌ useProfileData: Error fetching profiles:', error);
        throw error;
      }

      const convertedProfiles = (data as DatabaseProfile[] || []).map(convertDatabaseProfile);
      console.log(`✅ useProfileData: Loaded ${convertedProfiles.length} employee profiles`);
      
      // Log first few names for debugging
      if (convertedProfiles.length > 0) {
        const names = convertedProfiles.slice(0, 3).map(p => `${p.first_name} ${p.last_name}`).join(', ');
        console.log(`👥 useProfileData: First employees: ${names}${convertedProfiles.length > 3 ? '...' : ''}`);
      }
      
      return convertedProfiles;
    },
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // React Query v5 uses gcTime instead of cacheTime
  });

  return { profiles, isLoading, error };
};
