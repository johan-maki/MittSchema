
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import { ShiftList } from "@/components/shifts/ShiftList";
import { Shift } from "@/types/shift";

const Schedule = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  
  const { data: shifts, isLoading } = useQuery({
    queryKey: ['shifts', date],
    queryFn: async () => {
      if (!date) return [];
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString());

      if (error) {
        console.error('Error fetching shifts:', error);
        throw error;
      }
      return data as Shift[];
    },
    enabled: !!user
  });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-secondary">Schedule</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Shift</Button>
            </DialogTrigger>
            <ShiftForm isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-secondary">
              Shifts for {date ? format(date, 'MMMM d, yyyy') : 'No date selected'}
            </h2>
            {isLoading ? (
              <p className="text-gray-600 mt-4">Loading shifts...</p>
            ) : shifts?.length ? (
              <ShiftList shifts={shifts} />
            ) : (
              <p className="text-gray-600 mt-4">No shifts scheduled for this day</p>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Schedule;
