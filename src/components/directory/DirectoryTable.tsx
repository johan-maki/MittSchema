import { Profile } from "@/types/profile";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { WeekView } from "@/components/shifts/WeekView";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { addWeeks, subWeeks, startOfWeek, endOfWeek, getWeek, format } from "date-fns";
import { sv } from "date-fns/locale";

interface DirectoryTableProps {
  profiles: Profile[] | undefined;
  isLoading: boolean;
}

export const DirectoryTable = ({ profiles, isLoading }: DirectoryTableProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const { data: employeeShifts } = useQuery({
    queryKey: ['employeeShifts', selectedEmployee?.id, currentWeek],
    queryFn: async () => {
      if (!selectedEmployee) return [];
      
      const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const endDate = endOfWeek(currentWeek, { weekStartsOn: 1 });
      
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          profiles:employee_id (
            first_name,
            last_name
          )
        `)
        .eq('employee_id', selectedEmployee.id)
        .or(`start_time.gte.${startDate.toISOString()},end_time.gte.${startDate.toISOString()}`)
        .lt('start_time', endDate.toISOString());
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEmployee
  });

  const handleEmployeeClick = (profile: Profile) => {
    setSelectedEmployee(profile);
    setIsScheduleOpen(true);
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const getDateDisplay = () => {
    const weekNumber = getWeek(currentWeek, { weekStartsOn: 1, firstWeekContainsDate: 4 });
    const monthName = format(currentWeek, 'LLLL', { locale: sv });
    return `${monthName} - Vecka ${weekNumber}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-[#8B5CF6] border-r-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-[#F8F9FB]">
              <th className="text-left p-4 text-sm font-medium text-[#333333]">Namn</th>
              <th className="text-left p-4 text-sm font-medium text-[#333333]">Roll</th>
              <th className="text-left p-4 text-sm font-medium text-[#333333]">Avdelning</th>
              <th className="text-left p-4 text-sm font-medium text-[#333333]">Telefon</th>
              <th className="text-left p-4 text-sm font-medium text-[#333333]">Erfarenhet</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map((profile) => (
              <tr key={profile.id} className="border-b last:border-b-0 hover:bg-[#F8F9FB]">
                <td className="p-4">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:text-blue-600"
                    onClick={() => handleEmployeeClick(profile)}
                  >
                    <Avatar className="h-8 w-8">
                      <div className="bg-[#F1F1F1] h-full w-full flex items-center justify-center text-[#333333] font-medium text-sm">
                        {profile.first_name[0]}
                        {profile.last_name[0]}
                      </div>
                    </Avatar>
                    <div>
                      <div className="font-medium text-[#333333]">
                        {profile.first_name} {profile.last_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-[#8A898C]">{profile.role}</td>
                <td className="p-4 text-sm text-[#8A898C]">{profile.department || '-'}</td>
                <td className="p-4 text-sm text-[#8A898C]">{profile.phone || '-'}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-[#F1F1F1] text-[#333333] text-xs rounded-full">
                    Nivå {profile.experience_level}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="sm">
                    •••
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-[95vw] w-[1400px] p-0 gap-0 overflow-hidden">
          <div className="flex flex-col h-[90vh]">
            <div className="flex-none p-6 space-y-4 border-b">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">
                    Schema för {selectedEmployee?.first_name} {selectedEmployee?.last_name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {getDateDisplay()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsScheduleOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousWeek}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Föregående vecka
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNextWeek}
                  className="flex items-center gap-1"
                >
                  Nästa vecka
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedEmployee && (
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                <WeekView 
                  date={currentWeek} 
                  shifts={employeeShifts || []}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
