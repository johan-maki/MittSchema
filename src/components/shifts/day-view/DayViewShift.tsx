
import { Shift } from "@/types/shift";
import { format, parseISO } from "date-fns";

interface DayViewShiftProps {
  shift: Shift & { profiles: { first_name: string; last_name: string } };
  onClick: () => void;
}

export const DayViewShift = ({ shift, onClick }: DayViewShiftProps) => {
  const { startPercent, widthPercent, bgColor } = useShiftStyle(shift);

  return (
    <div
      className={`absolute top-1 h-[calc(100%-8px)] rounded-md border ${bgColor} cursor-pointer hover:bg-opacity-80`}
      style={{
        left: `${startPercent}%`,
        width: `${widthPercent}%`,
      }}
      onClick={onClick}
    >
      <div className="p-3 text-sm">
        <div className="font-medium">
          {format(parseISO(shift.start_time), 'ha')} – 
          {format(parseISO(shift.end_time), 'ha')}
        </div>
        <div className="text-gray-700">
          {shift.profiles.first_name}
        </div>
      </div>
    </div>
  );
};

function useShiftStyle(shift: Shift) {
  const startTime = new Date(shift.start_time);
  const endTime = new Date(shift.end_time);
  const startHour = startTime.getHours() + startTime.getMinutes() / 60;
  const endHour = endTime.getHours() + endTime.getMinutes() / 60;
  
  const startPercent = (startHour / 24) * 100;
  const widthPercent = ((endHour - startHour) / 24) * 100;

  // Map the role to a specific background color
  const getBgColor = () => {
    const roleType = shift.shift_type;
    if (roleType === 'evening') return 'bg-green-50 border-green-200'; // Sjuksköterska - light green
    if (roleType === 'night') return 'bg-purple-50 border-purple-200'; // Undersköterska - light purple
    return 'bg-blue-50 border-blue-200'; // Läkare - light blue
  };
  
  return { 
    startPercent, 
    widthPercent,
    bgColor: getBgColor()
  };
}
