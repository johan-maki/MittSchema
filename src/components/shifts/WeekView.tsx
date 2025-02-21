
import { Shift } from "@/types/shift";
import { motion } from "framer-motion";
import { format, differenceInHours, isSameDay, addHours } from "date-fns";
import { getWeekDays } from "@/utils/date";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { ShiftForm } from "./ShiftForm";

interface WeekViewProps {
  date: Date;
  shifts: Shift[];
  onDeleteShift?: (shiftId: string) => void;
}

export const WeekView = ({ date, shifts, onDeleteShift }: WeekViewProps) => {
  const weekDays = getWeekDays(date);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [selectedCell, setSelectedCell] = useState<{ date: Date; hour: number } | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const handleCellClick = (date: Date, hour: number) => {
    const clickedDate = new Date(date);
    clickedDate.setHours(hour, 0, 0, 0);
    setSelectedCell({ date: clickedDate, hour });
  };

  const handleShiftClick = (e: React.MouseEvent, shift: Shift) => {
    e.stopPropagation(); // Prevent cell click
    setSelectedShift(shift);
  };

  return (
    <>
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
                <div key={hour} className="h-6 flex items-start p-1">
                  <div className="text-[10px] text-gray-600">
                    {format(new Date().setHours(hour, 0), 'HH:00')}
                  </div>
                </div>
              ))}
            </div>
            {weekDays.map(({ date: dayDate }) => (
              <div key={dayDate.toISOString()} className="relative divide-y border-l">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-6 relative hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleCellClick(dayDate, hour)}
                  />
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
                          top: `${startHour * 24}px`,
                          height: `${duration * 24}px`,
                        }}
                        onClick={(e) => handleShiftClick(e, shift)}
                      >
                        <div
                          className={`
                            h-full w-full rounded-md bg-blue-100 border border-blue-200 
                            p-1 text-[10px] overflow-hidden hover:bg-blue-200 
                            transition-colors cursor-pointer
                          `}
                        >
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

      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <ShiftForm
            isOpen={!!selectedCell}
            onOpenChange={() => setSelectedCell(null)}
            defaultValues={{
              start_time: selectedCell ? selectedCell.date.toISOString() : "",
              end_time: selectedCell ? addHours(selectedCell.date, 8).toISOString() : "",
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedShift} onOpenChange={() => setSelectedShift(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <ShiftForm
            isOpen={!!selectedShift}
            onOpenChange={() => setSelectedShift(null)}
            defaultValues={selectedShift || undefined}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

