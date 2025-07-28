
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

  // Get current user to default to their own profile
  React.useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Look for employee record that matches the user's email
        const { data: employee, error } = await supabase
          .from('employees')
          .select('id')
          .eq('email', user.email)
          .single();
          
        if (employee && !error) {
          console.log('👤 Found current user employee record:', employee.id);
          setCurrentUserId(employee.id);
          // Auto-select current user if no employee is selected
          if (!selectedEmployeeId) {
            setSelectedEmployeeId(employee.id);
          }
        } else {
          console.log('👤 No employee record found for current user email:', user.email);
        }
      }
    };
    
    getCurrentUser();
  }, [selectedEmployeeId]);

  // Fetch all employees for the selector (managers can view anyone's schedule)
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['all-employees'],
    queryFn: async () => {
      console.log('🔍 Fetching all employees...');
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, role, department, experience_level, email')
        .order('first_name');

      if (error) {
        console.error('❌ Error fetching employees:', error);
        throw error;
      }
      
      console.log('✅ Fetched employees:', data?.length || 0);
      console.log('Employee data:', data);
      
      return data as (Pick<Profile, 'id' | 'first_name' | 'last_name' | 'role' | 'department' | 'experience_level'> & { email: string })[];
    }
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
      1: { label: 'Junior', color: 'bg-blue-100 text-blue-800' },
      2: { label: 'Medel', color: 'bg-green-100 text-green-800' },
      3: { label: 'Senior', color: 'bg-purple-100 text-purple-800' }
    };
    const config = levels[level as keyof typeof levels] || levels[1];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-sage-50 to-lavender-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      {profile ? `${profile.first_name} ${profile.last_name}` : 'Välkommen'}
                      {currentUserId === selectedEmployeeId && (
                        <Badge variant="outline" className="ml-3 text-xs bg-green-50 text-green-700 border-green-200">
                          Det här är du
                        </Badge>
                      )}
                    </CardTitle>
                    {profile && (
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline">{profile.role}</Badge>
                        <Badge variant="outline">{profile.department}</Badge>
                        {profile.experience_level && getExperienceBadge(profile.experience_level)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <Select
                    value={selectedEmployeeId || ""}
                    onValueChange={setSelectedEmployeeId}
                  >
                    <SelectTrigger className="w-full lg:w-[280px]">
                      <SelectValue placeholder="Välj anställd" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Show current user first if available */}
                      {currentUserId && employees?.find(emp => emp.id === currentUserId) && (
                        <>
                          {(() => {
                            const currentUser = employees.find(emp => emp.id === currentUserId)!;
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
                <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
                  <TabsTrigger value="schedule" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Mitt schema
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex items-center gap-2">
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
            <Card className="p-12">
              <div className="text-center">
                <Globe className="mx-auto mb-6" />
                <h3 className="text-xl font-medium mb-2">Välj en anställd</h3>
                <p className="text-muted-foreground">
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
