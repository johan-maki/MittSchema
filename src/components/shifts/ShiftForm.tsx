
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShiftFormData } from "@/types/shift";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { ShiftDateTime } from "./form/ShiftDateTime";
import { ShiftEmployee } from "./form/ShiftEmployee";
import { ShiftDetails } from "./form/ShiftDetails";
import { Profile } from "@/types/profile";

interface ShiftFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<ShiftFormData>;
  editMode?: boolean;
  shiftId?: string;
}

export const ShiftForm = ({ isOpen, onOpenChange, defaultValues, editMode, shiftId }: ShiftFormProps) => {
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
    } catch (error: any) {
      console.error('Error saving shift:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte spara arbetspass",
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
    } catch (error: any) {
      console.error('Error deleting shift:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte ta bort arbetspass",
        variant: "destructive",
      });
    }
  };

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
        <DialogFooter className="gap-2">
          {editMode && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Är du säker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Detta kommer att permanent ta bort arbetspasset från schemat.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Ta bort
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button type="submit" className="bg-[#9b87f5] hover:bg-[#7E69AB]">
            {editMode ? "Spara ändringar" : "Skapa pass"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};
