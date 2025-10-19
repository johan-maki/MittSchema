import { AlertTriangle, Users, Calendar, TrendingUp, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface PartialCoverageWarningProps {
  coverageStats: {
    total_shifts: number;
    filled_shifts: number;
    coverage_percentage: number;
    uncovered_count?: number;
    uncovered_shifts?: Array<{
      date: string;
      day_name: string;
      shift_type: string;
      shift_label: string;
      reasons: string[];
    }>;
    shift_type_coverage?: {
      day: { filled: number; total: number; percentage: number };
      evening: { filled: number; total: number; percentage: number };
      night: { filled: number; total: number; percentage: number };
    };
  };
}

export const PartialCoverageWarning = ({ coverageStats }: PartialCoverageWarningProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const { coverage_percentage, filled_shifts, total_shifts, uncovered_count, uncovered_shifts, shift_type_coverage } = coverageStats;
  
  // Don't show if coverage is 100%
  if (coverage_percentage >= 100) {
    return null;
  }
  
  const getSeverityColor = (percentage: number) => {
    if (percentage >= 90) return { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-800", icon: "text-yellow-600" };
    if (percentage >= 70) return { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-800", icon: "text-orange-600" };
    return { bg: "bg-red-50", border: "border-red-300", text: "text-red-800", icon: "text-red-600" };
  };
  
  const colors = getSeverityColor(coverage_percentage);
  
  return (
    <Card className={`${colors.bg} ${colors.border} border-2 mb-6 overflow-hidden`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${colors.bg} ring-2 ring-${colors.border}`}>
              <AlertTriangle className={`h-6 w-6 ${colors.icon}`} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-lg font-semibold ${colors.text}`}>
                  Partiell schemaläggning - {coverage_percentage}% täckning
                </h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className={colors.text}>
                    {isExpanded ? "Dölj detaljer" : "Visa detaljer"}
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <p className={`text-sm ${colors.text} mb-4`}>
                {filled_shifts} av {total_shifts} arbetspass kunde bemannas. 
                {uncovered_count && ` ${uncovered_count} pass saknar bemanning.`}
              </p>
              
              {/* Coverage by shift type */}
              {shift_type_coverage && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-gray-700">Dagpass</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900">
                        {shift_type_coverage.day.percentage}%
                      </span>
                      <span className="text-xs text-gray-600">
                        ({shift_type_coverage.day.filled}/{shift_type_coverage.day.total})
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-rose-600" />
                      <span className="text-sm font-medium text-gray-700">Kvällspass</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900">
                        {shift_type_coverage.evening.percentage}%
                      </span>
                      <span className="text-xs text-gray-600">
                        ({shift_type_coverage.evening.filled}/{shift_type_coverage.evening.total})
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Nattpass</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900">
                        {shift_type_coverage.night.percentage}%
                      </span>
                      <span className="text-xs text-gray-600">
                        ({shift_type_coverage.night.filled}/{shift_type_coverage.night.total})
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <CollapsibleContent>
            {/* Uncovered shifts details */}
            {uncovered_shifts && uncovered_shifts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Otäckta arbetspass ({uncovered_shifts.length})
                </h4>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {uncovered_shifts.map((shift, index) => (
                    <div key={index} className="bg-white/80 backdrop-blur p-3 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium text-gray-900">{shift.day_name} {shift.date}</span>
                          <Badge 
                            variant="secondary" 
                            className={`ml-2 ${
                              shift.shift_type === 'day' ? 'bg-amber-100 text-amber-700' :
                              shift.shift_type === 'evening' ? 'bg-rose-100 text-rose-700' :
                              'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {shift.shift_label}
                          </Badge>
                        </div>
                      </div>
                      
                      {shift.reasons && shift.reasons.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Orsaker:</span>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            {shift.reasons.map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Recommendations */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Åtgärdsförslag för fullständig täckning
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Anställ fler medarbetare</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Öka personalstyrkan för att täcka fler pass samtidigt
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Justera preferenser</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Be medarbetare att minska antal blockerade pass eller dagar
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Öka arbetsbelastning</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Be deltidsanställda att öka sin arbetsbelastning (work_percentage)
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Manuell bemanning</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Lägg till pass manuellt för att fylla luckor i schemat
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </Card>
  );
};
