
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { MonthlySchedule } from "@/components/shifts/MonthlySchedule";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseProfile, convertDatabaseProfile } from "@/types/profile";
import { motion } from "framer-motion";

const MonthView = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts', currentDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          profiles:employee_id (
            first_name,
            last_name,
            experience_level
          )
        `)
        .gte('start_time', new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString())
        .lte('start_time', new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString());

      if (error) {
        console.error('Error fetching shifts:', error);
        return [];
      }

      return data || [];
    }
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }

      return (data as DatabaseProfile[] || []).map(convertDatabaseProfile);
    }
  });

  return (
    <AppLayout>
      <div className="h-[calc(100vh-56px)] flex flex-col bg-gradient-to-br from-sage-50 to-lavender-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex-1 p-2 sm:p-4 overflow-auto"
        >
          <MonthlySchedule 
            date={currentDate}
            shifts={shifts}
            profiles={profiles}
          />
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default MonthView;
