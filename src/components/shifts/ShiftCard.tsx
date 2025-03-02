
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

  // Map the role to a specific background color
  const getBgColor = () => {
    const roleType = shift.shift_type;
    if (roleType === 'evening') return 'bg-green-50 border-green-200'; // Sjuksköterska - light green
    if (roleType === 'night') return 'bg-purple-50 border-purple-200'; // Undersköterska - light purple
    return 'bg-blue-50 border-blue-200'; // Läkare - light blue
  };

  return (
    <div
      className={`p-3 rounded-md border ${getBgColor()} cursor-pointer hover:bg-opacity-80`}
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
