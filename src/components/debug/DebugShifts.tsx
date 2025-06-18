import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const DebugShifts = () => {
  const queryClient = useQueryClient();
  const { data: allShifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['debug-all-shifts'],
    queryFn: async () => {
      console.log('🔍 Debug: Fetching ALL shifts...');
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('start_time');

      if (error) {
        console.error('❌ Debug: Error fetching shifts:', error);
        throw error;
      }
      
      console.log('✅ Debug: Fetched all shifts:', data?.length || 0);
      console.log('Debug: All shifts data:', data);
      
      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  const { data: allEmployees, isLoading: employeesLoading } = useQuery({
    queryKey: ['debug-all-employees'],
    queryFn: async () => {
      console.log('🔍 Debug: Fetching ALL employees...');
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('first_name');

      if (error) {
        console.error('❌ Debug: Error fetching employees:', error);
        throw error;
      }
      
      console.log('✅ Debug: Fetched all employees:', data?.length || 0);
      console.log('Debug: All employees data:', data);
      
      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  if (shiftsLoading || employeesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['debug-all-shifts'] });
    queryClient.invalidateQueries({ queryKey: ['debug-all-employees'] });
    queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Debug: Database Contents</CardTitle>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            🔄 Refresh Data
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Employees ({allEmployees?.length || 0})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allEmployees?.map((emp) => (
                  <div key={emp.id} className="p-2 bg-gray-50 rounded text-sm">
                    <div><strong>ID:</strong> {emp.id}</div>
                    <div><strong>Name:</strong> {emp.first_name} {emp.last_name}</div>
                    <div><strong>Role:</strong> {emp.role}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Shifts ({allShifts?.length || 0})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allShifts?.map((shift) => (
                  <div key={shift.id} className="p-2 bg-gray-50 rounded text-sm">
                    <div><strong>Employee ID:</strong> {shift.employee_id}</div>
                    <div><strong>Date:</strong> {shift.start_time.split('T')[0]}</div>
                    <div><strong>Type:</strong> {shift.shift_type}</div>
                    <div><strong>Dept:</strong> {shift.department}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {allShifts && allEmployees && (
            <div className="mt-6 p-4 bg-blue-50 rounded">
              <h4 className="font-semibold mb-2">Employee-Shift Mapping</h4>
              {allEmployees.map((emp) => {
                const empShifts = allShifts.filter(s => s.employee_id === emp.id);
                return (
                  <div key={emp.id} className="mb-2">
                    <strong>{emp.first_name} {emp.last_name}</strong> (ID: {emp.id}): 
                    <span className={empShifts.length > 0 ? 'text-green-600' : 'text-red-600'}>
                      {' '}{empShifts.length} shifts
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
