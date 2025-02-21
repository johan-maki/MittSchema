
import { Profile } from "@/types/profile";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { MoreHorizontal, CalendarPlus } from "lucide-react";
import { ShiftForm } from "@/components/shifts/ShiftForm";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface DirectoryTableProps {
  profiles: Profile[] | undefined;
  isLoading: boolean;
}

export const DirectoryTable = ({ profiles, isLoading }: DirectoryTableProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch shifts for all employees
  const { data: shifts } = useQuery({
    queryKey: ['employee-shifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const handleDeleteShift = async (shiftId: string) => {
    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId);

      if (error) throw error;

      toast({
        title: "Pass borttaget",
        description: "Arbetspasset har tagits bort",
      });

      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
    } catch (error) {
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte ta bort arbetspasset",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-[#8B5CF6] border-r-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-[#F8F9FB]">
            <th className="text-left p-4 text-sm font-medium text-[#333333]">Namn</th>
            <th className="text-left p-4 text-sm font-medium text-[#333333]">Roll</th>
            <th className="text-left p-4 text-sm font-medium text-[#333333]">Avdelning</th>
            <th className="text-left p-4 text-sm font-medium text-[#333333]">Telefon</th>
            <th className="text-left p-4 text-sm font-medium text-[#333333]">Kommande pass</th>
            <th className="text-left p-4 text-sm font-medium text-[#333333]">Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {profiles?.map((profile) => {
            const employeeShifts = shifts?.filter(shift => shift.employee_id === profile.id) || [];
            const upcomingShifts = employeeShifts
              .filter(shift => new Date(shift.start_time) > new Date())
              .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

            return (
              <tr key={profile.id} className="border-b last:border-b-0 hover:bg-[#F8F9FB]">
                <td className="p-4">
                  <div className="flex items-center gap-3">
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
                <td className="p-4 text-sm text-[#8A898C]">
                  <div className="space-y-1">
                    {upcomingShifts.slice(0, 2).map((shift) => (
                      <div key={shift.id} className="flex items-center justify-between gap-2">
                        <span>{format(new Date(shift.start_time), 'yyyy-MM-dd HH:mm')}</span>
                        <button
                          onClick={() => handleDeleteShift(shift.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Ta bort
                        </button>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  {profile.is_manager && (
                    <span className="px-2 py-1 bg-[#F1F1F1] text-[#333333] text-xs rounded-full">
                      Chef
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <Dialog open={isCreateDialogOpen && selectedEmployeeId === profile.id} onOpenChange={setIsCreateDialogOpen}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DialogTrigger asChild onClick={() => setSelectedEmployeeId(profile.id)}>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <CalendarPlus className="h-4 w-4" />
                            <span>Lägg till pass</span>
                          </DropdownMenuItem>
                        </DialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ShiftForm 
                      isOpen={isCreateDialogOpen} 
                      onOpenChange={setIsCreateDialogOpen}
                      defaultValues={{ employee_id: profile.id }}
                    />
                  </Dialog>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
