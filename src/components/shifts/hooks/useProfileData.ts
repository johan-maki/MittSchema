
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DatabaseProfile } from "@/types/profile";
import { convertDatabaseProfile } from "@/types/profile";

export const useProfileData = () => {
  const { data: profiles = [], isLoading, error } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      console.log("Fetching all profiles from database...");
      const { data, error } = await supabase
        .from('employees')
        .select('*');

      if (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }

      const convertedProfiles = (data as DatabaseProfile[] || []).map(convertDatabaseProfile);
      console.log('Fetched and converted profiles:', convertedProfiles);
      return convertedProfiles;
    },
    refetchOnWindowFocus: false
  });

  return { profiles, isLoading, error };
};
