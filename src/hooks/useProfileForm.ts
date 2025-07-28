
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
    if (isNaN(expLevel) || expLevel < 1 || expLevel > 5) {
      newErrors.experience_level = "Erfarenhetspoäng måste vara mellan 1 och 5";
    }
    
    // Validate hourly_rate
    if (profile.hourly_rate !== undefined) {
      const hourlyRate = Number(profile.hourly_rate);
      if (isNaN(hourlyRate) || hourlyRate < 0 || hourlyRate > 10000) {
        newErrors.hourly_rate = "Timlön måste vara mellan 0 och 10 000 SEK";
      }
    }
    
    // Validate work_percentage
    if (profile.work_percentage !== undefined) {
      const workPercentage = Number(profile.work_percentage);
      if (isNaN(workPercentage) || workPercentage < 0 || workPercentage > 100) {
        newErrors.work_percentage = "Arbetstid måste vara mellan 0 och 100%";
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
        // Parse to number but enforce range (1-5)
        const numValue = typeof value === 'number' ? value : parseInt(value);
        if (!isNaN(numValue)) {
          return { ...prev, [field]: Math.min(Math.max(numValue, 1), 5) };
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
      
      if (field === 'work_percentage') {
        // Parse to number and validate range (0-100)
        const numValue = typeof value === 'number' ? value : parseInt(value);
        if (!isNaN(numValue)) {
          return { ...prev, [field]: Math.min(Math.max(numValue, 0), 100) };
        }
        return { ...prev, [field]: prev.work_percentage };
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
