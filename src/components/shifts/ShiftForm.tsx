
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShiftFormData, ShiftType, Shift } from "@/types/shift";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmployeeSelect } from "./form/EmployeeSelect";
import { ShiftTypeSelect } from "./form/ShiftTypeSelect";
import { TimeInputs } from "./form/TimeInputs";

interface ShiftFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<Shift>;
}

export const ShiftForm = ({ isOpen, onOpenChange, defaultValues }: ShiftFormProps) => {
  const [formData, setFormData] = useState<ShiftFormData & { employee_id?: string }>({
    start_time: defaultValues?.start_time || "",
    end_time: defaultValues?.end_time || "",
    shift_type: defaultValues?.shift_type || "day",
    department: defaultValues?.department || "",
    notes: defaultValues?.notes || "",
    employee_id: defaultValues?.employee_id || ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (defaultValues) {
      setFormData({
        start_time: defaultValues.start_time || "",
        end_time: defaultValues.end_time || "",
        shift_type: defaultValues.shift_type || "day",
        department: defaultValues.department || "",
        notes: defaultValues.notes || "",
        employee_id: defaultValues.employee_id || ""
      });
    }
  }, [defaultValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att skapa arbetspass",
        variant: "destructive",
      });
      return;
    }

    try {
      if (defaultValues?.id) {
        const { error } = await supabase
          .from('shifts')
          .update({
            ...formData,
            created_by: user.id
          })
          .eq('id', defaultValues.id);

        if (error) throw error;

        toast({
          title: "Arbetspass uppdaterat",
          description: "Arbetspasset har uppdaterats i schemat",
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

      setFormData({
        start_time: "",
        end_time: "",
        shift_type: "day",
        department: "",
        notes: "",
        employee_id: ""
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (error: any) {
      console.error('Error saving shift:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte spara arbetspass. Försök igen.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {defaultValues?.id ? "Redigera arbetspass" : "Lägg till nytt arbetspass"}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <EmployeeSelect
          value={formData.employee_id || ""}
          onChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}
        />
        
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Avdelning
          </label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
            required
          />
        </div>

        <TimeInputs
          startTime={formData.start_time}
          endTime={formData.end_time}
          onStartTimeChange={(value) => setFormData(prev => ({ ...prev, start_time: value }))}
          onEndTimeChange={(value) => setFormData(prev => ({ ...prev, end_time: value }))}
        />

        <ShiftTypeSelect
          value={formData.shift_type}
          onChange={(value) => setFormData(prev => ({ ...prev, shift_type: value }))}
        />

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Anteckningar
          </label>
          <Input
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button type="submit" className="bg-[#9b87f5] hover:bg-[#7E69AB]">
            {defaultValues?.id ? "Uppdatera pass" : "Skapa pass"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};
