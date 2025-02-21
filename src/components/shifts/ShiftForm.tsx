
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShiftFormData, ShiftType } from "@/types/shift";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) throw error;
      return data;
    }
  });

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
      const { data, error } = await supabase
        .from('shifts')
        .insert([{
          ...formData,
          created_by: user.id
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Arbetspass skapat",
        description: "Arbetspasset har lagts till i schemat",
      });

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
      console.error('Error creating shift:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa arbetspass. Försök igen.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Lägg till nytt arbetspass</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
            Anställd
          </label>
          <Select
            value={formData.employee_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Välj anställd" />
            </SelectTrigger>
            <SelectContent>
              {employees?.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <div>
          <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
            Starttid
          </label>
          <Input
            id="start_time"
            type="datetime-local"
            value={formData.start_time}
            onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
            required
          />
        </div>
        <div>
          <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
            Sluttid
          </label>
          <Input
            id="end_time"
            type="datetime-local"
            value={formData.end_time}
            onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
            required
          />
        </div>
        <div>
          <label htmlFor="shift_type" className="block text-sm font-medium text-gray-700 mb-1">
            Typ av pass
          </label>
          <Select
            value={formData.shift_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, shift_type: value as ShiftType }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dag</SelectItem>
              <SelectItem value="evening">Kväll</SelectItem>
              <SelectItem value="night">Natt</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
            Skapa pass
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};
