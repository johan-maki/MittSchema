
import { format, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { sv } from "date-fns/locale";
import { Shift } from "@/types/shift";

interface WeeklyScheduleProps {
  date?: Date;
  shifts: Shift[];
  isLoading: boolean;
}

export const WeeklySchedule = ({ date, shifts, isLoading }: WeeklyScheduleProps) => {
  if (!date) return null;

  const weekStart = startOfWeek(date, { locale: sv });
  const weekEnd = endOfWeek(date, { locale: sv });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getDayShifts = (day: Date) => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return (
        shiftDate.getDate() === day.getDate() &&
        shiftDate.getMonth() === day.getMonth() &&
        shiftDate.getFullYear() === day.getFullYear()
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-[#9b87f5] border-r-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#1A1F2C] mb-4">
        Veckoschema {format(weekStart, 'w', { locale: sv })}
      </h2>
      <div className="space-y-4">
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="border rounded-lg p-4">
            <h3 className="font-medium text-[#1A1F2C] capitalize mb-2">
              {format(day, 'EEEE d MMMM', { locale: sv })}
            </h3>
            <div className="space-y-2">
              {getDayShifts(day).map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                >
                  <div>
                    <p className="font-medium text-[#1A1F2C]">
                      {(shift as any).profiles?.first_name} {(shift as any).profiles?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(shift.start_time), 'HH:mm')} - 
                      {format(new Date(shift.end_time), 'HH:mm')}
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs capitalize"
                    style={{
                      backgroundColor: 
                        shift.shift_type === 'day' ? '#E5F6FD' :
                        shift.shift_type === 'evening' ? '#FFF4E5' : '#FCE7F3',
                      color:
                        shift.shift_type === 'day' ? '#0EA5E9' :
                        shift.shift_type === 'evening' ? '#F59E0B' : '#EC4899'
                    }}
                  >
                    {shift.shift_type}
                  </span>
                </div>
              ))}
              {getDayShifts(day).length === 0 && (
                <p className="text-gray-500 text-sm italic">Inga schemalagda pass</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
