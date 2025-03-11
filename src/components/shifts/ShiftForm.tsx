
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShiftFormData } from "@/types/shift";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/profile";
import { ShiftDateTime } from "./form/ShiftDateTime";
import { ShiftEmployee } from "./form/ShiftEmployee";
import { ShiftDetails } from "./form/ShiftDetails";
import { ShiftFormActions } from "./form/ShiftFormActions";
import { useShiftForm } from "./hooks/useShiftForm";

interface ShiftFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<ShiftFormData>;
  editMode?: boolean;
  shiftId?: string;
}

export const ShiftForm = ({ 
  isOpen, 
  onOpenChange, 
  defaultValues, 
  editMode, 
  shiftId 
}: ShiftFormProps) => {
  const { 
    formData, 
    handleFormDataChange, 
    handleSubmit, 
    handleDelete 
  } = useShiftForm({
    defaultValues,
    onOpenChange,
    editMode,
    shiftId
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) throw error;
      return data as Pick<Profile, 'id' | 'first_name' | 'last_name'>[];
    }
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editMode ? "Redigera arbetspass" : "Lägg till nytt arbetspass"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ShiftEmployee 
          formData={formData}
          employees={employees}
          onChange={handleFormDataChange}
        />
        <ShiftDateTime 
          formData={formData}
          onChange={handleFormDataChange}
        />
        <ShiftDetails 
          formData={formData}
          onChange={handleFormDataChange}
        />
        <ShiftFormActions 
          editMode={editMode}
          onDelete={handleDelete}
          onCancel={() => onOpenChange(false)}
        />
      </form>
    </>
  );
};
