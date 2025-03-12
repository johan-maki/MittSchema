
import { Profile } from "@/types/profile";
import { ProfilesTableHeader } from "./ProfilesTableHeader";
import { ProfilesTableBody } from "./ProfilesTableBody";

interface ProfilesTableProps {
  profiles: Profile[];
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
}

export function ProfilesTable({ profiles, onEdit, onDelete }: ProfilesTableProps) {
  return (
    <table className="min-w-full divide-y divide-gray-300">
      <ProfilesTableHeader />
      <ProfilesTableBody 
        profiles={profiles} 
        onEdit={onEdit} 
        onDelete={onDelete} 
      />
    </table>
  );
}
