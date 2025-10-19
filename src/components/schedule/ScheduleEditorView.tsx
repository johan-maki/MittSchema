import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Profile } from "@/types/profile";

interface EditorShift {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  shift_type: 'day' | 'evening' | 'night' | 'off';
}

interface ScheduleEditorViewProps {
  shifts: EditorShift[];
  employees: Array<{ id: string; first_name: string; last_name: string }>;
  profiles?: Profile[]; // Full profile data for validation
  startDate: Date;
  endDate: Date;
  onSave?: (modifiedShifts: EditorShift[]) => void;
}

const shiftTypeLabels = {
  day: 'Dag',
  evening: 'Kväll',
  night: 'Natt',
  off: 'Ledig',
};

const shiftTypeColors = {
  day: 'bg-green-100 text-green-800 hover:bg-green-200',
  evening: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  night: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  off: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
};

export function ScheduleEditorView({ 
  shifts, 
  employees,
  profiles = [],
  startDate, 
  endDate,
  onSave 
}: ScheduleEditorViewProps) {
  const [modifiedShifts, setModifiedShifts] = useState<EditorShift[]>(shifts);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Generate date range
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Validation function wrapped in useCallback
  const validateSchedule = useCallback(() => {
    const errors: string[] = [];
    const shiftsByEmployee = modifiedShifts.reduce((acc, shift) => {
      if (!acc[shift.employee_id]) acc[shift.employee_id] = [];
      acc[shift.employee_id].push(shift);
      return acc;
    }, {} as Record<string, EditorShift[]>);

    // 1. Check max 5 working days per week per employee
    Object.entries(shiftsByEmployee).forEach(([employeeId, employeeShifts]) => {
      const employee = employees.find(e => e.id === employeeId);
      const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : 'Okänd';

      // Group shifts by week
      const shiftsByWeek = employeeShifts.reduce((acc, shift) => {
        if (shift.shift_type === 'off') return acc;
        
        const date = new Date(shift.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!acc[weekKey]) acc[weekKey] = [];
        acc[weekKey].push(shift);
        return acc;
      }, {} as Record<string, EditorShift[]>);

      Object.entries(shiftsByWeek).forEach(([weekStart, weekShifts]) => {
        if (weekShifts.length > 5) {
          errors.push(
            `${employeeName} har ${weekShifts.length} arbetspass vecka ${new Date(weekStart).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })} (max 5 tillåtet)`
          );
        }
      });
    });

    // 2. Check hard blocked slots (if profile data available)
    if (profiles.length > 0) {
      modifiedShifts.forEach(shift => {
        if (shift.shift_type === 'off') return;

        const profile = profiles.find(p => p.id === shift.employee_id);
        if (!profile?.work_preferences?.hard_blocked_slots) return;

        const hardBlocked = profile.work_preferences.hard_blocked_slots.find(
          blocked => blocked.date === shift.date
        );

        if (hardBlocked) {
          const isBlocked = 
            hardBlocked.shift_types.includes('all_day') ||
            hardBlocked.shift_types.includes(shift.shift_type);

          if (isBlocked) {
            errors.push(
              `${shift.employee_name} har hårt blockerat ${shift.shift_type === 'day' ? 'dagpass' : shift.shift_type === 'evening' ? 'kvällspass' : 'nattpass'} ${new Date(shift.date).toLocaleDateString('sv-SE')}`
            );
          }
        }
      });

      // 3. Check day constraints (strict = hard constraint)
      modifiedShifts.forEach(shift => {
        if (shift.shift_type === 'off') return;

        const profile = profiles.find(p => p.id === shift.employee_id);
        if (!profile?.work_preferences?.day_constraints) return;

        const date = new Date(shift.date);
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()] as keyof typeof profile.work_preferences.day_constraints;
        const dayConstraint = profile.work_preferences.day_constraints[dayName];

        if (dayConstraint && !dayConstraint.available && dayConstraint.strict) {
          errors.push(
            `${shift.employee_name} kan inte jobba på ${dayName === 'monday' ? 'måndag' : dayName === 'tuesday' ? 'tisdag' : dayName === 'wednesday' ? 'onsdag' : dayName === 'thursday' ? 'torsdag' : dayName === 'friday' ? 'fredag' : dayName === 'saturday' ? 'lördag' : 'söndag'}ar (${new Date(shift.date).toLocaleDateString('sv-SE')})`
          );
        }
      });

      // 4. Check shift type constraints (strict = hard constraint)
      modifiedShifts.forEach(shift => {
        if (shift.shift_type === 'off') return;

        const profile = profiles.find(p => p.id === shift.employee_id);
        if (!profile?.work_preferences?.shift_constraints) return;

        const shiftConstraint = profile.work_preferences.shift_constraints[shift.shift_type];
        if (shiftConstraint && !shiftConstraint.preferred && shiftConstraint.strict) {
          errors.push(
            `${shift.employee_name} kan inte jobba ${shift.shift_type === 'day' ? 'dagpass' : shift.shift_type === 'evening' ? 'kvällspass' : 'nattpass'} (${new Date(shift.date).toLocaleDateString('sv-SE')})`
          );
        }
      });
    }

    // 5. Check minimum coverage per day (at least 1 person per shift type on weekdays)
    const shiftsByDate = modifiedShifts.reduce((acc, shift) => {
      if (!acc[shift.date]) acc[shift.date] = { day: 0, evening: 0, night: 0 };
      if (shift.shift_type !== 'off') {
        acc[shift.date][shift.shift_type]++;
      }
      return acc;
    }, {} as Record<string, { day: number; evening: number; night: number }>);

    Object.entries(shiftsByDate).forEach(([date, coverage]) => {
      const dateObj = new Date(date);
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      
      if (!isWeekend) {
        ['day', 'evening', 'night'].forEach(shiftType => {
          if (coverage[shiftType as keyof typeof coverage] === 0) {
            errors.push(
              `Ingen täckning för ${shiftType === 'day' ? 'dagpass' : shiftType === 'evening' ? 'kvällspass' : 'nattpass'} ${dateObj.toLocaleDateString('sv-SE')}`
            );
          }
        });
      }
    });

    // 6. Check experience level coverage (at least 1 experienced per shift)
    if (profiles.length > 0) {
      Object.entries(shiftsByDate).forEach(([date, _]) => {
        ['day', 'evening', 'night'].forEach(shiftType => {
          const shiftsForSlot = modifiedShifts.filter(
            s => s.date === date && s.shift_type === shiftType
          );

          const experiencedCount = shiftsForSlot.filter(shift => {
            const profile = profiles.find(p => p.id === shift.employee_id);
            return profile && profile.experience_level >= 3;
          }).length;

          if (shiftsForSlot.length > 0 && experiencedCount === 0) {
            errors.push(
              `Ingen erfaren personal för ${shiftType === 'day' ? 'dagpass' : shiftType === 'evening' ? 'kvällspass' : 'nattpass'} ${new Date(date).toLocaleDateString('sv-SE')} (minst 1 med nivå ≥3 krävs)`
            );
          }
        });
      });
    }

    setValidationErrors(errors);
  }, [modifiedShifts, employees, profiles]);

  // Revalidate when shifts change
  useEffect(() => {
    validateSchedule();
  }, [validateSchedule]);

  // Group shifts by employee and date
  const shiftsByEmployeeAndDate = modifiedShifts.reduce((acc, shift) => {
    const key = `${shift.employee_id}_${shift.date}`;
    acc[key] = shift;
    return acc;
  }, {} as Record<string, EditorShift>);

  const handleShiftClick = (employeeId: string, date: string, currentShiftType: 'day' | 'evening' | 'night' | 'off') => {
    // Cycle through shift types: day → evening → night → off → day
    const shiftCycle: Array<'day' | 'evening' | 'night' | 'off'> = ['day', 'evening', 'night', 'off'];
    const currentIndex = shiftCycle.indexOf(currentShiftType);
    const nextShiftType = shiftCycle[(currentIndex + 1) % shiftCycle.length];

    const key = `${employeeId}_${date}`;
    const existingShift = shiftsByEmployeeAndDate[key];

    if (existingShift) {
      // Update existing shift
      setModifiedShifts(prev => prev.map(shift => 
        shift.id === existingShift.id 
          ? { ...shift, shift_type: nextShiftType }
          : shift
      ));
    } else {
      // Create new shift
      const employee = employees.find(e => e.id === employeeId);
      const newShift: EditorShift = {
        id: `new_${employeeId}_${date}_${Date.now()}`,
        employee_id: employeeId,
        employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
        date,
        shift_type: nextShiftType === 'off' ? 'day' : nextShiftType, // Start with day for new shifts
      };
      setModifiedShifts(prev => [...prev, newShift]);
    }

    setHasChanges(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(modifiedShifts);
    }
    setHasChanges(false);
  };

  const handleReset = () => {
    setModifiedShifts(shifts);
    setHasChanges(false);
    setValidationErrors([]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Schema-redigering (Chef-läge)</CardTitle>
            <CardDescription>
              Klicka på en ruta för att ändra skifttyp: Dag → Kväll → Natt → Ledig
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Återställ
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || validationErrors.length > 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Spara ändringar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {validationErrors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-gray-50 text-left sticky left-0 z-10 min-w-[150px]">
                  Anställd
                </th>
                {dates.map(date => (
                  <th key={date.toISOString()} className="border p-2 bg-gray-50 text-center min-w-[100px]">
                    <div className="text-sm font-medium">
                      {date.toLocaleDateString('sv-SE', { weekday: 'short' })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(employee => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="border p-2 font-medium sticky left-0 bg-white z-10">
                    {employee.first_name} {employee.last_name}
                  </td>
                  {dates.map(date => {
                    const dateStr = date.toISOString().split('T')[0];
                    const key = `${employee.id}_${dateStr}`;
                    const shift = shiftsByEmployeeAndDate[key];
                    const shiftType = shift?.shift_type || 'off';

                    return (
                      <td key={dateStr} className="border p-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`w-full h-12 ${shiftTypeColors[shiftType]} cursor-pointer transition-colors`}
                          onClick={() => handleShiftClick(employee.id, dateStr, shiftType)}
                        >
                          {shiftType !== 'off' && shiftTypeLabels[shiftType]}
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasChanges && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Du har osparade ändringar. Kom ihåg att spara!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
