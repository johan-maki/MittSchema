
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { format } from "date-fns";
import { Shift } from "@/types/shift";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Förhandsgranska genererat schema</DialogTitle>
          <DialogDescription>
            Granska det genererade schemat innan du applicerar det.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {generatedShifts.map((shift, index) => {
              const employee = profiles.find(p => p.id === shift.employee_id);
              return (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold">
                          {format(new Date(shift.start_time), 'yyyy-MM-dd')}
                        </p>
                        <p>
                          {format(new Date(shift.start_time), 'HH:mm')} - 
                          {format(new Date(shift.end_time), 'HH:mm')}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">
                          {employee ? `${employee.first_name} ${employee.last_name}` : 'Ingen tilldelad'}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {shift.shift_type === 'day' ? 'Dagpass' : 
                           shift.shift_type === 'evening' ? 'Kvällspass' : 'Nattpass'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
