
import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Profile, NewProfile, InsertProfile } from "@/types/profile";
import { DirectoryTable } from "@/components/directory/DirectoryTable";
import { AddProfileDialog } from "@/components/directory/AddProfileDialog";
import { DirectoryControls } from "@/components/directory/DirectoryControls";

const Directory = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [newProfile, setNewProfile] = useState<NewProfile>({
    first_name: '',
    last_name: '',
    role: '',
    department: null,
    phone: null,
    is_manager: false
  });
  const { toast } = useToast();

  const { data: currentUser, isLoading: isLoadingCurrentUser } = useQuery({
    queryKey: ['currentProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ingen användare inloggad");

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data as Profile | null;
    }
  });

  const { data: profiles, isLoading: isLoadingProfiles, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name');
      
      if (error) throw error;
      return data as Profile[];
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!currentUser?.is_manager) {
        throw new Error("Endast chefer kan lägga till nya anställda");
      }

      if (!newProfile.first_name || !newProfile.last_name || !newProfile.role) {
        throw new Error("Förnamn, efternamn och yrkesroll är obligatoriska fält");
      }

      const id = crypto.randomUUID();

      const insertData: InsertProfile = {
        id,
        first_name: newProfile.first_name,
        last_name: newProfile.last_name,
        role: newProfile.role,
        department: newProfile.department,
        phone: newProfile.phone,
        is_manager: newProfile.is_manager
      };

      const { error } = await supabase
        .from('profiles')
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Profil skapad",
        description: "Den nya profilen har lagts till i katalogen."
      });

      setIsOpen(false);
      setNewProfile({
        first_name: '',
        last_name: '',
        role: '',
        department: null,
        phone: null,
        is_manager: false
      });
      refetch();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Ett fel uppstod",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const isLoading = isLoadingCurrentUser || isLoadingProfiles;

  return (
    <AppLayout>
      <div className="w-full px-6 py-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#333333] mb-1">Personal</h1>
            <p className="text-sm text-[#8A898C]">
              {profiles?.length || 0} personal totalt
            </p>
          </div>
          {currentUser?.is_manager && (
            <AddProfileDialog
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              newProfile={newProfile}
              setNewProfile={setNewProfile}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        <div className="bg-white rounded-lg border shadow-sm">
          <DirectoryControls />
          <DirectoryTable profiles={profiles} isLoading={isLoading} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Directory;
