import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Phone, Mail, Building2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Profile } from "@/types/profile";

const Directory = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [newProfile, setNewProfile] = useState<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>({
    first_name: '',
    last_name: '',
    role: '',
    department: '',
    phone: '',
    is_manager: false
  });
  const { toast } = useToast();

  const { data: currentUser } = useQuery({
    queryKey: ['currentProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ingen användare inloggad");

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    }
  });

  const { data: profiles, isLoading, refetch } = useQuery({
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ingen användare inloggad");

      if (!currentUser?.is_manager) {
        throw new Error("Endast chefer kan lägga till nya anställda");
      }

      if (!newProfile.first_name || !newProfile.last_name || !newProfile.role) {
        throw new Error("Förnamn, efternamn och yrkesroll är obligatoriska fält");
      }

      const { error } = await supabase
        .from('profiles')
        .insert({
          first_name: newProfile.first_name,
          last_name: newProfile.last_name,
          role: newProfile.role,
          department: newProfile.department || null,
          phone: newProfile.phone || null,
          is_manager: false
        });

      if (error) throw error;

      toast({
        title: "Profil skapad",
        description: "Den nya profilen har lagts till i katalogen.",
      });

      setIsOpen(false);
      setNewProfile({
        first_name: '',
        last_name: '',
        role: '',
        department: '',
        phone: '',
        is_manager: false
      });
      refetch();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Ett fel uppstod",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 bg-gradient-to-r from-[#F2FCE2] to-[#E5DEFF] p-8 rounded-2xl">
          <div className="bg-white/90 p-6 rounded-xl backdrop-blur-sm">
            <h1 className="text-3xl font-bold text-[#1A1F2C] mb-2">Personalkatalog</h1>
            <p className="text-[#6E59A5]">Hitta kontaktuppgifter till dina kollegor</p>
          </div>
        </header>

        {currentUser?.is_manager && (
          <div className="mb-6">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#9b87f5] hover:bg-[#7E69AB]">
                  <Plus className="w-4 h-4 mr-2" />
                  Lägg till kollega
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Lägg till ny kollega</DialogTitle>
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
                      value={newProfile.department}
                      onChange={e => setNewProfile(prev => ({ ...prev, department: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1A1F2C]">Telefonnummer</label>
                    <Input
                      value={newProfile.phone}
                      onChange={e => setNewProfile(prev => ({ ...prev, phone: e.target.value }))}
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
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-[#9b87f5] border-r-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles?.map((profile) => (
              <Card key={profile.id} className="p-6 hover:shadow-lg transition-all duration-200 bg-white border-[#D6BCFA]">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <div className="bg-[#F2FCE2] h-full w-full flex items-center justify-center text-[#7E69AB] font-semibold text-lg">
                      {profile.first_name[0]}
                      {profile.last_name[0]}
                    </div>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#1A1F2C]">
                          {profile.first_name} {profile.last_name}
                        </h3>
                        <p className="text-sm text-[#7E69AB] font-medium">{profile.role}</p>
                      </div>
                      {profile.is_manager && (
                        <span className="px-2 py-1 bg-[#F2FCE2] text-[#4B5563] text-xs rounded-full">
                          Chef
                        </span>
                      )}
                    </div>
                    
                    {profile.department && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-[#6E59A5]">
                        <Building2 className="h-4 w-4 text-[#9b87f5]" />
                        <span>{profile.department}</span>
                      </div>
                    )}
                    
                    {profile.phone && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-[#6E59A5]">
                        <Phone className="h-4 w-4 text-[#9b87f5]" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Directory;
