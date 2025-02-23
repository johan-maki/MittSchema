
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Profile } from "@/types/profile";
import { Pencil } from "lucide-react";
import { AddProfileDialog } from "./AddProfileDialog";
import { useDirectory } from "@/contexts/DirectoryContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function getInitials(profile: Profile) {
  return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`;
}

export function DirectoryTable() {
  const { departmentFilter, searchQuery } = useDirectory();

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const filteredProfiles = profiles.filter((profile) => {
    const searchRegex = new RegExp(searchQuery, "i");
    const matchesSearch =
      searchRegex.test(profile.first_name) ||
      searchRegex.test(profile.last_name) ||
      searchRegex.test(profile.role);

    const matchesDepartment =
      departmentFilter === "all" || profile.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th scope="col" className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                Personal
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900">
                Roll
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">
                Avdelning
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">
                Erfarenhet
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">
                Telefon
              </th>
              <th scope="col" className="relative whitespace-nowrap py-3.5 pl-3 pr-4 sm:pr-0">
                <span className="sr-only">Redigera</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredProfiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm sm:pl-0">
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
                <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-900">
                  {profile.role}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 hidden sm:table-cell">
                  {profile.department}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 hidden sm:table-cell">
                  {profile.experience_level} år
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 hidden sm:table-cell">
                  {profile.phone}
                </td>
                <td className="relative whitespace-nowrap py-2 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <AddProfileDialog profile={profile} />
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
