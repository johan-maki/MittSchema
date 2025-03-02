
import { formatDateSwedish } from "./previewUtils";
import { PreviewShiftCard } from "./PreviewShiftCard";
import { StaffingIssuesDisplay } from "./StaffingIssuesDisplay";
import type { Shift } from "@/types/shift";
import type { Profile } from "@/types/profile";

type StaffingIssue = {
  date: string;
  shiftType: string;
  current: number;
  required: number;
};

interface DateShiftGroupProps {
  date: string;
  shifts: Shift[];
  profiles: Profile[];
  staffingIssues: StaffingIssue[];
}

export const DateShiftGroup = ({ date, shifts, profiles, staffingIssues }: DateShiftGroupProps) => {
  // Find staffing issues for this date
  const dateIssues = staffingIssues.filter(issue => issue.date === date);
  const formattedDate = formatDateSwedish(date);
  
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-md border-b pb-1">
        {formattedDate}
      </h3>
      
      <StaffingIssuesDisplay dateIssues={dateIssues} />
      
      <div className="grid gap-2">
        {shifts.map((shift) => (
          <PreviewShiftCard 
            key={`${shift.employee_id}-${shift.start_time}`} 
            shift={shift} 
            profiles={profiles} 
          />
        ))}
      </div>
    </div>
  );
};
