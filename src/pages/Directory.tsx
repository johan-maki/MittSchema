
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Phone, Mail, Building2 } from "lucide-react";

const Directory = () => {
  const { data: profiles, isLoading } = useQuery({
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
