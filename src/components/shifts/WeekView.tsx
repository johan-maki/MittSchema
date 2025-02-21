
import { Shift } from "@/types/shift";
import { motion } from "framer-motion";
import { format, differenceInHours, isSameDay } from "date-fns";
import { getWeekDays } from "@/utils/date";

interface WeekViewProps {
  date: Date;
  shifts: Shift[];
  onDeleteShift?: (shiftId: string) => void;
}

export const WeekView = ({ date, shifts, onDeleteShift }: WeekViewProps) => {
  const weekDays = getWeekDays(date);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[60px,repeat(7,1fr)] gap-px bg-gray-200">
          <div className="bg-white" />
          {weekDays.map(({ dayName, dayNumber }) => (
            <div
              key={dayName}
              className="p-2 text-center bg-white"
            >
              <div className="text-xs sm:text-sm font-medium text-gray-600">
                {dayName}
              </div>
              <div className="text-sm sm:text-lg">{dayNumber}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[60px,repeat(7,1fr)]">
          <div className="divide-y">
            {hours.map((hour) => (
              <div key={hour} className="h-16 sm:h-24 flex items-start p-2 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-600">
                  {format(new Date().setHours(hour, 0), 'HH:00')}
                </div>
              </div>
            ))}
          </div>
          {weekDays.map(({ date: dayDate }) => (
            <div key={dayDate.toISOString()} className="relative divide-y border-l">
              {hours.map((hour) => (
                <div key={hour} className="h-16 sm:h-24 relative" />
              ))}
              {shifts
                .filter((shift) => isSameDay(new Date(shift.start_time), dayDate))
                .map((shift) => {
                  const startTime = new Date(shift.start_time);
                  const endTime = new Date(shift.end_time);
                  const startHour = startTime.getHours() + startTime.getMinutes() / 60;
                  const duration = differenceInHours(endTime, startTime);
                  
                  return (
                    <motion.div
                      key={shift.id}
                      className="absolute left-0 right-0 px-1"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        top: `${startHour * 64}px`,
                        height: `${duration * 64}px`,
                      }}
                    >
                      <div className="h-full w-full rounded-md bg-blue-100 border border-blue-200 p-1 text-xs overflow-hidden">
                        <div className="font-medium text-blue-900">
                          {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                        </div>
                        {shift.notes && (
                          <div className="text-blue-700 truncate">{shift.notes}</div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
