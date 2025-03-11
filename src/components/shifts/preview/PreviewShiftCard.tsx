
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { getShiftTypeInSwedish } from "./previewUtils";
import { Clock, User, Briefcase, Sun, Moon } from "lucide-react";
import type { Shift } from "@/types/shift";
import type { Profile } from "@/types/profile";

interface PreviewShiftCardProps {
  shift: Shift;
  profiles: Profile[];
}

export const PreviewShiftCard = ({ shift, profiles }: PreviewShiftCardProps) => {
  const employee = profiles.find(p => p.id === shift.employee_id);
  
  // Function to determine card styling and icon based on shift type
  const getShiftTypeInfo = (shiftType: string) => {
    switch (shiftType) {
      case 'day':
        return {
          containerClass: 'border-blue-300 bg-blue-50',
          icon: <Sun className="h-3.5 w-3.5 text-blue-600" />,
          textClass: 'text-blue-700'
        };
      case 'evening':
        return {
          containerClass: 'border-purple-300 bg-purple-50',
          icon: <Clock className="h-3.5 w-3.5 text-purple-600" />,
          textClass: 'text-purple-700'
        };
      case 'night':
        return {
          containerClass: 'border-orange-300 bg-orange-50',
          icon: <Moon className="h-3.5 w-3.5 text-orange-600" />,
          textClass: 'text-orange-700'
        };
      default:
        return {
          containerClass: 'border-gray-300 bg-gray-50',
          icon: <Clock className="h-3.5 w-3.5 text-gray-500" />,
          textClass: 'text-gray-700'
        };
    }
  };
  
  const shiftTypeInfo = getShiftTypeInfo(shift.shift_type);
  
  return (
    <Card className={`p-3 flex justify-between items-center border-l-4 shadow-sm hover:shadow-md transition-shadow ${shiftTypeInfo.containerClass}`}>
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium flex items-center gap-1 text-gray-800">
          <Clock className="h-3.5 w-3.5 text-gray-500" />
          {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
        </div>
        <div className={`text-sm flex items-center gap-1 ${shiftTypeInfo.textClass}`}>
          {shiftTypeInfo.icon}
          {getShiftTypeInSwedish(shift.shift_type)}
        </div>
      </div>
      <div className="text-right">
        <div className="text-base font-medium flex items-center justify-end gap-1">
          <User className="h-3.5 w-3.5 text-gray-500" />
          {employee ? `${employee.first_name} ${employee.last_name}` : "Okänd anställd"}
        </div>
        <div className="text-sm text-gray-600">
          {employee?.role || "Ingen roll"}
        </div>
      </div>
    </Card>
  );
};
