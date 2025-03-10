
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeSchedule } from "@/components/employee/EmployeeSchedule";
import { WorkPreferences } from "@/components/employee/WorkPreferences";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Globe } from "@/components/ui/globe";
import { Profile } from "@/types/profile";

const EmployeeView = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Fetch all employees for the selector
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['all-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, role, department')
        .order('first_name');

      if (error) throw error;
      return data as Pick<Profile, 'id' | 'first_name' | 'last_name' | 'role' | 'department'>[];
    }
  });

  // Fetch selected employee's profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['employee-profile', selectedEmployeeId],
    queryFn: async () => {
      if (!selectedEmployeeId) return null;
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', selectedEmployeeId)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!selectedEmployeeId
  });

  if (loadingEmployees) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-sage-50 to-lavender-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {profile ? `${profile.first_name} ${profile.last_name}` : 'Välj anställd'}
              </h1>
              {profile && (
                <p className="text-gray-600">
                  {profile.role} - {profile.department}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Users className="h-5 w-5 text-gray-500" />
              <Select
                value={selectedEmployeeId || ""}
                onValueChange={setSelectedEmployeeId}
              >
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder="Välj anställd" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} - {employee.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedEmployeeId ? (
            <Tabs defaultValue="schedule" className="space-y-4">
              <TabsList>
                <TabsTrigger value="schedule">Mitt schema</TabsTrigger>
                <TabsTrigger value="preferences">Inställningar</TabsTrigger>
              </TabsList>

              <TabsContent value="schedule" className="space-y-4">
                <EmployeeSchedule employeeId={selectedEmployeeId} />
              </TabsContent>

              <TabsContent value="preferences" className="space-y-4">
                <WorkPreferences employeeId={selectedEmployeeId} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="relative h-[600px] flex items-center justify-center">
              <Globe />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default EmployeeView;
