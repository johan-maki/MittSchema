
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Profile, DatabaseProfile, convertDatabaseProfile } from "@/types/profile";
import { Pencil } from "lucide-react";
import { AddProfileDialog } from "./AddProfileDialog";
import { useDirectory } from "@/contexts/DirectoryContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

function getInitials(profile: Profile) {
  return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`;
}

export function DirectoryTable() {
  const { roleFilter, searchQuery } = useDirectory();
  const [editingProfile, setEditingProfile] = useState({
    first_name: '',
    last_name: '',
    role: '',
    department: '',
    phone: '',
    experience_level: 1
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw error;
      return (data || []).map(convertDatabaseProfile);
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
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      department: profile.department || '',
      phone: profile.phone || '',
      experience_level: profile.experience_level
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Handle submit logic here
    setIsEditDialogOpen(false);
  };

  return (
    <div className="w-full">
      <table className="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
              Personal
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
              Roll
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">
              Avdelning
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">
              Erfarenhet
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">
              Telefon
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-6">
              <span className="sr-only">Redigera</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {filteredProfiles.map((profile) => (
            <tr key={profile.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(profile)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-900">
                      {profile.first_name} {profile.last_name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {profile.role}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                {profile.department}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                {profile.experience_level} år
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
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
