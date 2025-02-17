
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type Shift = {
  id: string;
  start_time: string;
  end_time: string;
  shift_type: 'day' | 'evening' | 'night';
  department: string;
  notes?: string;
};

const Schedule = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
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

      if (error) throw error;
      return data as Shift[];
    }
  });

  const DayShifts = ({ shifts }: { shifts: Shift[] }) => (
    <div className="space-y-2 mt-4">
      {shifts.map((shift) => (
        <Card key={shift.id} className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-secondary">
                {format(new Date(shift.start_time), 'HH:mm')} - 
                {format(new Date(shift.end_time), 'HH:mm')}
              </h3>
              <p className="text-sm text-gray-600">{shift.department}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs capitalize" 
              style={{
                backgroundColor: 
                  shift.shift_type === 'day' ? '#E5F6FD' :
                  shift.shift_type === 'evening' ? '#FFF4E5' : '#FCE7F3',
                color:
                  shift.shift_type === 'day' ? '#0EA5E9' :
                  shift.shift_type === 'evening' ? '#F59E0B' : '#EC4899'
              }}>
              {shift.shift_type}
            </span>
          </div>
          {shift.notes && (
            <p className="text-sm text-gray-500 mt-2">{shift.notes}</p>
          )}
        </Card>
      ))}
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-secondary">Schedule</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Add Shift</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Shift</DialogTitle>
              </DialogHeader>
              {/* We'll implement the shift form in the next iteration */}
              <p className="text-gray-600">Shift creation form coming soon...</p>
            </DialogContent>
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
              <DayShifts shifts={shifts} />
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
