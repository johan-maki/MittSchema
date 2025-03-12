
import { Profile } from "@/types/profile";
import { ProfileTableRow } from "./ProfileTableRow";

interface ProfilesTableBodyProps {
  profiles: Profile[];
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
}

export function ProfilesTableBody({ profiles, onEdit, onDelete }: ProfilesTableBodyProps) {
  return (
    <tbody className="divide-y divide-gray-200 bg-white dark:bg-gray-800 dark:divide-gray-700">
      {profiles.length === 0 ? (
        <tr>
          <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
            Inga medarbetare hittades
          </td>
        </tr>
      ) : (
        profiles.map((profile) => (
          <ProfileTableRow 
            key={profile.id} 
            profile={profile} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))
      )}
    </tbody>
  );
}
