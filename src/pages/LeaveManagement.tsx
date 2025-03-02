
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { EmployeeLeaveRequests } from "@/components/leave/EmployeeLeaveRequests";
import { ManagerLeaveRequests } from "@/components/leave/ManagerLeaveRequests";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function LeaveManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("my-requests");
  
  const { data: isManager } = useQuery({
    queryKey: ['is-manager', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_manager')
        .eq('id', user.id)
        .single();
      
      if (error) return false;
      return data.is_manager;
    },
    enabled: !!user,
  });
  
  return (
    <AppLayout>
      <div className="container py-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Frånvarohantering</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="my-requests">Mina ansökningar</TabsTrigger>
            {isManager && (
              <TabsTrigger value="manage-requests">Hantera ansökningar</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="my-requests" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <LeaveRequestForm />
              </div>
              <div className="md:col-span-2">
                <EmployeeLeaveRequests />
              </div>
            </div>
          </TabsContent>
          
          {isManager && (
            <TabsContent value="manage-requests">
              <ManagerLeaveRequests />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
}
