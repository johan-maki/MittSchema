
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DatabaseProfile } from "@/types/profile";
import { convertDatabaseProfile } from "@/types/profile";

export const useProfileData = () => {
  const { data: profiles = [], isLoading, error } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      console.log("🔍 useProfileData: Fetching all profiles from database...");
      const { data, error } = await supabase
        .from('employees')
        .select('*');

      if (error) {
        console.error('🔍 useProfileData: Error fetching profiles:', error);
        throw error;
      }

      const convertedProfiles = (data as DatabaseProfile[] || []).map(convertDatabaseProfile);
      console.log('🔍 useProfileData: Fetched and converted profiles:', convertedProfiles.length, convertedProfiles);
      return convertedProfiles;
    },
    refetchOnWindowFocus: false
  });

  console.log('🔍 useProfileData: Current state:', {
    profilesCount: profiles.length,
    isLoading,
    error,
    profiles: profiles
  });

  return { profiles, isLoading, error };
};
