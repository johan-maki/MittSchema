import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, CheckCircle2, XCircle, AlertCircle, Trash2, Sparkles } from 'lucide-react';
import { schedulerApi } from '@/api/schedulerApi';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  full_name?: string;
}

interface ParsedConstraint {
  employee_id?: string;
  employee_name?: string;
  dates: string[];
  shifts: string[];
  is_hard: boolean;
  confidence: string;
  constraint_type: string;
  original_text: string;
  reason?: string;
}

interface AIConstraintInputProps {
  employees: Employee[];
  onConstraintsChange?: (constraints: ParsedConstraint[]) => void;
}

export function AIConstraintInput({ employees, onConstraintsChange }: AIConstraintInputProps) {
  const [inputText, setInputText] = useState('');
  const [parsedConstraints, setParsedConstraints] = useState<ParsedConstraint[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await schedulerApi.parseAIConstraint(inputText);
      
      if (result.success && result.constraint) {
        // Generate all dates in the range
        const dates: string[] = [];
        if (result.constraint.start_date && result.constraint.end_date) {
          const start = new Date(result.constraint.start_date);
          const end = new Date(result.constraint.end_date);
          
          // Generate all dates between start and end (inclusive)
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split('T')[0]);
          }
        }
        
        // Map the API response to the expected format
        const mappedConstraint: ParsedConstraint = {
          employee_id: result.constraint.employee_id,
          employee_name: result.constraint.employee_name,
          dates: dates,
          shifts: result.constraint.shift_type ? [result.constraint.shift_type] : [],
          is_hard: result.constraint.is_hard,
          confidence: result.constraint.confidence || 'medium',
          constraint_type: result.constraint.constraint_type,
          original_text: inputText,
          reason: result.constraint.reason
        };

        const newConstraints = [...parsedConstraints, mappedConstraint];
        setParsedConstraints(newConstraints);
        setInputText('');

        if (onConstraintsChange) {
          onConstraintsChange(newConstraints);
        }
      } else {
        setError(result.message || 'Kunde inte tolka begränsningen');
      }
    } catch (err: any) {
      console.error('Error parsing constraint:', err);
      setError(err.message || 'Fel vid tolkning av begränsning');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveConstraint = (index: number) => {
    const updated = parsedConstraints.filter((_, i) => i !== index);
    setParsedConstraints(updated);
    
    if (onConstraintsChange) {
      onConstraintsChange(updated);
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, { color: string, icon: typeof CheckCircle2, text: string }> = {
      high: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2, text: 'Hög säkerhet' },
      medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle, text: 'Medel säkerhet' },
      low: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, text: 'Låg säkerhet' }
    };

    const variant = variants[confidence] || variants.medium;
    const Icon = variant.icon;

    return (
      <Badge variant="outline" className={`${variant.color} border flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {variant.text}
      </Badge>
    );
  };

  const getTypeText = (isHard: boolean) => {
    return isHard ? '🔒 Hård begränsning' : '💡 Mjuk preferens';
  };

  const formatShifts = (shifts: string[]) => {
    const shiftNames: Record<string, string> = {
      day: 'Dag',
      evening: 'Kväll',
      night: 'Natt',
      all_day: 'Hela dagen'
    };
    return shifts.map(s => shiftNames[s] || s).join(', ');
  };

  const formatConstraintDescription = (constraint: ParsedConstraint) => {
    const employeeName = constraint.employee_name || 'Okänd anställd';
    const action = constraint.is_hard ? 'kan inte jobba' : 'föredrar att inte jobba';
    const shifts = formatShifts(constraint.shifts);
    const dates = constraint.dates.join(', ');
    
    return `${employeeName} ${action} ${shifts} den ${dates}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <CardTitle>AI Schema-begränsningar</CardTitle>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            GPT-4o Aktiverad
          </Badge>
        </div>
        <CardDescription>
          Skriv schema-begränsningar på svenska. AI:n kommer att tolka dem automatiskt.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Exempel: 'Charlotte ska inte jobba natt 15 november' eller 'Erik är ledig 20-25 december'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[80px]"
            disabled={isProcessing}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleParse}
              disabled={!inputText.trim() || isProcessing}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              {isProcessing ? 'Tolkar...' : 'Tolka med AI'}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium">Exempel på begränsningar:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>"Charlotte ska inte jobba natt 15 november"</li>
            <li>"Erik är ledig hela veckan 20-27 december"</li>
            <li>"Anna föredrar att inte jobba kvällar nästa måndag"</li>
            <li>"Johan måste vara ledig 10 januari"</li>
          </ul>
        </div>

        {parsedConstraints.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                Tolkade begränsningar ({parsedConstraints.length})
              </h4>
            </div>

            <div className="space-y-2">
              {parsedConstraints.map((constraint, index) => (
                <Card key={index} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getConfidenceBadge(constraint.confidence)}
                          <Badge variant="outline">
                            {getTypeText(constraint.is_hard)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm font-medium">
                          {formatConstraintDescription(constraint)}
                        </p>
                        
                        {constraint.reason && (
                          <p className="text-xs text-muted-foreground italic">
                            💬 {constraint.reason}
                          </p>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          Original: "{constraint.original_text}"
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveConstraint(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
