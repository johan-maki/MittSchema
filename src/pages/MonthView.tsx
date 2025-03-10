import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { CalendarHeader } from "@/components/shifts/CalendarHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { getCalendarDays, formatDate, isCurrentMonth } from "@/utils/calendarUtils";
import { MonthlySchedule } from "@/components/shifts/MonthlySchedule";

const MonthView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const calendarDays = getCalendarDays(currentDate);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-56px)] flex flex-col bg-gradient-to-br from-sage-50 to-lavender-50">
        <header className="p-4 bg-white/30 backdrop-blur-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">
                {formatDate(currentDate, "MMMM yyyy")}
              </h2>
            </div>
            <CalendarHeader
              currentDate={currentDate}
              onDateChange={setCurrentDate}
            />
          </div>
        </header>

        <div className="flex-1 p-4 overflow-hidden">
          <Card className="h-full border-none shadow-none">
            <MonthlySchedule date={currentDate} />
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default MonthView;
