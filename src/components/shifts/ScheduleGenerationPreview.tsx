
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [error, setError] = useState<string | null>(null);
  
  // Reset error state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);
  
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
      setError(null);
      console.log("Applying schedule with", generatedShifts.length, "shifts");
      await onApply();
    } catch (err) {
      console.error("Error applying schedule:", err);
      setError(err instanceof Error ? err.message : "Ett fel uppstod när schemat skulle appliceras");
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

  // Group shifts by date for better display
  const shiftsByDate = sortedShifts.reduce<Record<string, typeof sortedShifts>>((acc, shift) => {
    const dateKey = format(new Date(shift.start_time), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(shift);
    return acc;
  }, {});

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
        
        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="max-h-[60vh] overflow-y-auto space-y-4">
          {Object.entries(shiftsByDate).map(([date, shifts]) => (
            <div key={date} className="space-y-2">
              <h3 className="font-semibold text-md border-b pb-1">{format(new Date(date), 'EEEE d MMMM', { locale: sv })}</h3>
              <div className="grid gap-2">
                {shifts.map((shift) => {
                  const employee = profiles.find(p => p.id === shift.employee_id);
                  return (
                    <Card key={`${shift.employee_id}-${shift.start_time}`} className="p-3 flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {getShiftTypeInSwedish(shift.shift_type)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-medium">
                          {employee ? `${employee.first_name} ${employee.last_name}` : "Okänd anställd"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {employee?.role || "Ingen roll"}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="sm:justify-between mt-4">
          <Button variant="outline" onClick={onCancel} disabled={isApplying}>
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
