
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InsertProfile } from "@/types/profile";
import { DialogFooter } from "@/components/ui/dialog";
import { Dispatch, SetStateAction } from "react";

interface AddProfileDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  newProfile: InsertProfile;
  setNewProfile: Dispatch<SetStateAction<InsertProfile>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isEditing?: boolean;
  isProcessing?: boolean;
}

// Define form field components for reusability
const FormField = ({ 
  label, 
  value, 
  onChange, 
  required = false, 
  type = "text", 
  min, 
  max,
  disabled = false
}: { 
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
}) => (
  <div className="mb-4">
    <label className="text-sm font-medium text-[#1A1F2C] dark:text-gray-300 block mb-1">{label}</label>
    <Input
      required={required}
      type={type}
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
      disabled={disabled}
    />
  </div>
);

export const AddProfileDialog = ({
  isOpen,
  setIsOpen,
  newProfile,
  setNewProfile,
  onSubmit,
  isEditing = false,
  isProcessing = false
}: AddProfileDialogProps) => {
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    try {
      await onSubmit(e);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const updateProfile = (field: keyof InsertProfile, value: string) => {
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
    <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
      <FormField 
        label="Förnamn" 
        value={newProfile.first_name} 
        onChange={(value) => updateProfile('first_name', value)} 
        required 
        disabled={isProcessing}
      />
      
      <FormField 
        label="Efternamn" 
        value={newProfile.last_name} 
        onChange={(value) => updateProfile('last_name', value)} 
        required 
        disabled={isProcessing}
      />
      
      <FormField 
        label="Yrkesroll" 
        value={newProfile.role} 
        onChange={(value) => updateProfile('role', value)} 
        required 
        disabled={isProcessing}
      />
      
      <FormField 
        label="Avdelning" 
        value={newProfile.department || ''} 
        onChange={(value) => updateProfile('department', value)} 
        disabled={isProcessing}
      />
      
      <FormField 
        label="Telefonnummer" 
        value={newProfile.phone || ''} 
        onChange={(value) => updateProfile('phone', value)} 
        disabled={isProcessing}
      />
      
      <FormField 
        label="Erfarenhetsnivå (år)" 
        value={newProfile.experience_level} 
        onChange={(value) => updateProfile('experience_level', value)} 
        type="number" 
        min="0" 
        max="50" 
        disabled={isProcessing}
      />

      <DialogFooter className="mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setIsOpen(false)} 
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
