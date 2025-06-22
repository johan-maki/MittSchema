import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicationStatusProps {
  hasPublishedShifts: boolean;
  hasAnyShifts: boolean;
  className?: string;
}

export const PublicationStatus = ({ 
  hasPublishedShifts, 
  hasAnyShifts, 
  className 
}: PublicationStatusProps) => {
  
  if (!hasAnyShifts) {
    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full",
        "bg-gray-100 text-gray-600 border border-gray-200",
        className
      )}>
        <AlertCircle className="w-4 h-4" />
        <span>Inget schema</span>
      </div>
    );
  }

  if (hasPublishedShifts) {
    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full",
        "bg-green-100 text-green-700 border border-green-200",
        className
      )}>
        <CheckCircle2 className="w-4 h-4" />
        <span>Publicerat</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full",
      "bg-amber-100 text-amber-700 border border-amber-200",
      className
    )}>
      <Clock className="w-4 h-4" />
      <span>Utkast</span>
    </div>
  );
};
