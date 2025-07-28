
import { useState, useEffect } from "react";
import { ShiftFormData } from "@/types/shift";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UseShiftFormProps {
  defaultValues?: Partial<ShiftFormData>;
  onOpenChange: (open: boolean) => void;
  editMode?: boolean;
  shiftId?: string;
}

export const useShiftForm = ({ 
  defaultValues, 
  onOpenChange, 
  editMode, 
  shiftId 
}: UseShiftFormProps) => {
  const [formData, setFormData] = useState<ShiftFormData>({
    start_time: defaultValues?.start_time || "",
    end_time: defaultValues?.end_time || "",
    shift_type: defaultValues?.shift_type || "day",
    department: defaultValues?.department || "",
    notes: defaultValues?.notes || "",
    employee_id: defaultValues?.employee_id || ""
  });
  
  useEffect(() => {
    if (defaultValues) {
      setFormData(prev => ({
        ...prev,
        ...defaultValues
      }));
    }
  }, [defaultValues]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleFormDataChange = (key: keyof ShiftFormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att hantera arbetspass",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editMode && shiftId) {
        const { error } = await supabase
          .from('shifts')
          .update({
            ...formData,
          })
          .eq('id', shiftId);

        if (error) throw error;

        toast({
          title: "Arbetspass uppdaterat",
          description: "Ändringarna har sparats",
        });
      } else {
        const { error } = await supabase
          .from('shifts')
          .insert([{
            ...formData,
            created_by: user.id
          }]);

        if (error) throw error;

        toast({
          title: "Arbetspass skapat",
          description: "Arbetspasset har lagts till i schemat",
        });
      }

      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
    } catch (error: unknown) {
      console.error('Error saving shift:', error);
      const errorMessage = error instanceof Error ? error.message : "Kunde inte spara arbetspass";
      toast({
        title: "Fel",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!shiftId || !user) return;

    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId);

      if (error) throw error;

      toast({
        title: "Arbetspass borttaget",
        description: "Arbetspasset har tagits bort från schemat",
      });

      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
    } catch (error: unknown) {
      console.error('Error deleting shift:', error);
      const errorMessage = error instanceof Error ? error.message : "Kunde inte ta bort arbetspass";
      toast({
        title: "Fel",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return {
    formData,
    handleFormDataChange,
    handleSubmit,
    handleDelete
  };
};
