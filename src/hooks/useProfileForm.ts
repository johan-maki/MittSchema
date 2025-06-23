
import { useState, FormEvent } from "react";
import { InsertProfile } from "@/types/profile";

interface UseProfileFormProps {
  initialProfile: InsertProfile;
  onSubmit: (e: FormEvent) => Promise<void>;
  isProcessing: boolean;
}

export const useProfileForm = ({ 
  initialProfile, 
  onSubmit, 
  isProcessing 
}: UseProfileFormProps) => {
  const [profile, setProfile] = useState<InsertProfile>(initialProfile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!profile.first_name.trim()) {
      newErrors.first_name = "Förnamn krävs";
    }
    
    if (!profile.last_name.trim()) {
      newErrors.last_name = "Efternamn krävs";
    }
    
    if (!profile.role.trim()) {
      newErrors.role = "Yrkesroll krävs";
    }
    
    const expLevel = Number(profile.experience_level);
    if (isNaN(expLevel) || expLevel < 0 || expLevel > 10) {
      newErrors.experience_level = "Erfarenhetsnivå måste vara mellan 0 och 10 år";
    }
    
    // Validate hourly_rate
    if (profile.hourly_rate !== undefined) {
      const hourlyRate = Number(profile.hourly_rate);
      if (isNaN(hourlyRate) || hourlyRate < 0 || hourlyRate > 10000) {
        newErrors.hourly_rate = "Timlön måste vara mellan 0 och 10 000 SEK";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: FormEvent) => {
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

  const updateProfile = (field: keyof InsertProfile, value: string | number) => {
    setProfile(prev => {
      if (field === 'experience_level') {
        // Parse to number but enforce range (0-10)
        const numValue = typeof value === 'number' ? value : parseInt(value);
        if (!isNaN(numValue)) {
          return { ...prev, [field]: Math.min(Math.max(numValue, 0), 10) };
        }
        return { ...prev, [field]: prev.experience_level };
      }
      
      if (field === 'hourly_rate') {
        // Parse to number and validate range
        const numValue = typeof value === 'number' ? value : parseFloat(value as string);
        if (!isNaN(numValue)) {
          return { ...prev, [field]: Math.min(Math.max(numValue, 0), 10000) };
        }
        return { ...prev, [field]: prev.hourly_rate };
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

  return {
    profile,
    setProfile,
    errors,
    updateProfile,
    handleFormSubmit
  };
};
