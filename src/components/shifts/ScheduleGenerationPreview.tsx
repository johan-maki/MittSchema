
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { MonthlySchedule } from "./MonthlySchedule";
import type { Shift } from "@/types/shift";
import type { Profile } from "@/types/profile";

interface ScheduleGenerationPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generatedShifts: Shift[];
  profiles: Profile[];
  onApply: () => Promise<void>;
  onCancel: () => void;
}

export const ScheduleGenerationPreview = ({
  open,
  onOpenChange,
  generatedShifts,
  profiles,
  onApply,
  onCancel
}: ScheduleGenerationPreviewProps) => {
  // Add profiles information to shifts
  const shiftsWithProfiles = generatedShifts.map(shift => ({
    ...shift,
    profiles: profiles.find(p => p.id === shift.employee_id) 
      ? {
          first_name: profiles.find(p => p.id === shift.employee_id)!.first_name,
          last_name: profiles.find(p => p.id === shift.employee_id)!.last_name,
        }
      : { first_name: '', last_name: '' }
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl">
        <DialogHeader>
          <DialogTitle>Förhandsgranska genererat schema</DialogTitle>
          <DialogDescription>
            Granska det genererade schemat innan du applicerar det.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[70vh] overflow-auto">
          <MonthlySchedule 
            date={new Date()} 
            shifts={shiftsWithProfiles} 
            profiles={profiles}
          />
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="destructive" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Avbryt
          </Button>
          <Button onClick={onApply}>
            <Check className="mr-2 h-4 w-4" />
            Applicera schema
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
