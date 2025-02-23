
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WeekView } from "@/components/shifts/WeekView";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { addWeeks, subWeeks, format } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface EmployeeScheduleProps {
  employeeId: string;
}

export const EmployeeSchedule = ({ employeeId }: EmployeeScheduleProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['employee-shifts', employeeId, currentWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          profiles:employee_id (
            first_name,
            last_name
          )
        `)
        .eq('employee_id', employeeId);

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <Skeleton className="w-full h-[500px]" />;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium">
              Vecka {format(currentWeek, 'w', { locale: sv })}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentWeek(new Date())}
            >
              Idag
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <WeekView date={currentWeek} shifts={shifts || []} />
      </Card>
    </div>
  );
};
