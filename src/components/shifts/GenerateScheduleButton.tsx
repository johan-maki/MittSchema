
import { Button } from "@/components/ui/button";
import { Wand2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

interface GenerateScheduleButtonProps {
  isGenerating: boolean;
  isLoadingSettings: boolean;
  onGenerate: (onProgress?: (step: string, progress: number) => void) => Promise<boolean>;
}

export const GenerateScheduleButton = ({
  isGenerating,
  isLoadingSettings,
  onGenerate
}: GenerateScheduleButtonProps) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setProgress(0);
    setCurrentStep("");
    
    try {
      const success = await onGenerate((step: string, progressValue: number) => {
        setCurrentStep(step);
        setProgress(progressValue);
      });
      
      if (!success) {
        setError("Schema generation misslyckades. Kontrollera inställningarna.");
        navigate('/schedule/settings');
      } else {
        setProgress(100);
        setCurrentStep("Klart!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ett oväntat fel uppstod");
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={isGenerating || isLoadingSettings}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            Genererar schema...
          </>
        ) : error ? (
          <>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Försök igen
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Generera schema
          </>
        )}
      </Button>
      
      {isGenerating && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-600 text-center">{currentStep}</p>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
};
