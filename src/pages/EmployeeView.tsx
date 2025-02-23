
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeSchedule } from "@/components/employee/EmployeeSchedule";
import { WorkPreferences } from "@/components/employee/WorkPreferences";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const EmployeeView = () => {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['employee-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">Ingen profil hittad</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-sage-50 to-lavender-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header>
            <h1 className="text-2xl font-semibold text-gray-900">
              Välkommen, {profile.first_name}!
            </h1>
            <p className="text-gray-600">
              {profile.role} - {profile.department}
            </p>
          </header>

          <Tabs defaultValue="schedule" className="space-y-4">
            <TabsList>
              <TabsTrigger value="schedule">Mitt schema</TabsTrigger>
              <TabsTrigger value="preferences">Inställningar</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-4">
              <EmployeeSchedule employeeId={user.id} />
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <WorkPreferences employeeId={user.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default EmployeeView;
