import React, { useMemo } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Shift {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  shift_type: 'day' | 'evening' | 'night';
  start_time: string;
  end_time: string;
}

interface GanttScheduleViewProps {
  shifts: Shift[];
  startDate: Date;
  endDate: Date;
}

const shiftColors = {
  day: '#22c55e',      // Green
  evening: '#f59e0b',  // Orange
  night: '#3b82f6',    // Blue
};

export function GanttScheduleView({ shifts, startDate, endDate }: GanttScheduleViewProps) {
  const tasks: Task[] = useMemo(() => {
    return shifts.map((shift, index) => {
      const shiftDate = new Date(shift.date);
      
      // Parse start and end times
      const [startHour, startMinute] = shift.start_time.split(':').map(Number);
      const [endHour, endMinute] = shift.end_time.split(':').map(Number);
      
      const start = new Date(shiftDate);
      start.setHours(startHour, startMinute, 0, 0);
      
      const end = new Date(shiftDate);
      end.setHours(endHour, endMinute, 0, 0);
      
      // If end time is before start time, it means shift goes into next day
      if (endHour < startHour) {
        end.setDate(end.getDate() + 1);
      }
      
      return {
        id: shift.id || `shift-${index}`,
        name: shift.employee_name,
        start: start,
        end: end,
        type: 'task' as const,
        progress: 100,
        styles: {
          backgroundColor: shiftColors[shift.shift_type],
          backgroundSelectedColor: shiftColors[shift.shift_type],
          progressColor: shiftColors[shift.shift_type],
          progressSelectedColor: shiftColors[shift.shift_type],
        },
        project: shift.employee_id,
      };
    });
  }, [shifts]);

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gantt-schema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Inget schema att visa. Generera ett schema först.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>Gantt-schema</CardTitle>
        <div className="flex gap-4 text-sm mt-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: shiftColors.day }}></div>
            <span>Dag (06-14)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: shiftColors.evening }}></div>
            <span>Kväll (14-22)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: shiftColors.night }}></div>
            <span>Natt (22-06)</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Gantt
          tasks={tasks}
          viewMode={ViewMode.Day}
          columnWidth={60}
          listCellWidth="150px"
          rowHeight={40}
          barCornerRadius={4}
          locale="sv"
          todayColor="rgba(252, 211, 77, 0.3)"
        />
      </CardContent>
    </Card>
  );
}
