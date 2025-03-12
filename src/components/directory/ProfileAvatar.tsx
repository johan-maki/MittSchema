
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Profile } from "@/types/profile";

interface ProfileAvatarProps {
  profile: Profile;
}

export function ProfileAvatar({ profile }: ProfileAvatarProps) {
  const getInitials = (profile: Profile) => {
    return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`;
  };

  return (
    <Avatar className="h-8 w-8">
      <AvatarFallback>{getInitials(profile)}</AvatarFallback>
    </Avatar>
  );
}
