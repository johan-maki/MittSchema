
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { getShiftTypeInSwedish } from "./previewUtils";
import type { Shift } from "@/types/shift";
import type { Profile } from "@/types/profile";

interface PreviewShiftCardProps {
  shift: Shift;
  profiles: Profile[];
}

export const PreviewShiftCard = ({ shift, profiles }: PreviewShiftCardProps) => {
  const employee = profiles.find(p => p.id === shift.employee_id);
  
  return (
    <Card className="p-3 flex justify-between items-center">
      <div>
        <div className="text-sm text-gray-600">
          {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
        </div>
        <div className="text-sm text-gray-600">
          {getShiftTypeInSwedish(shift.shift_type)}
        </div>
      </div>
      <div className="text-right">
        <div className="text-base font-medium">
          {employee ? `${employee.first_name} ${employee.last_name}` : "Okänd anställd"}
        </div>
        <div className="text-sm text-gray-600">
          {employee?.role || "Ingen roll"}
        </div>
      </div>
    </Card>
  );
};
