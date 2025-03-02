import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Shift, ShiftType } from "@/types/shift";
import { convertDatabaseProfile } from "@/types/profile";
import type { DatabaseProfile, Profile } from "@/types/profile";

export const useScheduleGeneration = (currentDate: Date, currentView: 'day' | 'week' | 'month') => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedShifts, setGeneratedShifts] = useState<Shift[]>([]);

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['schedule-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_settings')
        .select('*')
        .eq('department', 'General')
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        throw error;
      }

      console.log('Fetched settings:', data);
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }

      const convertedProfiles = (data as DatabaseProfile[] || []).map(convertDatabaseProfile);
      console.log('Fetched and converted profiles:', convertedProfiles);
      return convertedProfiles;
    }
  });

  const validateConstraints = () => {
    console.log('Validating constraints with settings:', settings);
    console.log('Loading state:', isLoadingSettings);

    if (isLoadingSettings) {
      console.log('Settings are still loading');
      return true;
    }

    if (!settings) {
      console.log('No settings found');
      toast({
        title: "Inställningar saknas",
        description: "Vänligen konfigurera schemaläggningsinställningar först.",
        variant: "destructive",
      });
      return false;
    }

    // Check basic constraints
    if (!settings.max_consecutive_days || !settings.min_rest_hours) {
      console.log('Missing basic constraints:', {
        max_consecutive_days: settings.max_consecutive_days,
        min_rest_hours: settings.min_rest_hours
      });
      toast({
        title: "Ofullständiga inställningar",
        description: "Vänligen kontrollera att alla grundläggande begränsningar är konfigurerade.",
        variant: "destructive",
      });
      return false;
    }

    // Check shift settings
    const shifts = ['morning_shift', 'afternoon_shift', 'night_shift'] as const;
    for (const shift of shifts) {
      const shiftSettings = settings[shift];
      console.log(`Checking ${shift} settings:`, shiftSettings);
      
      if (!shiftSettings?.min_staff || !shiftSettings?.min_experience_sum) {
        console.log(`Invalid settings for ${shift}:`, shiftSettings);
        toast({
          title: "Ofullständiga skiftinställningar",
          description: `Vänligen kontrollera inställningarna för ${shift}.`,
          variant: "destructive",
        });
        return false;
      }
    }

    console.log('All constraints validated successfully');
    return true;
  };

  const generateSchedule = async () => {
    console.log('Starting schedule generation');
    
    if (isLoadingSettings) {
      console.log('Settings are still loading');
      toast({
        title: "Laddar inställningar",
        description: "Vänta medan inställningarna laddas...",
      });
      return false;
    }

    console.log('About to validate constraints');
    if (!validateConstraints()) {
      console.log('Constraint validation failed');
      return false;
    }

    setIsGenerating(true);
    try {
      console.log('Calling generate-schedule function with:', {
        settings,
        profiles,
        currentDate: currentDate.toISOString(),
        view: currentView
      });

      const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: {
          settings,
          profiles,
          currentDate: currentDate.toISOString(),
          view: currentView
        }
      });

      if (error) throw error;

      console.log('Generate schedule response:', data);

      if (data?.shifts?.length > 0) {
        const processedShifts = ensureMinimumStaffing(data.shifts, profiles);
        
        const uniqueShifts = removeDuplicateShifts(processedShifts);
        
        if (uniqueShifts.length < processedShifts.length) {
          console.log(`Removed ${processedShifts.length - uniqueShifts.length} duplicate shifts after staffing adjustment`);
        }
        
        setGeneratedShifts(uniqueShifts);
        setShowPreview(true);
        return true;
      } else {
        console.log('No shifts generated');
        toast({
          title: "Kunde inte generera schema",
          description: "Det gick inte att hitta en giltig schemaläggning med nuvarande begränsningar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte generera schema. Kontrollera begränsningar och försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
    return false;
  };

  const ensureMinimumStaffing = (shifts: Shift[], availableProfiles: Profile[]): Shift[] => {
    const shiftsByDay = new Map<string, Map<ShiftType, Shift[]>>();
    const result: Shift[] = [...shifts];
    
    const roleToShiftType: Record<string, ShiftType> = {
      'Läkare': 'day',
      'Sjuksköterska': 'evening',
      'Undersköterska': 'night'
    };
    
    const minStaffByShiftType: Record<ShiftType, number> = {
      'day': 3,
      'evening': 3,
      'night': 2
    };
    
    shifts.forEach(shift => {
      const shiftDate = new Date(shift.start_time);
      const dateStr = `${shiftDate.getFullYear()}-${shiftDate.getMonth()}-${shiftDate.getDate()}`;
      
      if (!shiftsByDay.has(dateStr)) {
        shiftsByDay.set(dateStr, new Map<ShiftType, Shift[]>());
      }
      
      const dayShifts = shiftsByDay.get(dateStr)!;
      if (!dayShifts.has(shift.shift_type)) {
        dayShifts.set(shift.shift_type, []);
      }
      
      dayShifts.get(shift.shift_type)!.push(shift);
    });
    
    shiftsByDay.forEach((dayShifts, dateStr) => {
      for (const shiftType of ['day', 'evening', 'night'] as ShiftType[]) {
        const shiftsOfType = dayShifts.get(shiftType) || [];
        const neededStaff = minStaffByShiftType[shiftType] - shiftsOfType.length;
        
        if (neededStaff > 0) {
          console.log(`Need ${neededStaff} more staff for ${shiftType} shift on ${dateStr}`);
          
          const eligibleProfiles = availableProfiles.filter(profile => {
            const profileShiftType = roleToShiftType[profile.role];
            if (profileShiftType !== shiftType) return false;
            
            const isAlreadyAssigned = shiftsOfType.some(shift => 
              shift.employee_id === profile.id
            );
            
            const alreadyHasShiftOnDay = Array.from(dayShifts.values())
              .flat()
              .some(shift => shift.employee_id === profile.id);
            
            return !isAlreadyAssigned && !alreadyHasShiftOnDay;
          });
          
          for (let i = 0; i < Math.min(neededStaff, eligibleProfiles.length); i++) {
            const profile = eligibleProfiles[i];
            
            const shiftDate = new Date(dateStr);
            let startHour = 0, endHour = 0;
            
            switch(shiftType) {
              case 'day':
                startHour = 7;
                endHour = 15;
                break;
              case 'evening':
                startHour = 15;
                endHour = 23;
                break;
              case 'night':
                startHour = 23;
                endHour = 7;
                break;
            }
            
            const startTime = new Date(shiftDate);
            startTime.setHours(startHour, 0, 0);
            
            const endTime = new Date(shiftDate);
            if (shiftType === 'night') {
              endTime.setDate(endTime.getDate() + 1);
            }
            endTime.setHours(endHour, 0, 0);
            
            const newShift: Shift = {
              id: `generated-${dateStr}-${shiftType}-${profile.id}`,
              employee_id: profile.id,
              shift_type: shiftType,
              department: 'General',
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString()
            };
            
            console.log(`Added ${profile.first_name} ${profile.last_name} to ${shiftType} shift on ${dateStr}`);
            result.push(newShift);
          }
        }
      }
    });
    
    return result;
  };

  const removeDuplicateShifts = (shifts: Shift[]): Shift[] => {
    const uniqueShiftMap = new Map<string, Shift>();
    const employeeShiftsByDay = new Map<string, Map<string, ShiftType>>();
    
    shifts.forEach(shift => {
      const shiftDate = new Date(shift.start_time);
      const dateKey = `${shiftDate.getFullYear()}-${shiftDate.getMonth()}-${shiftDate.getDate()}`;
      const employeeId = shift.employee_id;
      const shiftType = shift.shift_type;
      
      if (!employeeShiftsByDay.has(dateKey)) {
        employeeShiftsByDay.set(dateKey, new Map<string, ShiftType>());
      }
      
      const dayEmployees = employeeShiftsByDay.get(dateKey)!;
      
      if (dayEmployees.has(employeeId) && dayEmployees.get(employeeId) !== shiftType) {
        console.log(`Employee ${employeeId} already has a different shift on ${dateKey}`);
        return;
      }
      
      dayEmployees.set(employeeId, shiftType);
      
      const uniqueKey = `${employeeId}-${dateKey}-${shiftType}`;
      
      if (!uniqueShiftMap.has(uniqueKey)) {
        uniqueShiftMap.set(uniqueKey, shift);
      }
    });
    
    return Array.from(uniqueShiftMap.values());
  };

  return {
    isGenerating,
    isLoadingSettings,
    showPreview,
    setShowPreview,
    generatedShifts,
    setGeneratedShifts,
    generateSchedule,
    profiles
  };
};
