
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, AlertTriangle, List, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSchedulePreview } from "./preview/useSchedulePreview";
import { DateShiftGroup } from "./preview/DateShiftGroup";
import { StaffingIssuesDisplay } from "./preview/StaffingIssuesDisplay";
import { ScheduleCalendarView } from "./preview/ScheduleCalendarView";
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
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
      <DialogContent className="max-w-4xl flex flex-col max-h-[90vh]">
        <DialogHeader className="pb-2">
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
        
        <Tabs defaultValue="calendar" className="w-full flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="calendar" onClick={() => setViewMode('calendar')}>
              <Calendar className="h-4 w-4 mr-2" />
              Kalendervy
            </TabsTrigger>
            <TabsTrigger value="list" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4 mr-2" />
              Listvy
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(60vh-120px)]">
              {generatedShifts.length > 0 ? (
                <ScheduleCalendarView 
                  shifts={generatedShifts}
                  profiles={profiles}
                  staffingIssues={staffingIssues}
                  currentDate={generatedShifts.length > 0 ? new Date(generatedShifts[0].start_time) : new Date()}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Inget schema kunde genereras. Kontrollera bemanningsinställningarna och tillgängliga anställda.
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="list" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(60vh-120px)]">
              {Object.entries(shiftsByDate).length > 0 ? (
                <div className="space-y-4 p-1">
                  {Object.entries(shiftsByDate).map(([date, shifts]) => (
                    <DateShiftGroup 
                      key={date}
                      date={date}
                      shifts={shifts}
                      profiles={profiles}
                      staffingIssues={staffingIssues}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Inget schema kunde genereras. Kontrollera bemanningsinställningarna och tillgängliga anställda.
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-between mt-4 border-t pt-4">
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
