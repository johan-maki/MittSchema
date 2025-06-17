
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Profile } from "@/types/profile";

interface ProfileAvatarProps {
  profile: Profile;
}

export function ProfileAvatar({ profile }: ProfileAvatarProps) {
  const getInitials = (profile: Profile) => {
    return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`;
  };

  const getAvatarColor = (profile: Profile) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-red-500'
    ];
    const index = (profile.first_name.charCodeAt(0) + profile.last_name.charCodeAt(0)) % colors.length;
    return colors[index];
  };

  return (
    <Avatar className={`h-10 w-10 ${getAvatarColor(profile)} text-white`}>
      <AvatarFallback className={`${getAvatarColor(profile)} text-white font-semibold`}>
        {getInitials(profile)}
      </AvatarFallback>
    </Avatar>
  );
}
