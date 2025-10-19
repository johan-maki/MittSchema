import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, CheckCircle2, XCircle, AlertCircle, Trash2, Plus } from 'lucide-react';
import { parseConstraint, formatConstraintDescription, type ParsedConstraint } from "@/utils/constraintParser";

interface AIConstraintInputProps {
  employees: Array<{ id: string; first_name: string; last_name: string }>;
  onConstraintsChange?: (constraints: ParsedConstraint[]) => void;
}

export function AIConstraintInput({ employees, onConstraintsChange }: AIConstraintInputProps) {
  const [inputText, setInputText] = useState('');
  const [parsedConstraints, setParsedConstraints] = useState<ParsedConstraint[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleParse = () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    
    // Simulate small delay for UX
    setTimeout(() => {
      const parsed = parseConstraint(inputText, employees);
      setParsedConstraints(prev => [...prev, parsed]);
      setInputText('');
      setIsProcessing(false);

      if (onConstraintsChange) {
        onConstraintsChange([...parsedConstraints, parsed]);
      }
    }, 300);
  };

  const handleRemoveConstraint = (index: number) => {
    const updated = parsedConstraints.filter((_, i) => i !== index);
    setParsedConstraints(updated);
    
    if (onConstraintsChange) {
      onConstraintsChange(updated);
    }
  };

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    const variants = {
      high: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2, text: 'Hög' },
      medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle, text: 'Medel' },
      low: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, text: 'Låg' },
    };

    const variant = variants[confidence];
    const Icon = variant.icon;

    return (
      <Badge variant="outline" className={`${variant.color} gap-1 text-xs border`}>
        <Icon className="h-3 w-3" />
        {variant.text}
      </Badge>
    );
  };

  const getConstraintTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; color: string }> = {
      'hard_blocked_slot': { label: 'Blockerad', color: 'bg-red-50 text-red-700 border-red-200' },
      'preferred_shift': { label: 'Preferens', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      'min_experience': { label: 'Erfarenhet', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      'unknown': { label: 'Okänd', color: 'bg-gray-50 text-gray-700 border-gray-200' },
    };

    const typeInfo = typeMap[type] || typeMap['unknown'];

    return (
      <Badge variant="outline" className={`${typeInfo.color} text-xs border`}>
        {typeInfo.label}
      </Badge>
    );
  };

  return (
    <Card className="w-full border-purple-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle className="text-lg">AI-baserade schemavillkor</CardTitle>
              <CardDescription className="text-sm">
                Lägg till extra krav som Gurobi ska ta hänsyn till vid nästa optimering
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input area */}
        <div className="space-y-2">
          <Textarea
            placeholder='T.ex: "Anna ska inte jobba natt 15-17 november" eller "Erik måste ha ledigt 23:e"'
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={2}
            className="resize-none text-sm"
          />
          <Button 
            onClick={handleParse} 
            disabled={!inputText.trim() || isProcessing}
            className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            {isProcessing ? 'Tolkar...' : 'Lägg till villkor'}
          </Button>
        </div>

        {/* Examples */}
        {parsedConstraints.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-medium text-sm mb-2 text-blue-900">💡 Exempel på villkor:</p>
            <ul className="text-xs space-y-1 list-disc list-inside text-blue-800">
              <li>"Anna ska inte jobba natt 15 november"</li>
              <li>"Erik måste ha ledigt lördag 23:e"</li>
              <li>"Sara vill helst inte jobba kväll nästa måndag"</li>
            </ul>
          </div>
        )}

        {/* Parsed constraints */}
        {parsedConstraints.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-purple-900">
                Aktiva villkor ({parsedConstraints.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Dessa tillämpas vid nästa schemagenering
              </p>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {parsedConstraints.map((constraint, index) => (
                <div
                  key={index}
                  className="border border-purple-100 rounded-md p-2 bg-white hover:bg-purple-50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        {getConstraintTypeBadge(constraint.type)}
                        {getConfidenceBadge(constraint.confidence)}
                        {constraint.isHard !== undefined && (
                          <Badge variant="outline" className={`text-xs ${constraint.isHard ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                            {constraint.isHard ? '🔒 Hårt' : '💭 Mjukt'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-medium">
                        {formatConstraintDescription(constraint)}
                      </p>
                      {constraint.confidence === 'low' && (
                        <p className="text-xs text-red-600">
                          ⚠️ Kontrollera att namn, datum och skifttyp är korrekt
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveConstraint(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact visualization placeholder */}
        {parsedConstraints.length > 0 && (
          <div className="border-t pt-3">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-900 font-medium">
                ℹ️ {parsedConstraints.length} villkor kommer tillämpas vid nästa optimering
              </p>
              <p className="text-xs text-purple-700 mt-1">
                Klicka på "Generera schema (nästa månad)" för att optimera med dessa villkor
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
