
import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { FormField } from "./FormField";
import { FormSelectField } from "./FormSelectField";
import { RoleSelector } from "./RoleSelector";
import { HourlyRateSlider } from "./HourlyRateSlider";
import { WorkPercentageSlider } from "./WorkPercentageSlider";
import { InsertProfile } from "@/types/profile";
import { useProfileForm } from "@/hooks/useProfileForm";

interface ProfileFormContentProps {
  initialProfile: InsertProfile;
  onProfileChange?: (profile: InsertProfile) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  isProcessing?: boolean;
}

export const ProfileFormContent = ({
  initialProfile,
  onProfileChange,
  onSubmit,
  onCancel,
  isEditing = false,
  isProcessing = false
}: ProfileFormContentProps) => {
  const { 
    profile, 
    errors, 
    updateProfile, 
    handleFormSubmit 
  } = useProfileForm({
    initialProfile,
    onSubmit,
    isProcessing
  });

  // If parent component needs to track profile changes
  if (onProfileChange) {
    onProfileChange(profile);
  }

  // Avdelningsalternativ
  const departmentOptions = [
    { value: "Akutmottagning", label: "Akutmottagning" },
    { value: "Barnröntgen", label: "Barnröntgen" },
  ];

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField 
          label="Förnamn" 
          value={profile.first_name} 
          onChange={(value) => updateProfile('first_name', value)} 
          required 
          disabled={isProcessing}
          error={errors.first_name}
        />
        
        <FormField 
          label="Efternamn" 
          value={profile.last_name} 
          onChange={(value) => updateProfile('last_name', value)} 
          required 
          disabled={isProcessing}
          error={errors.last_name}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RoleSelector
          value={profile.role}
          onValueChange={(value) => updateProfile('role', value)}
          disabled={isProcessing}
          error={errors.role}
        />
        
        <FormSelectField 
          label="Avdelning" 
          value={profile.department || ''} 
          onChange={(value) => updateProfile('department', value)} 
          disabled={isProcessing}
          error={errors.department}
          placeholder="Välj avdelning"
          options={departmentOptions}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField 
          label="Telefonnummer" 
          value={profile.phone || ''} 
          onChange={(value) => updateProfile('phone', value)} 
          disabled={isProcessing}
          error={errors.phone}
          placeholder="070-123 45 67"
        />
        
        <FormField 
          label="Erfarenhetspoäng (1-5)" 
          value={profile.experience_level} 
          onChange={(value) => updateProfile('experience_level', value)} 
          type="number" 
          min="1" 
          max="5" 
          disabled={isProcessing}
          error={errors.experience_level}
          placeholder="1"
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <HourlyRateSlider
          value={profile.hourly_rate || 1000}
          onChange={(value) => updateProfile('hourly_rate', value)}
          disabled={isProcessing}
        />
        
        <WorkPercentageSlider
          value={profile.work_percentage || 100}
          onChange={(value) => updateProfile('work_percentage', value)}
          disabled={isProcessing}
        />
      </div>

      <DialogFooter className="mt-8 gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          className="px-6 py-2.5 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600"
          disabled={isProcessing}
        >
          Avbryt
        </Button>
        <Button 
          type="submit" 
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
          disabled={isProcessing}
        >
          {isProcessing 
            ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Bearbetar...
              </div>
            ) : isEditing 
              ? "Spara ändringar" 
              : "Lägg till medarbetare"}
        </Button>
      </DialogFooter>
    </form>
  );
};
