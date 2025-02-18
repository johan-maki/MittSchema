
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

const Directory = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [newProfile, setNewProfile] = useState({
    first_name: '',
    last_name: '',
    role: '',
    department: '',
    phone: ''
  });
  const { toast } = useToast();

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([newProfile]);

      if (error) throw error;

      toast({
        title: "Kollega tillagd",
        description: "Den nya kollegan har lagts till i katalogen.",
      });

      setIsOpen(false);
      setNewProfile({
        first_name: '',
        last_name: '',
        role: '',
        department: '',
        phone: ''
      });
      refetch();
    } catch (error: any) {
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
        <header className="mb-8 bg-gradient-to-r from-[#F2FCE2] to-[#E5DEFF] p-8 rounded-2xl" 
                style={{
                  backgroundImage: "url('/photo-1605810230434-7631ac76ec81')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}>
          <div className="bg-white/90 p-6 rounded-xl backdrop-blur-sm">
            <h1 className="text-3xl font-bold text-[#1A1F2C] mb-2">Personalkatalog</h1>
            <p className="text-[#6E59A5]">Hitta kontaktuppgifter till dina kollegor</p>
          </div>
        </header>

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
                    <h3 className="text-lg font-semibold text-[#1A1F2C]">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <p className="text-sm text-[#7E69AB] font-medium">{profile.role}</p>
                    
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
