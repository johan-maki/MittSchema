
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
    <div className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 rounded-xl">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <ProfilesTableHeader />
        <ProfilesTableBody 
          profiles={profiles} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />
      </table>
    </div>
  );
}
