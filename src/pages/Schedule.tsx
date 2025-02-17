
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type ShiftType = 'day' | 'evening' | 'night';

type Shift = {
  id: string;
  start_time: string;
  end_time: string;
  shift_type: ShiftType;
  department: string;
  notes?: string;
  created_by?: string;
};

type FormData = {
  start_time: string;
  end_time: string;
  shift_type: ShiftType;
  department: string;
  notes: string;
};

const Schedule = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    start_time: "",
    end_time: "",
    shift_type: "day",
    department: "",
    notes: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
    enabled: !!user // Only run query if user is authenticated
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create shifts",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('shifts')
        .insert([{
          ...formData,
          created_by: user.id
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shift has been created successfully",
      });

      // Reset form and close dialog
      setFormData({
        start_time: "",
        end_time: "",
        shift_type: "day",
        department: "",
        notes: ""
      });
      setIsDialogOpen(false);

      // Refresh shifts data
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (error: any) {
      console.error('Error creating shift:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create shift. Please try again.",
        variant: "destructive",
      });
    }
  };

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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Shift</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Shift</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="shift_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Shift Type
                  </label>
                  <select
                    id="shift_type"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={formData.shift_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, shift_type: e.target.value as ShiftType }))}
                    required
                  >
                    <option value="day">Day</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Shift</Button>
                </DialogFooter>
              </form>
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
