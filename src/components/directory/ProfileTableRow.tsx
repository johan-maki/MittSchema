
import { Profile } from "@/types/profile";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileActions } from "./ProfileActions";

interface ProfileTableRowProps {
  profile: Profile;
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
}

export function ProfileTableRow({ profile, onEdit, onDelete }: ProfileTableRowProps) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <ProfileAvatar profile={profile} />
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
        {profile.department || "-"}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell dark:text-gray-400">
        {profile.experience_level} år
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell dark:text-gray-400">
        {profile.phone || "-"}
      </td>
      <td className="py-4 pl-3 pr-6 text-right text-sm font-medium">
        <ProfileActions 
          profile={profile} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />
      </td>
    </tr>
  );
}
