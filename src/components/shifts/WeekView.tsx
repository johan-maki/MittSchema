
import { Shift } from "@/types/shift";
import { motion } from "framer-motion";
import { format, differenceInHours, isSameDay, endOfDay, startOfDay, isWithinInterval } from "date-fns";
import { getWeekDays } from "@/utils/date";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const renderShiftSegment = (shift: Shift, dayDate: Date) => {
    const startTime = new Date(shift.start_time);
    const endTime = new Date(shift.end_time);
    
    // Calculate segment start and end times for this day
    const segmentStart = isSameDay(startTime, dayDate) ? startTime : startOfDay(dayDate);
    const segmentEnd = isSameDay(endTime, dayDate) ? endTime : endOfDay(dayDate);
    
    // Calculate position and height
    const startHour = segmentStart.getHours() + segmentStart.getMinutes() / 60;
    const duration = differenceInHours(segmentEnd, segmentStart);
    
    // Get employee name from the joined profiles data
    const employeeName = shift.profiles ? 
      `${shift.profiles.first_name} ${shift.profiles.last_name}` : 
      'Unnamed';

    return (
      <motion.div
        key={`${shift.id}-${dayDate.toISOString()}`}
        className="absolute left-0 right-0 px-1"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          top: `${startHour * 24}px`,
          height: `${duration * 24}px`,
        }}
      >
        <Dialog open={isEditDialogOpen && selectedShift?.id === shift.id} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setSelectedShift(null);
        }}>
          <DialogTrigger asChild>
            <div 
              className="h-full w-full rounded-md bg-blue-100 border border-blue-200 p-1 text-[10px] overflow-hidden cursor-pointer hover:bg-blue-200 transition-colors"
              onClick={() => setSelectedShift(shift)}
            >
              <div className="font-medium text-blue-900">
                {format(segmentStart, 'HH:mm')} - {format(segmentEnd, 'HH:mm')}
              </div>
              <div className="text-blue-700 font-medium truncate">
                {employeeName}
              </div>
              {shift.notes && (
                <div className="text-blue-700 truncate">{shift.notes}</div>
              )}
            </div>
          </DialogTrigger>
          <DialogContent>
            <ShiftForm
              isOpen={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              defaultValues={{
                start_time: shift.start_time.slice(0, 16),
                end_time: shift.end_time.slice(0, 16),
                department: shift.department,
                notes: shift.notes || "",
                employee_id: shift.employee_id,
                shift_type: shift.shift_type
              }}
              editMode
              shiftId={shift.id}
            />
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  };

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
                <div key={hour} className="h-6 relative" />
              ))}
              {shifts.filter(shift => {
                const shiftStart = new Date(shift.start_time);
                const shiftEnd = new Date(shift.end_time);
                return isWithinInterval(dayDate, { start: startOfDay(shiftStart), end: endOfDay(shiftEnd) });
              }).map(shift => renderShiftSegment(shift, dayDate))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
