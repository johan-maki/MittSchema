import { AppLayout } from "@/components/AppLayout";
import { MonthlySchedule } from "@/components/shifts/MonthlySchedule";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/profile";
import { Shift } from "@/types/shift";
import { startOfMonth, endOfMonth } from "date-fns";
import { DatabaseProfile, convertDatabaseProfile } from "@/types/profile";

const MonthView = () => {
  const [date, setDate] = useState<Date>(new Date());

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw error;
      return (data || []).map(convertDatabaseProfile);
    }
  });

  const { data: shifts, isLoading: isLoadingShifts } = useQuery({
    queryKey: ['shifts', date],
    queryFn: async () => {
      if (!date) return [];
      
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const { data, error } = await supabase
        .from('shifts')
        .select('*, profiles!shifts_employee_id_fkey(first_name, last_name)')
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString());

      if (error) throw error;
      return data as (Shift & { profiles: Pick<Profile, 'first_name' | 'last_name'> })[];
    },
    enabled: !!date
  });

  const isLoading = isLoadingShifts;

  return (
    <AppLayout>
      <div className="max-w-[95%] mx-auto">
        <header className="mb-8 bg-gradient-to-r from-[#F2FCE2] to-[#E5DEFF] p-8 rounded-2xl">
          <div className="bg-white/90 p-6 rounded-xl backdrop-blur-sm">
            <h1 className="text-3xl font-bold text-[#1A1F2C] mb-2">Månadsschema</h1>
            <p className="text-[#6E59A5]">Översikt över alla anställdas arbetspass</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[300px,1fr] gap-8">
          <Card className="p-6 h-fit">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-md border"
            />
          </Card>

          <Card className="p-6 overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-[#9b87f5] border-r-transparent rounded-full" />
              </div>
            ) : (
              <MonthlySchedule
                date={date}
                shifts={shifts || []}
                profiles={profiles || []}
              />
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default MonthView;
