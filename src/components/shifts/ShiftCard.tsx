
import { format } from "date-fns";
import { Profile } from "@/types/profile";
import { Shift } from "@/types/shift";

interface ShiftCardProps {
  shift: Shift & { profiles: Pick<Profile, 'first_name' | 'last_name'> };
  profile: Profile | undefined;
  roleColors: {
    bg: string;
    border: string;
    text: string;
  };
  onClick: (shift: Shift) => void;
}

export const ShiftCard = ({ shift, profile, roleColors, onClick }: ShiftCardProps) => {
  return (
    <div
      onClick={() => onClick(shift)}
      className={`
        rounded-md p-1 text-xs border cursor-pointer
        ${roleColors.bg}
        ${roleColors.border}
        hover:brightness-95 transition-all
      `}
    >
      <div className="font-medium">
        {format(new Date(shift.start_time), 'HH:mm')} - 
        {format(new Date(shift.end_time), 'HH:mm')}
      </div>
      <div className="truncate">
        {shift.profiles.first_name} {shift.profiles.last_name}
      </div>
      <div className="text-xs mt-1">
        Exp: {profile?.experience_level || 0}
      </div>
    </div>
  );
};
