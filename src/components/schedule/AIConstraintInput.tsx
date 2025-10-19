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
      high: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, text: 'Hög säkerhet' },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, text: 'Medel säkerhet' },
      low: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Låg säkerhet' },
    };

    const variant = variants[confidence];
    const Icon = variant.icon;

    return (
      <Badge variant="outline" className={`${variant.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {variant.text}
      </Badge>
    );
  };

  const getConstraintTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; color: string }> = {
      'hard_blocked_slot': { label: 'Blockerat pass', color: 'bg-red-100 text-red-800' },
      'preferred_shift': { label: 'Skiftpreferens', color: 'bg-blue-100 text-blue-800' },
      'min_experience': { label: 'Erfarenhetskrav', color: 'bg-purple-100 text-purple-800' },
      'unknown': { label: 'Okänd', color: 'bg-gray-100 text-gray-800' },
    };

    const typeInfo = typeMap[type] || typeMap['unknown'];

    return (
      <Badge variant="outline" className={typeInfo.color}>
        {typeInfo.label}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI-baserad schemajustering
        </CardTitle>
        <CardDescription>
          Skriv dina krav med naturligt språk. Exempel: "Anna ska inte jobba natt 15-17 november"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input area */}
        <div className="space-y-2">
          <Textarea
            placeholder='T.ex: "Erik måste ha ledigt 23:e november" eller "Vi behöver minst 2 erfarna per nattskift nästa vecka"'
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button 
            onClick={handleParse} 
            disabled={!inputText.trim() || isProcessing}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            {isProcessing ? 'Tolkar...' : 'Lägg till krav'}
          </Button>
        </div>

        {/* Examples */}
        {parsedConstraints.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Exempel på krav du kan skriva:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>"Anna ska inte jobba natt 15 november"</li>
                <li>"Erik måste ha ledigt lördag 23:e"</li>
                <li>"Sara vill helst inte jobba kväll nästa måndag"</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Parsed constraints */}
        {parsedConstraints.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Tolkade krav ({parsedConstraints.length})</h3>
            {parsedConstraints.map((constraint, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 space-y-2 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getConstraintTypeBadge(constraint.type)}
                      {getConfidenceBadge(constraint.confidence)}
                      {constraint.isHard !== undefined && (
                        <Badge variant="outline" className={constraint.isHard ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}>
                          {constraint.isHard ? '🔒 Hårt krav' : '💭 Mjukt krav'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium">
                      {formatConstraintDescription(constraint)}
                    </p>
                    {constraint.employee && (
                      <p className="text-xs text-muted-foreground">
                        👤 {constraint.employee}
                      </p>
                    )}
                    {constraint.dates && constraint.dates.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        📅 {constraint.dates.join(', ')}
                      </p>
                    )}
                    {constraint.confidence === 'low' && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Kunde inte tolka kravet helt. Kontrollera att anställdnamn, datum och skifttyp är korrekt.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveConstraint(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Impact visualization placeholder */}
        {parsedConstraints.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-2">Påverkan på schema</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="text-blue-800">
                ℹ️ Schemat kommer att genereras om med dessa krav. 
                Klicka på "Generera schema" för att se påverkan på täckningsgrad och rättvisa.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
