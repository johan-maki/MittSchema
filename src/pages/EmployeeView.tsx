
import React, { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeSchedule } from "@/components/employee/EmployeeSchedule";
import { WorkPreferences } from "@/components/employee/WorkPreferences";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, User, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "@/components/ui/globe";
import { Profile, convertDatabaseProfile } from "@/types/profile";
import type { DatabaseProfile } from "@/types/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const EmployeeView = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch all employees for the selector (managers can view anyone's schedule)
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['all-employees'],
    queryFn: async () => {
      console.log('🔍 EmployeeView: Fetching all employees...');
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, role, department, experience_level')
        .order('first_name');

      if (error) {
        console.error('❌ EmployeeView: Error fetching employees:', error);
        throw error;
      }
      
      console.log(`✅ EmployeeView: Fetched ${data?.length || 0} employees`);
      
      // Log employee names for debugging
      if (data && data.length > 0) {
        const names = data.slice(0, 3).map(emp => `${emp.first_name} ${emp.last_name}`).join(', ');
        console.log(`👥 EmployeeView: First employees: ${names}${data.length > 3 ? '...' : ''}`);
      }
      
      return data as (Pick<Profile, 'id' | 'first_name' | 'last_name' | 'role' | 'department' | 'experience_level'>)[];
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // React Query v5 uses gcTime instead of cacheTime
  });

  // Fetch selected employee's profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['employee-profile', selectedEmployeeId],
    queryFn: async () => {
      if (!selectedEmployeeId) return null;
      console.log('🔍 Fetching profile for employee:', selectedEmployeeId);
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', selectedEmployeeId)
        .single();

      if (error) {
        console.error('❌ Error fetching employee profile:', error);
        throw error;
      }
      
      console.log('✅ Fetched employee profile:', data);
      return convertDatabaseProfile(data as DatabaseProfile);
    },
    enabled: !!selectedEmployeeId
  });

  // Auto-select first employee if none selected and employees are loaded
  React.useEffect(() => {
    if (!selectedEmployeeId && employees?.length) {
      console.log('📌 Auto-selecting first employee:', employees[0].id, employees[0].first_name);
      setSelectedEmployeeId(employees[0].id);
      // Set first employee as current user for demo purposes
      setCurrentUserId(employees[0].id);
    }
  }, [employees, selectedEmployeeId]);

  if (loadingEmployees) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const getExperienceBadge = (level: number) => {
    const levels = {
      1: { label: 'Nybörjare', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      2: { label: 'Erfaren', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      3: { label: 'Välerfaren', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      4: { label: 'Senior', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      5: { label: 'Expert', color: 'bg-rose-50 text-rose-700 border-rose-200' }
    };
    const config = levels[level as keyof typeof levels] || levels[1];
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  };

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Modern Header with Gradient Card */}
          <Card className="bg-white/80 backdrop-blur-md border-slate-200/50 shadow-sm">
            <CardHeader className="pb-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <User className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl sm:text-3xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {profile ? `${profile.first_name} ${profile.last_name}` : 'Välkommen'}
                      {currentUserId === selectedEmployeeId && (
                        <Badge variant="outline" className="ml-3 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                          Det här är du
                        </Badge>
                      )}
                    </CardTitle>
                    {profile && (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          {profile.role}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {profile.department}
                        </Badge>
                        {profile.experience_level && getExperienceBadge(profile.experience_level)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                  <Select
                    value={selectedEmployeeId || ""}
                    onValueChange={setSelectedEmployeeId}
                  >
                    <SelectTrigger className="w-full lg:w-[320px] bg-white/80 backdrop-blur-sm">
                      <SelectValue placeholder="Välj anställd" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Show current user first if available */}
                      {currentUserId && employees?.find(emp => emp.id === currentUserId) && (
                        <>
                          {(() => {
                            const currentUser = employees.find(emp => emp.id === currentUserId);
                            if (!currentUser) return null;
                            return (
                              <SelectItem key={currentUser.id} value={currentUser.id}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {currentUser.first_name} {currentUser.last_name}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {currentUser.role}
                                  </Badge>
                                  <Badge className="text-xs bg-green-100 text-green-800">
                                    Du
                                  </Badge>
                                </div>
                              </SelectItem>
                            );
                          })()}
                          <div className="h-px bg-border my-1" />
                        </>
                      )}
                      
                      {/* Show other employees */}
                      {employees?.filter(emp => emp.id !== currentUserId).map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {employee.role}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
          </Card>

          {selectedEmployeeId ? (
            <div className="space-y-6">
              <Tabs defaultValue="schedule" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2 bg-white/80 backdrop-blur-sm border border-slate-200/50">
                  <TabsTrigger 
                    value="schedule" 
                    className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    <Calendar className="h-4 w-4" />
                    Mitt schema
                  </TabsTrigger>
                  <TabsTrigger 
                    value="preferences" 
                    className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    <User className="h-4 w-4" />
                    Inställningar
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="schedule" className="space-y-4">
                  <EmployeeSchedule employeeId={selectedEmployeeId} />
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                  <WorkPreferences employeeId={selectedEmployeeId} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card className="p-12 bg-white/80 backdrop-blur-sm border-slate-200/50">
              <div className="text-center">
                <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <Globe className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Välj en anställd</h3>
                <p className="text-slate-600">
                  Välj en anställd från listan ovan för att visa deras schema och inställningar.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default EmployeeView;
