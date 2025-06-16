
import { toast } from "@/hooks/use-toast";

export const validateConstraints = (settings: any, isLoadingSettings: boolean) => {
  console.log('Validating constraints with settings:', settings);
  console.log('Loading state:', isLoadingSettings);

  if (isLoadingSettings) {
    console.log('Settings are still loading');
    return true;
  }

  // In development mode, be more permissive with validation
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    if (!settings) {
      console.log('🚀 Development mode: Using default settings for validation');
      return true; // Allow generation to proceed with defaults
    }
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
