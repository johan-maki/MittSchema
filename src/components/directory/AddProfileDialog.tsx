
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InsertProfile } from "@/types/profile";
import { DialogFooter } from "@/components/ui/dialog";
import { Dispatch, SetStateAction, useState } from "react";

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
  disabled = false,
  error = ""
}: { 
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  error?: string;
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
      className={`dark:bg-gray-800 dark:text-white dark:border-gray-700 ${error ? 'border-red-500' : ''}`}
      disabled={disabled}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!newProfile.first_name.trim()) {
      newErrors.first_name = "Förnamn krävs";
    }
    
    if (!newProfile.last_name.trim()) {
      newErrors.last_name = "Efternamn krävs";
    }
    
    if (!newProfile.role.trim()) {
      newErrors.role = "Yrkesroll krävs";
    }
    
    const expLevel = Number(newProfile.experience_level);
    if (isNaN(expLevel) || expLevel < 0 || expLevel > 15) {
      newErrors.experience_level = "Erfarenhetsnivå måste vara mellan 0 och 15 år";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSubmit(e);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const updateProfile = (field: keyof InsertProfile, value: string) => {
    setNewProfile(prev => {
      if (field === 'experience_level') {
        // Parse to number but enforce range (0-15)
        const numValue = parseInt(value);
        if (!isNaN(numValue)) {
          return { ...prev, [field]: Math.min(Math.max(numValue, 0), 15) };
        }
        return { ...prev, [field]: prev.experience_level };
      }
      
      // For nullable fields, convert empty strings to null
      if (['department', 'phone'].includes(field) && value === '') {
        return { ...prev, [field]: null };
      }
      
      return { ...prev, [field]: value };
    });
    
    // Clear error for this field when typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
      <FormField 
        label="Förnamn" 
        value={newProfile.first_name} 
        onChange={(value) => updateProfile('first_name', value)} 
        required 
        disabled={isProcessing}
        error={errors.first_name}
      />
      
      <FormField 
        label="Efternamn" 
        value={newProfile.last_name} 
        onChange={(value) => updateProfile('last_name', value)} 
        required 
        disabled={isProcessing}
        error={errors.last_name}
      />
      
      <FormField 
        label="Yrkesroll" 
        value={newProfile.role} 
        onChange={(value) => updateProfile('role', value)} 
        required 
        disabled={isProcessing}
        error={errors.role}
      />
      
      <FormField 
        label="Avdelning" 
        value={newProfile.department || ''} 
        onChange={(value) => updateProfile('department', value)} 
        disabled={isProcessing}
        error={errors.department}
      />
      
      <FormField 
        label="Telefonnummer" 
        value={newProfile.phone || ''} 
        onChange={(value) => updateProfile('phone', value)} 
        disabled={isProcessing}
        error={errors.phone}
      />
      
      <FormField 
        label="Erfarenhetsnivå (år)" 
        value={newProfile.experience_level} 
        onChange={(value) => updateProfile('experience_level', value)} 
        type="number" 
        min="0" 
        max="15" 
        disabled={isProcessing}
        error={errors.experience_level}
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
