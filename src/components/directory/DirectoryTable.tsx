
import { Profile } from "@/types/profile";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface DirectoryTableProps {
  profiles: Profile[] | undefined;
  isLoading: boolean;
}

export const DirectoryTable = ({ profiles, isLoading }: DirectoryTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-[#8B5CF6] border-r-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-[#F8F9FB]">
            <th className="text-left p-4 text-sm font-medium text-[#333333]">Namn</th>
            <th className="text-left p-4 text-sm font-medium text-[#333333]">Roll</th>
            <th className="text-left p-4 text-sm font-medium text-[#333333]">Avdelning</th>
            <th className="text-left p-4 text-sm font-medium text-[#333333]">Telefon</th>
            <th className="text-left p-4 text-sm font-medium text-[#333333]">Erfarenhet</th>
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
                <span className="px-2 py-1 bg-[#F1F1F1] text-[#333333] text-xs rounded-full">
                  Nivå {profile.experience_level}
                </span>
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
  );
};
