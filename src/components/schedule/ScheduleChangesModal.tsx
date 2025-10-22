import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { Shift } from "@/types/shift";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface ShiftChange {
  employeeName: string;
  date: string;
  oldShift: string;
  newShift: string | null; // null means shift was removed
}

interface ScheduleChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  changes: ShiftChange[];
  unchangedCount: number;
  totalChangedEmployees: number;
}

const getShiftLabel = (shiftType: string): string => {
  const labels: Record<string, string> = {
    'day': 'Dag',
    'evening': 'Kväll',
    'night': 'Natt'
  };
  return labels[shiftType] || shiftType;
};

export const ScheduleChangesModal = ({
  isOpen,
  onClose,
  onAccept,
  changes,
  unchangedCount,
  totalChangedEmployees
}: ScheduleChangesModalProps) => {
  const hasChanges = changes.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            📋 Schema-ändringar
          </DialogTitle>
          <DialogDescription>
            Granska ändringar i det publicerade schemat innan du accepterar
          </DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Oförändrade pass
              </span>
            </div>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">
              {unchangedCount}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-900 dark:text-red-100">
                Ändrade pass
              </span>
            </div>
            <div className="text-3xl font-bold text-red-700 dark:text-red-300">
              {changes.length}
            </div>
            {totalChangedEmployees > 0 && (
              <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                {totalChangedEmployees} {totalChangedEmployees === 1 ? 'anställd berörd' : 'anställda berörda'}
              </div>
            )}
          </div>
        </div>

        {/* Warning Alert if there are changes */}
        {hasChanges && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>VIKTIGT!</strong> Följande {changes.length} pass har ändrats. 
              Du måste kommunicera dessa ändringar till de berörda medarbetarna.
            </AlertDescription>
          </Alert>
        )}

        {/* Changed Shifts List */}
        {hasChanges ? (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Ändrade pass som kräver kommunikation:
            </h3>
            
            <div className="space-y-2 border rounded-lg p-3 bg-red-50 dark:bg-red-900/10">
              {changes.map((change, index) => (
                <div 
                  key={index} 
                  className="bg-white dark:bg-gray-800 border-l-4 border-red-500 rounded p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {change.employeeName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {change.date}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Gammalt pass:
                        </div>
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                          {change.oldShift}
                        </div>
                      </div>
                      <div className="text-2xl text-red-500">→</div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Nytt pass:
                        </div>
                        <div className="font-bold text-red-600 dark:text-red-400">
                          {change.newShift || 'BORTTAGET'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-500">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              Inga befintliga pass har ändrats! Endast nya pass har lagts till för att täcka luckor.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Avbryt
          </Button>
          <Button
            onClick={onAccept}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {hasChanges 
              ? `Acceptera och kommunicera till ${totalChangedEmployees} ${totalChangedEmployees === 1 ? 'anställd' : 'anställda'}`
              : 'Acceptera schema'
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
