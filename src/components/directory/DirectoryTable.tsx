
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Profile, DatabaseProfile, convertDatabaseProfile } from "@/types/profile";
import { Pencil } from "lucide-react";
import { AddProfileDialog } from "./AddProfileDialog";
import { useDirectory } from "@/contexts/DirectoryContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

function getInitials(profile: Profile) {
  return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`;
}

export function DirectoryTable() {
  const { roleFilter, searchQuery } = useDirectory();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState({
    id: '',
    first_name: '',
    last_name: '',
    role: '',
    department: '',
    phone: '',
    experience_level: 1
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw error;
      // Convert the raw database profiles to our internal Profile type
      return (data as DatabaseProfile[] || []).map(convertDatabaseProfile);
    }
  });

  const filteredProfiles = profiles.filter((profile) => {
    const searchRegex = new RegExp(searchQuery, "i");
    const matchesSearch =
      searchRegex.test(profile.first_name) ||
      searchRegex.test(profile.last_name) ||
      searchRegex.test(profile.role);

    const matchesRole =
      roleFilter === "all" || profile.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile({
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      department: profile.department || '',
      phone: profile.phone || '',
      experience_level: profile.experience_level
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editingProfile.first_name,
          last_name: editingProfile.last_name,
          role: editingProfile.role,
          department: editingProfile.department || null,
          phone: editingProfile.phone || null,
          experience_level: editingProfile.experience_level
        })
        .eq('id', editingProfile.id);
      
      if (error) throw error;
      
      toast({
        title: "Profil uppdaterad",
        description: "Ändringar har sparats framgångsrikt",
      });
      
      // Refresh the profiles data
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte uppdatera profilen",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Laddar personal...</div>;
  }

  return (
    <div className="w-full">
      <table className="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
              Personal
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
              Roll
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell dark:text-gray-100">
              Avdelning
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell dark:text-gray-100">
              Erfarenhet
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell dark:text-gray-100">
              Telefon
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-6">
              <span className="sr-only">Redigera</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:bg-gray-800 dark:divide-gray-700">
          {filteredProfiles.map((profile) => (
            <tr key={profile.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(profile)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {profile.first_name} {profile.last_name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                {profile.role}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell dark:text-gray-400">
                {profile.department}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell dark:text-gray-400">
                {profile.experience_level} år
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell dark:text-gray-400">
                {profile.phone}
              </td>
              <td className="py-4 pl-3 pr-6 text-right text-sm font-medium">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => handleEditProfile(profile)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <AddProfileDialog
                      isOpen={isEditDialogOpen}
                      setIsOpen={setIsEditDialogOpen}
                      newProfile={editingProfile}
                      setNewProfile={setEditingProfile}
                      onSubmit={handleSubmit}
                      isEditing={true}
                    />
                  </DialogContent>
                </Dialog>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
