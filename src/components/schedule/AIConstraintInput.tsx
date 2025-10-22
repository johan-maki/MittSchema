import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, CheckCircle2, XCircle, AlertCircle, Trash2, Sparkles, Play, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { schedulerApi } from '@/api/schedulerApi';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  full_name?: string;
}

interface DatabaseConstraint {
  id: string;
  employee_id?: string;
  // employee_name is NOT stored in database - must be resolved from employee_id
  dates: string[]; // Array of dates from new schema
  shifts: string[]; // Array of shift types from new schema
  constraint_type: string;
  priority: number;
  original_text: string;
}

interface ParsedConstraint {
  id?: string; // Database ID for deletion
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
  onGenerateSchedule?: () => void;
  isGenerating?: boolean;
  previousOptimizationScore?: number;
  currentOptimizationScore?: number;
}

export function AIConstraintInput({ 
  employees, 
  onConstraintsChange,
  onGenerateSchedule,
  isGenerating = false,
  previousOptimizationScore,
  currentOptimizationScore
}: AIConstraintInputProps) {
  const [inputText, setInputText] = useState('');
  const [parsedConstraints, setParsedConstraints] = useState<ParsedConstraint[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false); // 🔧 Prevent infinite loop
  
  // Clarification state
  const [clarificationMode, setClarificationMode] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [clarificationOptions, setClarificationOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [pendingConstraintText, setPendingConstraintText] = useState('');

  // 📥 LOAD SAVED CONSTRAINTS FROM SUPABASE on component mount
  useEffect(() => {
    // 🔧 CRITICAL FIX: Only load once to prevent infinite loop
    if (hasLoadedOnce || employees.length === 0) {
      return;
    }
    
    loadSavedConstraints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees.length]); // Only depend on employee count, not the array itself
  
  // Extracted loading function so it can be called manually
  const loadSavedConstraints = async () => {
    console.log('📥 Loading saved AI constraints from Supabase...');
    setIsLoading(true);
    
    try {
      const result = await schedulerApi.loadAIConstraints('Akutmottagning');
      
      if (result.success && result.constraints) {
        console.log(`✅ Loaded ${result.constraints.length} constraints from Supabase`);
        
        // Convert database constraints to ParsedConstraint format
        const loadedConstraints: ParsedConstraint[] = result.constraints.map((dbConstraint: unknown) => {
          const constraint = dbConstraint as DatabaseConstraint; // Type assertion for database row
          
          // 🔧 CRITICAL FIX: Resolve employee_name from employee_id
          let employeeName = 'Okänd anställd';
          if (constraint.employee_id) {
            const matchedEmployee = employees.find(emp => emp.id === constraint.employee_id);
            if (matchedEmployee) {
              employeeName = `${matchedEmployee.first_name} ${matchedEmployee.last_name}`;
              console.log(`✅ Resolved employee: ${constraint.employee_id} → ${employeeName}`);
            } else {
              console.warn(`⚠️ No employee found for constraint with employee_id: "${constraint.employee_id}"`);
            }
          }
          
          // Dates are already in array format from new schema
          const dates = constraint.dates || [];
          
          // Convert constraint_type and priority to is_hard and confidence
          const is_hard = constraint.constraint_type === 'hard_unavailable' || constraint.constraint_type === 'hard_required';
          const confidence = constraint.priority >= 1000 ? 'high' : 'medium';
          
          return {
            id: constraint.id,
            employee_id: constraint.employee_id,
            employee_name: employeeName, // Use resolved employee name
            dates: dates,
            shifts: constraint.shifts || [],
            is_hard: is_hard,
            confidence: confidence,
            constraint_type: constraint.constraint_type,
            original_text: constraint.original_text,
            reason: undefined // Not stored in database
          };
        });
        
        setParsedConstraints(loadedConstraints);
        setHasLoadedOnce(true); // Mark as loaded
        
        if (onConstraintsChange) {
          onConstraintsChange(loadedConstraints);
        }
      } else {
        console.log('ℹ️ No saved constraints found or error:', result.error);
        setHasLoadedOnce(true); // Mark as loaded even if empty
      }
    } catch (err) {
      console.error('❌ Error loading constraints:', err);
      setHasLoadedOnce(true); // Mark as loaded even on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleParse = async (selectedEmployeeId?: string) => {
    const textToParse = selectedEmployeeId ? pendingConstraintText : inputText;
    
    if (!textToParse.trim()) return;

    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await schedulerApi.parseAIConstraint(textToParse, 'Akutmottagning', selectedEmployeeId);
      
      console.log('🔍 DEBUG: Edge Function response:', result);
      
      // Handle clarification mode
      if (result.success && result.mode === 'clarify') {
        console.log('❓ Clarification needed:', result.question);
        setClarificationMode(true);
        setClarificationQuestion(result.question || 'Vem menar du?');
        setClarificationOptions(result.options || []);
        setPendingConstraintText(textToParse);
        setIsProcessing(false);
        return;
      }
      
      // Handle successful parsing
      if (result.success && result.constraint) {
        console.log('🔍 DEBUG: Parsed constraint:', result.constraint);
        
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
        
        // 💾 SAVE TO SUPABASE - This is the critical fix!
        console.log('💾 Saving AI constraint to Supabase...');
        
        // 🔧 CRITICAL FIX: Resolve employee name to ID before saving
        const employeeName = result.constraint.employee_name || '';
        
        if (!employeeName) {
          console.error('❌ Edge Function returned empty employee_name');
          console.error('Full constraint data:', result.constraint);
          setError('AI kunde inte identifiera en anställd i texten. Försök med: "Charlotte kan inte jobba lördag 1a november"');
          return;
        }
        
        const matchedEmployee = employees.find(emp => 
          emp.first_name?.toLowerCase() === employeeName.toLowerCase() ||
          `${emp.first_name} ${emp.last_name}`.toLowerCase() === employeeName.toLowerCase()
        );
        
        if (!matchedEmployee) {
          console.error(`❌ Could not find employee: "${employeeName}"`);
          console.error('Available employees:', employees.map(e => `${e.first_name} ${e.last_name}`));
          setError(`Kunde inte hitta anställd: "${employeeName}". Tillgängliga anställda: ${employees.map(e => e.first_name).join(', ')}`);
          return;
        }
        
        console.log(`✅ Resolved employee: ${employeeName} → ${matchedEmployee.id}`);
        
        const saveResult = await schedulerApi.saveAIConstraint({
          employee_name: result.constraint.employee_name,
          employee_id: matchedEmployee.id, // Use resolved employee ID
          constraint_type: result.constraint.constraint_type,
          shift_type: result.constraint.shift_type,
          start_date: result.constraint.start_date,
          end_date: result.constraint.end_date,
          is_hard: result.constraint.is_hard,
          confidence: result.constraint.confidence || 'medium',
          original_text: textToParse, // Use textToParse instead of inputText
          department: 'Akutmottagning'
        });

        if (!saveResult.success) {
          console.error('❌ Failed to save constraint to Supabase:', saveResult.error);
          setError('Kravet tolkades men kunde inte sparas. Försök igen.');
          return;
        }

        console.log('✅ Constraint saved to Supabase with ID:', saveResult.data?.id);
        
        // Map the API response to the expected format (including database ID)
        const mappedConstraint: ParsedConstraint = {
          id: saveResult.data?.id, // Include database ID for deletion
          employee_id: matchedEmployee.id, // Use resolved employee ID
          employee_name: `${matchedEmployee.first_name} ${matchedEmployee.last_name}`,
          dates: dates,
          shifts: result.constraint.shift_type ? [result.constraint.shift_type] : [],
          is_hard: result.constraint.is_hard,
          confidence: result.constraint.confidence || 'medium',
          constraint_type: result.constraint.constraint_type,
          original_text: textToParse, // Use textToParse instead of inputText
          reason: result.constraint.reason
        };

        const newConstraints = [...parsedConstraints, mappedConstraint];
        setParsedConstraints(newConstraints);
        setInputText('');
        
        // Clear clarification state
        setClarificationMode(false);
        setClarificationQuestion('');
        setClarificationOptions([]);
        setPendingConstraintText('');

        if (onConstraintsChange) {
          onConstraintsChange(newConstraints);
        }
      } else {
        console.error('❌ Parsing failed:', result);
        console.error('   Success:', result.success);
        console.error('   Constraint:', result.constraint);
        console.error('   Message:', result.message);
        setError(result.message || 'Kunde inte tolka begränsningen');
      }
    } catch (err) {
      console.error('Error parsing constraint:', err);
      setError(err instanceof Error ? err.message : 'Fel vid tolkning av begränsning');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveConstraint = async (index: number) => {
    const constraintToRemove = parsedConstraints[index];
    
    // 🗑️ DELETE FROM SUPABASE if it has an ID
    if (constraintToRemove.id) {
      console.log('🗑️ Deleting constraint from Supabase:', constraintToRemove.id);
      const deleteResult = await schedulerApi.deleteAIConstraint(constraintToRemove.id);
      
      if (!deleteResult.success) {
        console.error('❌ Failed to delete constraint from Supabase:', deleteResult.error);
        setError('Kunde inte ta bort kravet från databasen. Försök igen.');
        return; // Don't remove from UI if database deletion failed
      } else {
        console.log('✅ Constraint deleted from Supabase');
      }
    }
    
    // Only update UI after successful database deletion
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-sm text-muted-foreground">Laddar sparade begränsningar...</p>
            </div>
          </div>
        ) : (
          <>
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
              onClick={() => handleParse()}
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

        {/* Clarification Dialog */}
        {clarificationMode && (
          <Card className="border-2 border-purple-300 bg-purple-50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-purple-900 mb-3">{clarificationQuestion}</p>
                  <div className="space-y-2">
                    {clarificationOptions.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start text-left hover:bg-purple-100 hover:border-purple-400"
                        onClick={async () => {
                          setClarificationMode(false);
                          await handleParse(option.value);
                        }}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      setClarificationMode(false);
                      setClarificationQuestion('');
                      setClarificationOptions([]);
                      setPendingConstraintText('');
                    }}
                  >
                    Avbryt
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (window.confirm(`Är du säker på att du vill ta bort ALLA ${parsedConstraints.length} begränsningar?`)) {
                    setError(null);
                    let failedDeletions = 0;
                    
                    // Delete all from database - wait for ALL deletions to complete
                    const deletePromises = parsedConstraints
                      .filter(c => c.id)
                      .map(async (constraint) => {
                        const result = await schedulerApi.deleteAIConstraint(constraint.id!);
                        if (!result.success) {
                          failedDeletions++;
                          console.error(`❌ Failed to delete constraint ${constraint.id}:`, result.error);
                        }
                        return result;
                      });
                    
                    await Promise.all(deletePromises);
                    
                    if (failedDeletions > 0) {
                      setError(`Kunde inte ta bort ${failedDeletions} av ${parsedConstraints.length} begränsningar. Försök igen.`);
                      return; // Don't clear UI if deletions failed
                    }
                    
                    // Only clear UI if ALL deletions succeeded
                    console.log(`✅ Successfully deleted all ${parsedConstraints.length} constraints from database`);
                    setParsedConstraints([]);
                    if (onConstraintsChange) {
                      onConstraintsChange([]);
                    }
                  }
                }}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Rensa alla
              </Button>
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

            {/* Optimization Score Comparison */}
            {(previousOptimizationScore !== undefined || currentOptimizationScore !== undefined) && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold mb-3">📊 Optimeringspoäng</h4>
                  <div className="flex items-center justify-between gap-4">
                    {previousOptimizationScore !== undefined && (
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Tidigare poäng</p>
                        <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                          {previousOptimizationScore.toFixed(0)}
                        </p>
                      </div>
                    )}
                    
                    {previousOptimizationScore !== undefined && currentOptimizationScore !== undefined && (
                      <div className="flex items-center">
                        {currentOptimizationScore > previousOptimizationScore ? (
                          <TrendingUp className="h-8 w-8 text-green-500" />
                        ) : currentOptimizationScore < previousOptimizationScore ? (
                          <TrendingDown className="h-8 w-8 text-red-500" />
                        ) : (
                          <Minus className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                    )}
                    
                    {currentOptimizationScore !== undefined && (
                      <div className="flex-1 text-right">
                        <p className="text-xs text-muted-foreground mb-1">Ny poäng</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {currentOptimizationScore.toFixed(0)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {previousOptimizationScore !== undefined && currentOptimizationScore !== undefined && (
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-center">
                        {currentOptimizationScore > previousOptimizationScore ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            ✨ Förbättring: +{(currentOptimizationScore - previousOptimizationScore).toFixed(0)} poäng
                          </span>
                        ) : currentOptimizationScore < previousOptimizationScore ? (
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            ⚠️ Försämring: {(currentOptimizationScore - previousOptimizationScore).toFixed(0)} poäng
                          </span>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400 font-medium">
                            ➖ Ingen förändring
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Generate Schedule Button */}
            {onGenerateSchedule && (
              <Button
                onClick={onGenerateSchedule}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-base shadow-lg"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Genererar schema med nya krav...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Generera schema med {parsedConstraints.length} {parsedConstraints.length === 1 ? 'krav' : 'krav'}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
        </>
        )}
      </CardContent>
    </Card>
  );
}
