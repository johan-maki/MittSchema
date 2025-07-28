import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";

export const EmployeeCacheDebug = () => {
  // Query for profiles (used by schedule generation)
  const { data: profiles, isLoading: profilesLoading, error: profilesError } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) throw error;
      return data;
    }
  });

  // Query for all-employees (used by employee dropdown)  
  const { data: allEmployees, isLoading: allLoading, error: allError } = useQuery({
    queryKey: ['all-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, role, department, experience_level')
        .order('first_name');
      if (error) throw error;
      return data;
    }
  });

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Employee Cache Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Profiles Query ['profiles']:</span>
          {profilesLoading ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading...
            </Badge>
          ) : profilesError ? (
            <Badge variant="destructive">Error</Badge>
          ) : (
            <Badge variant="default">{profiles?.length || 0} employees</Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">All Employees Query ['all-employees']:</span>
          {allLoading ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading...
            </Badge>
          ) : allError ? (
            <Badge variant="destructive">Error</Badge>
          ) : (
            <Badge variant="default">{allEmployees?.length || 0} employees</Badge>
          )}
        </div>
        
        {profiles && allEmployees && profiles.length !== allEmployees.length && (
          <div className="text-xs text-amber-700 mt-2 p-2 bg-amber-100 rounded">
            ⚠️ Cache mismatch! Profiles: {profiles.length}, All-employees: {allEmployees.length}
          </div>
        )}
        
        {profiles && profiles.length > 0 && (
          <div className="text-xs text-gray-600 mt-2">
            First employees: {profiles.slice(0, 3).map((p: { first_name: string; last_name: string }) => `${p.first_name} ${p.last_name}`).join(', ')}
            {profiles.length > 3 && '...'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
