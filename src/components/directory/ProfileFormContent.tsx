
import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { FormField } from "./FormField";
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

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
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
      
      <FormField 
        label="Yrkesroll" 
        value={profile.role} 
        onChange={(value) => updateProfile('role', value)} 
        required 
        disabled={isProcessing}
        error={errors.role}
      />
      
      <FormField 
        label="Avdelning" 
        value={profile.department || ''} 
        onChange={(value) => updateProfile('department', value)} 
        disabled={isProcessing}
        error={errors.department}
      />
      
      <FormField 
        label="Telefonnummer" 
        value={profile.phone || ''} 
        onChange={(value) => updateProfile('phone', value)} 
        disabled={isProcessing}
        error={errors.phone}
      />
      
      <FormField 
        label="Erfarenhetsnivå (år)" 
        value={profile.experience_level} 
        onChange={(value) => updateProfile('experience_level', value)} 
        type="number" 
        min="0" 
        max="50" 
        disabled={isProcessing}
        error={errors.experience_level}
      />

      <DialogFooter className="mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600"
          disabled={isProcessing}
        >
          Avbryt
        </Button>
        <Button 
          type="submit" 
          className="bg-[#9b87f5] hover:bg-[#7E69AB] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED]"
          disabled={isProcessing}
        >
          {isProcessing 
            ? "Bearbetar..." 
            : isEditing 
              ? "Spara ändringar" 
              : "Lägg till"}
        </Button>
      </DialogFooter>
    </form>
  );
};
