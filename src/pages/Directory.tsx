
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Phone, Building2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Profile, NewProfile, InsertProfile } from "@/types/profile";

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

      // Generate a new UUID for the profile
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
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED]">
                  <Plus className="w-4 h-4 mr-2" />
                  Lägg till personal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Lägg till ny personal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#1A1F2C]">Förnamn</label>
                    <Input
                      required
                      value={newProfile.first_name}
                      onChange={e => setNewProfile(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1A1F2C]">Efternamn</label>
                    <Input
                      required
                      value={newProfile.last_name}
                      onChange={e => setNewProfile(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1A1F2C]">Yrkesroll</label>
                    <Input
                      required
                      value={newProfile.role}
                      onChange={e => setNewProfile(prev => ({ ...prev, role: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1A1F2C]">Avdelning</label>
                    <Input
                      value={newProfile.department || ''}
                      onChange={e => setNewProfile(prev => ({ ...prev, department: e.target.value || null }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1A1F2C]">Telefonnummer</label>
                    <Input
                      value={newProfile.phone || ''}
                      onChange={e => setNewProfile(prev => ({ ...prev, phone: e.target.value || null }))}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Avbryt
                    </Button>
                    <Button type="submit" className="bg-[#9b87f5] hover:bg-[#7E69AB]">
                      Lägg till
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <Input
                className="max-w-xs"
                placeholder="Sök personal..."
                type="search"
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  Visa
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin h-8 w-8 border-4 border-[#8B5CF6] border-r-transparent rounded-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-[#F8F9FB]">
                    <th className="text-left p-4 text-sm font-medium text-[#333333]">Namn</th>
                    <th className="text-left p-4 text-sm font-medium text-[#333333]">Roll</th>
                    <th className="text-left p-4 text-sm font-medium text-[#333333]">Avdelning</th>
                    <th className="text-left p-4 text-sm font-medium text-[#333333]">Telefon</th>
                    <th className="text-left p-4 text-sm font-medium text-[#333333]">Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {profiles?.map((profile) => (
                    <tr key={profile.id} className="border-b last:border-b-0 hover:bg-[#F8F9FB]">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <div className="bg-[#F1F1F1] h-full w-full flex items-center justify-center text-[#333333] font-medium text-sm">
                              {profile.first_name[0]}
                              {profile.last_name[0]}
                            </div>
                          </Avatar>
                          <div>
                            <div className="font-medium text-[#333333]">
                              {profile.first_name} {profile.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-[#8A898C]">{profile.role}</td>
                      <td className="p-4 text-sm text-[#8A898C]">{profile.department || '-'}</td>
                      <td className="p-4 text-sm text-[#8A898C]">{profile.phone || '-'}</td>
                      <td className="p-4">
                        {profile.is_manager && (
                          <span className="px-2 py-1 bg-[#F1F1F1] text-[#333333] text-xs rounded-full">
                            Chef
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm">
                          •••
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Directory;
