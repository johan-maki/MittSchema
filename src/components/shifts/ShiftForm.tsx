
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
        title: "Error",
        description: "You must be logged in to create shifts",
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
        title: "Success",
        description: "Shift has been created successfully",
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
        title: "Error",
        description: error.message || "Failed to create shift. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add New Shift</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Department
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
            Start Time
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
            End Time
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
            Shift Type
          </label>
          <select
            id="shift_type"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={formData.shift_type}
            onChange={(e) => setFormData(prev => ({ ...prev, shift_type: e.target.value as ShiftType }))}
            required
          >
            <option value="day">Day</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
          </select>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <Input
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Create Shift</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};
