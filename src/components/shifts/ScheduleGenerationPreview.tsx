
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSchedulePreview } from "./preview/useSchedulePreview";
import { DateShiftGroup } from "./preview/DateShiftGroup";
import { StaffingIssuesDisplay } from "./preview/StaffingIssuesDisplay";
import type { Shift } from "@/types/shift";
import type { Profile } from "@/types/profile";

interface ScheduleGenerationPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generatedShifts: Shift[];
  profiles: Profile[];
  onApply: () => Promise<void>;
  onCancel: () => void;
  staffingIssues?: { date: string; shiftType: string; current: number; required: number }[];
}

export const ScheduleGenerationPreview = ({
  open,
  onOpenChange,
  generatedShifts,
  profiles,
  onApply,
  onCancel,
  staffingIssues = []
}: ScheduleGenerationPreviewProps) => {
  const {
    isApplying,
    error,
    handleApply,
    shiftsByDate
  } = useSchedulePreview(open, generatedShifts, onApply);
  
  // Check if there are any staffing issues
  const hasStaffingIssues = staffingIssues.length > 0;

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
        
        {hasStaffingIssues && (
          <StaffingIssuesDisplay 
            dateIssues={staffingIssues} 
            showAlert={true} 
          />
        )}
        
        <div className="max-h-[60vh] overflow-y-auto space-y-4">
          {Object.entries(shiftsByDate).length > 0 ? (
            Object.entries(shiftsByDate).map(([date, shifts]) => (
              <DateShiftGroup 
                key={date}
                date={date}
                shifts={shifts}
                profiles={profiles}
                staffingIssues={staffingIssues}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Inget schema kunde genereras. Kontrollera bemanningsinställningarna och tillgängliga anställda.
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between mt-4">
          <Button variant="outline" onClick={onCancel} disabled={isApplying}>
            <X className="mr-2 h-4 w-4" />
            Avbryt
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={isApplying || generatedShifts.length === 0}
          >
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
