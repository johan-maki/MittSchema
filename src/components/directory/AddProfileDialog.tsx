
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewProfile } from "@/types/profile";
import { DialogFooter } from "@/components/ui/dialog";
import { Dispatch, SetStateAction, useState } from "react";

interface AddProfileDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  newProfile: NewProfile;
  setNewProfile: Dispatch<SetStateAction<NewProfile>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isEditing?: boolean;
}

// Define form field components for reusability
const FormField = ({ 
  label, 
  value, 
  onChange, 
  required = false, 
  type = "text", 
  min, 
  max 
}: { 
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  min?: string;
  max?: string;
}) => (
  <div>
    <label className="text-sm font-medium text-[#1A1F2C] dark:text-gray-300">{label}</label>
    <Input
      required={required}
      type={type}
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
    />
  </div>
);

export const AddProfileDialog = ({
  isOpen,
  setIsOpen,
  newProfile,
  setNewProfile,
  onSubmit,
  isEditing = false
}: AddProfileDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(e);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProfile = (field: keyof NewProfile, value: string) => {
    setNewProfile(prev => {
      if (field === 'experience_level') {
        return { ...prev, [field]: parseInt(value) || 1 };
      }
      
      // For nullable fields, convert empty strings to null
      if (['department', 'phone'].includes(field) && value === '') {
        return { ...prev, [field]: null };
      }
      
      return { ...prev, [field]: value };
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <FormField 
        label="Förnamn" 
        value={newProfile.first_name} 
        onChange={(value) => updateProfile('first_name', value)} 
        required 
      />
      
      <FormField 
        label="Efternamn" 
        value={newProfile.last_name} 
        onChange={(value) => updateProfile('last_name', value)} 
        required 
      />
      
      <FormField 
        label="Yrkesroll" 
        value={newProfile.role} 
        onChange={(value) => updateProfile('role', value)} 
        required 
      />
      
      <FormField 
        label="Avdelning" 
        value={newProfile.department || ''} 
        onChange={(value) => updateProfile('department', value)} 
      />
      
      <FormField 
        label="Telefonnummer" 
        value={newProfile.phone || ''} 
        onChange={(value) => updateProfile('phone', value)} 
      />
      
      <FormField 
        label="Erfarenhetsnivå (år)" 
        value={newProfile.experience_level} 
        onChange={(value) => updateProfile('experience_level', value)} 
        type="number" 
        min="0" 
        max="50" 
      />

      <DialogFooter className="mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setIsOpen(false)} 
          className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600"
          disabled={isSubmitting}
        >
          Avbryt
        </Button>
        <Button 
          type="submit" 
          className="bg-[#9b87f5] hover:bg-[#7E69AB] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED]"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Bearbetar..." : isEditing ? "Spara ändringar" : "Lägg till"}
        </Button>
      </DialogFooter>
    </form>
  );
};
