
import { Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getShiftTypeInSwedish } from "./previewUtils";

type StaffingIssue = {
  date: string;
  shiftType: string;
  current: number;
  required: number;
};

interface StaffingIssuesDisplayProps {
  dateIssues: StaffingIssue[];
  showAlert?: boolean;
}

export const StaffingIssuesDisplay = ({ dateIssues, showAlert = false }: StaffingIssuesDisplayProps) => {
  if (dateIssues.length === 0) return null;

  return (
    <>
      {showAlert && (
        <Alert className="my-2 bg-amber-50 border-amber-300">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Bemanningsproblem detekterade</AlertTitle>
          <AlertDescription className="text-amber-700">
            Schemat uppfyller inte minimikraven för bemanning. Se detaljer nedan.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="rounded-md bg-amber-50 p-2 border border-amber-200 mb-2">
        <div className="flex items-center text-amber-800 mb-1">
          <Info className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">Bemanningsproblem:</span>
        </div>
        <ul className="text-sm text-amber-700 pl-5 list-disc">
          {dateIssues.map((issue, idx) => (
            <li key={idx}>
              {getShiftTypeInSwedish(issue.shiftType)}: {issue.current} anställda (minimum: {issue.required})
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};
