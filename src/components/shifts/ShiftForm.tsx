import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShiftFormData, ShiftType } from "@/types/shift";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ShiftFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShiftForm = ({ isOpen, onOpenChange }: ShiftFormProps) => {
  const [formData, setFormData] = useState<ShiftFormData>({
    start_time: "",
    end_time: "",
    shift_type: "day",
    department: "",
    notes: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att skapa pass",
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
        title: "Klart",
        description: "Passet har skapats",
      });

      // Reset form and close dialog
      setFormData({
        start_time: "",
        end_time: "",
        shift_type: "day",
        department: "",
        notes: ""
      });
      onOpenChange(false);

      // Refresh shifts data
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (error: any) {
      console.error('Error creating shift:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa pass. Försök igen.",
        variant: "destructive",
      });
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Lägg till nytt pass</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
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
            Passtyp
          </label>
          <select
            id="shift_type"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={formData.shift_type}
            onChange={(e) => setFormData(prev => ({ ...prev, shift_type: e.target.value as ShiftType }))}
            required
          >
            <option value="day">Dag</option>
            <option value="evening">Kväll</option>
            <option value="night">Natt</option>
          </select>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Anteckningar (Valfritt)
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
          <Button type="submit">Skapa pass</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};
