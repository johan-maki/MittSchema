import { useState, useEffect } from 'react';
import { AppLayout } from "@/components/AppLayout";
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { generateDaysInMonth } from "@/utils/calendarUtils";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const MonthView = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [days, setDays] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const daysInMonth = generateDaysInMonth(date.getFullYear(), date.getMonth());
    setDays(daysInMonth);
  }, [date]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const startDate = format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd');
        const endDate = format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd');

        const { data: shiftData, error: shiftError } = await supabase
          .from('shifts')
          .select('*')
          .gte('start_time', startDate)
          .lte('start_time', endDate);

        if (shiftError) {
          console.error("Error fetching shifts:", shiftError);
        }

        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id, first_name, last_name, role')
          .order('first_name');

        if (employeeError) {
          console.error("Error fetching employees:", employeeError);
        }

        setShifts(shiftData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date]);

  const getShiftsForDay = (day: Date) => {
    const formattedDay = format(day, 'yyyy-MM-dd');
    return shifts.filter(shift => shift.start_time.startsWith(formattedDay));
  };

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-sage-50 to-lavender-50">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Månadsvy</h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "MMMM yyyy") : "Välj månad"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  defaultMonth={date}
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => (
                <div key={day.date} className="p-2 border rounded">
                  <div className="text-sm font-semibold">{format(day.date, 'd')}</div>
                  {getShiftsForDay(day.date).map((shift) => (
                    <Badge key={shift.id} className="mt-1">{shift.shift_type}</Badge>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default MonthView;
