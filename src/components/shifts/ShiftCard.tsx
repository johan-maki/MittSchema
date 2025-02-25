
import { Shift } from "@/types/shift";
import { Profile } from "@/types/profile";
import { format, parseISO } from "date-fns";

interface ShiftCardProps {
  shift: Shift;
  profile?: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'>;
  roleColors: {
    bg: string;
    border: string;
    text: string;
  };
  onClick: (shift: Shift) => void;
}

export const ShiftCard = ({ shift, profile, roleColors, onClick }: ShiftCardProps) => {
  if (!profile) return null;

  return (
    <div
      className={`p-2 rounded-md border cursor-pointer hover:brightness-95 ${roleColors.bg} ${roleColors.border}`}
      onClick={() => onClick(shift)}
    >
      <div className="text-xs">
        <div className="font-medium">
          {format(parseISO(shift.start_time), 'HH:mm')} - 
          {format(parseISO(shift.end_time), 'HH:mm')}
        </div>
        <div className="truncate">
          {profile.first_name} {profile.last_name}
        </div>
      </div>
    </div>
  );
};
