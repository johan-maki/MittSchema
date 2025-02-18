
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { sv } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import { ShiftList } from "@/components/shifts/ShiftList";
import { Shift } from "@/types/shift";
import { WeeklySchedule } from "@/components/shifts/WeeklySchedule";

const Schedule = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const isManager = profile?.is_manager ?? false;

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['shifts', date, isManager],
    queryFn: async () => {
      if (!date || !user) return [];
      
      let query = supabase
        .from('shifts')
        .select('*, profiles!shifts_employee_id_fkey(first_name, last_name)');

      if (isManager) {
        // För managers, hämta alla skift för veckan
        const weekStart = startOfWeek(date, { locale: sv });
        const weekEnd = endOfWeek(date, { locale: sv });
        query = query
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString());
      } else {
        // För anställda, hämta bara deras egna skift för den valda dagen
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .eq('employee_id', user.id)
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Shift[];
    },
    enabled: !!user && !!date
  });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#1A1F2C]">
            {isManager ? 'Personalschema' : 'Mitt schema'}
          </h1>
          {isManager && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#9b87f5] hover:bg-[#7E69AB]">
                  Lägg till arbetspass
                </Button>
              </DialogTrigger>
              <ShiftForm isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={sv}
              className="rounded-md border"
            />
          </Card>

          <Card className="p-6">
            {isManager ? (
              <WeeklySchedule 
                date={date}
                shifts={shifts || []}
                isLoading={isLoading}
              />
            ) : (
              <>
                <h2 className="text-xl font-semibold text-[#1A1F2C] mb-4">
                  Arbetspass {date ? format(date, 'EEEE d MMMM', { locale: sv }) : 'Inget datum valt'}
                </h2>
                {isLoading ? (
                  <div className="flex justify-center p-12">
                    <div className="animate-spin h-8 w-8 border-4 border-[#9b87f5] border-r-transparent rounded-full" />
                  </div>
                ) : shifts?.length ? (
                  <ShiftList shifts={shifts} />
                ) : (
                  <p className="text-gray-600 mt-4">Inga arbetspass schemalagda denna dag</p>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Schedule;
