
import { Profile } from "@/types/profile";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileActions } from "./ProfileActions";

interface ProfileTableRowProps {
  profile: Profile;
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
  onViewPreferences: (profile: Profile) => void;
}

export function ProfileTableRow({ profile, onEdit, onDelete, onViewPreferences }: ProfileTableRowProps) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="px-6 py-5">
        <div className="flex items-center gap-4">
          <ProfileAvatar profile={profile} />
          <div>
            <button
              onClick={() => onViewPreferences(profile)}
              className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
            >
              {profile.first_name} {profile.last_name}
            </button>
            <div className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">
              {profile.role}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-5 text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:table-cell">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {profile.role}
        </span>
      </td>
      <td className="px-6 py-5 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
        {profile.department || (
          <span className="text-gray-400 dark:text-gray-500">—</span>
        )}
      </td>
      <td className="px-6 py-5 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
        <span className="inline-flex items-center gap-1">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {profile.experience_level} år
        </span>
      </td>
      <td className="px-6 py-5 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
        {profile.phone ? (
          <a href={`tel:${profile.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {profile.phone}
          </a>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">—</span>
        )}
      </td>
      <td className="px-6 py-5 text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
        <span className="inline-flex items-center gap-1">
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          {profile.hourly_rate ? `${profile.hourly_rate} SEK` : '1000 SEK'}
        </span>
      </td>
      <td className="py-5 pl-3 pr-6 text-right text-sm font-medium">
        <ProfileActions 
          profile={profile} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />
      </td>
    </tr>
  );
}
