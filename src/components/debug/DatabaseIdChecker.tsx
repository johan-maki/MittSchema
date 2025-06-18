import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const DatabaseIdChecker = () => {
  const [checkingIds, setCheckingIds] = useState(false);

  const { data: employees } = useQuery({
    queryKey: ['db-check-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, role');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: shifts } = useQuery({
    queryKey: ['db-check-shifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('id, employee_id, start_time, shift_type, department');
      
      if (error) throw error;
      return data;
    }
  });

  const checkIdMatching = () => {
    setCheckingIds(true);
    
    if (!employees || !shifts) {
      console.log('❌ Missing data for ID check');
      setCheckingIds(false);
      return;
    }

    console.log('🔍 === ID MATCHING CHECK ===');
    console.log('Employees found:', employees.length);
    console.log('Shifts found:', shifts.length);
    
    // Get all unique employee IDs from shifts
    const shiftEmployeeIds = [...new Set(shifts.map(s => s.employee_id))];
    console.log('Unique employee IDs in shifts:', shiftEmployeeIds);
    
    // Get all employee IDs from employees table
    const employeeIds = employees.map(e => e.id);
    console.log('Employee IDs in employees table:', employeeIds);
    
    // Check for mismatches
    const orphanedShifts = shiftEmployeeIds.filter(id => !employeeIds.includes(id));
    const employeesWithoutShifts = employeeIds.filter(id => !shiftEmployeeIds.includes(id));
    
    console.log('🚨 Orphaned shifts (employee_id not in employees table):', orphanedShifts);
    console.log('👤 Employees without shifts:', employeesWithoutShifts);
    
    // Show detailed breakdown
    employees.forEach(emp => {
      const empShifts = shifts.filter(s => s.employee_id === emp.id);
      console.log(`👤 ${emp.first_name} ${emp.last_name} (${emp.id}): ${empShifts.length} shifts`);
    });
    
    setCheckingIds(false);
  };

  const getEmployeeShiftCounts = () => {
    if (!employees || !shifts) return [];
    
    return employees.map(emp => {
      const empShifts = shifts.filter(s => s.employee_id === emp.id);
      return {
        ...emp,
        shiftCount: empShifts.length,
        hasShifts: empShifts.length > 0
      };
    });
  };

  const employeeStats = getEmployeeShiftCounts();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Database ID Matching Check
          <Button onClick={checkIdMatching} disabled={checkingIds} size="sm">
            {checkingIds ? 'Checking...' : 'Check IDs'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Database Stats</h4>
            <div className="space-y-1 text-sm">
              <div>👥 Employees: {employees?.length || 0}</div>
              <div>⏰ Shifts: {shifts?.length || 0}</div>
              <div>🔗 Unique employee IDs in shifts: {shifts ? [...new Set(shifts.map(s => s.employee_id))].length : 0}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Employee-Shift Mapping</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {employeeStats.map(emp => (
                <div key={emp.id} className="flex items-center justify-between text-sm">
                  <span>{emp.first_name} {emp.last_name}</span>
                  <Badge variant={emp.hasShifts ? "default" : "destructive"}>
                    {emp.shiftCount} shifts
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {shifts && shifts.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <h5 className="font-semibold text-sm mb-2">Sample Shift Data</h5>
            <div className="text-xs space-y-1">
              {shifts.slice(0, 3).map(shift => (
                <div key={shift.id}>
                  Employee ID: {shift.employee_id} | Date: {shift.start_time.split('T')[0]} | Type: {shift.shift_type}
                </div>
              ))}
              {shifts.length > 3 && <div>... and {shifts.length - 3} more</div>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
