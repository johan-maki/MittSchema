
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DatabaseProfile } from "@/types/profile";
import { convertDatabaseProfile } from "@/types/profile";

export const useProfileData = () => {
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }

      const convertedProfiles = (data as DatabaseProfile[] || []).map(convertDatabaseProfile);
      console.log('Fetched and converted profiles:', convertedProfiles);
      return convertedProfiles;
    }
  });

  return { profiles };
};
