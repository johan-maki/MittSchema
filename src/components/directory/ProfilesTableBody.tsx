
import { Profile } from "@/types/profile";
import { ProfileTableRow } from "./ProfileTableRow";

interface ProfilesTableBodyProps {
  profiles: Profile[];
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
}

export function ProfilesTableBody({ profiles, onEdit, onDelete }: ProfilesTableBodyProps) {
  return (
    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
      {profiles.length === 0 ? (
        <tr>
          <td colSpan={6} className="px-6 py-12 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm font-medium">Inga medarbetare hittades</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Lägg till din första medarbetare för att komma igång</p>
            </div>
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
