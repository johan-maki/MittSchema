
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
      className="p-3 rounded-md border border-gray-200 bg-gray-100 cursor-pointer hover:bg-gray-200"
      onClick={() => onClick(shift)}
    >
      <div className="text-sm">
        <div className="font-medium">
          {format(parseISO(shift.start_time), 'ha')} – 
          {format(parseISO(shift.end_time), 'ha')}
        </div>
        <div className="text-gray-700">
          {profile.first_name}
        </div>
      </div>
    </div>
  );
};
