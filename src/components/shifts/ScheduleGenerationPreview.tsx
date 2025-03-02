
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { useState } from "react";
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
  const [isApplying, setIsApplying] = useState(false);
  
  const getShiftTypeInSwedish = (type: string) => {
    switch (type) {
      case 'day':
        return 'Dagpass';
      case 'evening':
        return 'Kvällspass';
      case 'night':
        return 'Nattpass';
      default:
        return type;
    }
  };
  
  const handleApply = async () => {
    try {
      setIsApplying(true);
      await onApply();
    } finally {
      setIsApplying(false);
    }
  };

  // Sort shifts by date and shift type for better organization
  const sortedShifts = [...generatedShifts].sort((a, b) => {
    // First sort by date
    const dateComparison = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    if (dateComparison !== 0) return dateComparison;
    
    // Then by shift type (day, evening, night)
    const shiftTypeOrder = { day: 1, evening: 2, night: 3 };
    return (shiftTypeOrder[a.shift_type as keyof typeof shiftTypeOrder] || 0) - 
           (shiftTypeOrder[b.shift_type as keyof typeof shiftTypeOrder] || 0);
  });

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Prevent dialog from closing during the apply operation
      if (isApplying && !newOpen) return;
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Förhandsgranska genererat schema</DialogTitle>
          <DialogDescription>
            Granska det genererade schemat innan du applicerar det.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {sortedShifts.map((shift) => {
            const employee = profiles.find(p => p.id === shift.employee_id);
            return (
              <Card key={`${shift.employee_id}-${shift.start_time}`} className="p-4 flex justify-between items-center">
                <div>
                  <div className="text-base font-medium">
                    {format(new Date(shift.start_time), 'yyyy-MM-dd', { locale: sv })}
                  </div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-medium">
                    {employee?.first_name} {employee?.last_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getShiftTypeInSwedish(shift.shift_type)}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="destructive" onClick={onCancel} disabled={isApplying}>
            <X className="mr-2 h-4 w-4" />
            Avbryt
          </Button>
          <Button onClick={handleApply} disabled={isApplying}>
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applicerar...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Applicera schema
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
