import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OptimizationScoreProps {
  previousScore?: number;
  currentScore?: number;
  showComparison?: boolean;
}

export function OptimizationScoreComparison({ 
  previousScore, 
  currentScore,
  showComparison = false 
}: OptimizationScoreProps) {
  
  if (!currentScore) {
    return null;
  }

  const hasComparison = showComparison && previousScore !== undefined && previousScore !== null;
  const scoreDiff = hasComparison ? currentScore - previousScore! : 0;
  const percentChange = hasComparison && previousScore !== 0 
    ? ((scoreDiff / previousScore!) * 100).toFixed(1)
    : '0';

  const getTrendIcon = () => {
    if (!hasComparison) return null;
    if (scoreDiff > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (scoreDiff < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendBadge = () => {
    if (!hasComparison) return null;
    
    if (scoreDiff > 0) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          +{scoreDiff.toFixed(0)} poäng ({percentChange}%)
        </Badge>
      );
    }
    
    if (scoreDiff < 0) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          {scoreDiff.toFixed(0)} poäng ({percentChange}%)
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        Ingen förändring
      </Badge>
    );
  };

  return (
    <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            🎯 Optimeringspoäng
          </CardTitle>
          {getTrendIcon()}
        </div>
        <CardDescription>
          Högre poäng = bättre schema (täckning, rättvisa, preferenser)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasComparison ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Föregående schema</p>
                <p className="text-2xl font-bold text-gray-700">
                  {previousScore!.toFixed(0)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nytt schema med krav</p>
                <p className="text-2xl font-bold text-blue-700">
                  {currentScore.toFixed(0)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium">Påverkan av nya krav:</span>
              {getTrendBadge()}
            </div>

            {scoreDiff < 0 && (
              <Alert className="bg-amber-50 border-amber-200">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-800">
                  <strong>Observera:</strong> De nya kraven har minskat optimeringspoängen med {Math.abs(scoreDiff).toFixed(0)} poäng. 
                  Detta kan innebära att schemat nu har lägre täckning, sämre rättvisa mellan personal, 
                  eller att fler arbetar utanför sina preferenser.
                </AlertDescription>
              </Alert>
            )}

            {scoreDiff > 0 && (
              <Alert className="bg-green-50 border-green-200">
                <Info className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm text-green-800">
                  <strong>Bra!</strong> De nya kraven har förbättrat optimeringspoängen med {scoreDiff.toFixed(0)} poäng.
                  Detta betyder bättre schemabalans och högre medarbetarnöjdhet.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-3xl font-bold text-blue-700">
              {currentScore.toFixed(0)}
            </p>
            <p className="text-sm text-muted-foreground">
              Aktuell optimeringspoäng för detta schema
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p className="font-medium mb-1">Poängen baseras på:</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>Skifttäckning (100x vikt)</li>
            <li>Rättvisa fördelning mellan personal (50x vikt)</li>
            <li>Respekt för preferenser och blockeringar (18-40x vikt)</li>
            <li>Helgrättvisa (15x vikt)</li>
            <li>Skifttypsbalans (8x vikt)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
