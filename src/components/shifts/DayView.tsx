
import { Shift } from "@/types/shift";
import { format, isSameDay } from "date-fns";
import { ChevronDown } from "lucide-react";

interface DayViewProps {
  date: Date;
  shifts: Shift[];
}

type Role = {
  name: string;
  color: string;
  bgColor: string;
  department: string;
};

const ROLES: Role[] = [
  { 
    name: "Time off", 
    color: "#6B7280", 
    bgColor: "#F3F4F6",
    department: "Time off" 
  },
  { 
    name: "Manager", 
    color: "#DC2626", 
    bgColor: "#FEE2E2",
    department: "Vården" 
  },
  { 
    name: "Admin", 
    color: "#7C3AED", 
    bgColor: "#EDE9FE",
    department: "Vården" 
  },
  { 
    name: "Security", 
    color: "#EA580C", 
    bgColor: "#FFEDD5",
    department: "Vården" 
  },
  { 
    name: "Staff", 
    color: "#2563EB", 
    bgColor: "#EFF6FF",
    department: "Vården" 
  }
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DayView = ({ date, shifts }: DayViewProps) => {
  const todaysShifts = shifts.filter(shift => isSameDay(new Date(shift.start_time), date));

  const renderShiftForRole = (role: Role) => {
    const roleShifts = todaysShifts.filter(shift => 
      shift.department === role.department
    );

    return (
      <div key={role.name} className="relative border-b border-gray-200">
        {/* Role header */}
        <div className="flex items-center h-12 px-4 bg-white">
          <ChevronDown className="w-4 h-4 mr-2 text-gray-400" />
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: role.color }}
            />
            <span className="font-medium">{role.name}</span>
            {role.name !== "Time off" && (
              <span className="text-gray-500">{role.department}</span>
            )}
          </div>
        </div>

        {/* Time grid */}
        <div className="relative h-24 bg-gray-50">
          {roleShifts.map((shift) => {
            const start = new Date(shift.start_time);
            const end = new Date(shift.end_time);
            const startPercent = (start.getHours() + start.getMinutes() / 60) * (100 / 24);
            const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            const widthPercent = (duration / 24) * 100;

            return (
              <div
                key={shift.id}
                className="absolute top-2 h-20 rounded-lg border text-sm"
                style={{
                  left: `${startPercent}%`,
                  width: `${widthPercent}%`,
                  backgroundColor: role.bgColor,
                  borderColor: role.color,
                }}
              >
                <div className="p-2">
                  <div className="font-medium">
                    {format(start, 'H:mm')} – {format(end, 'H:mm')}
                    {shift.notes && ` ${shift.notes}`}
                  </div>
                  {shift.profiles && (
                    <div className="text-gray-600">
                      {shift.profiles.first_name} {shift.profiles.last_name}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Time header */}
      <div className="flex border-b border-gray-200 px-4 py-2">
        {HOURS.map((hour) => (
          <div 
            key={hour} 
            className="flex-1 text-center text-sm text-gray-500"
          >
            {hour}:00
          </div>
        ))}
      </div>

      {/* Role rows */}
      <div className="divide-y divide-gray-200">
        {ROLES.map(role => renderShiftForRole(role))}
      </div>
    </div>
  );
};

export default DayView;
