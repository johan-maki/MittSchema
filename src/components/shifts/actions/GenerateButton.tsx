
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wand2, Brain, Users, Calculator, CheckCircle } from "lucide-react";
import { ScheduleConfigModal } from "@/components/ui/ScheduleConfigModal";

interface ScheduleConfig {
  minStaffPerShift: number;
  minExperiencePerShift: number;
  includeWeekends: boolean;
  weekendPenalty: number;
}

interface GenerateButtonProps {
  isGenerating: boolean;
  isLoadingSettings: boolean;
  onClick: (config?: ScheduleConfig) => Promise<boolean> | void;
  generationProgress?: number;
  progressMessage?: string;
}

export const GenerateButton = ({
  isGenerating,
  isLoadingSettings,
  onClick,
  generationProgress = 0,
  progressMessage = ""
}: GenerateButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getProgressIcon = () => {
    if (generationProgress >= 100) return <CheckCircle className="h-4 w-4" />;
    if (generationProgress >= 75) return <Calculator className="h-4 w-4" />;
    if (generationProgress >= 35) return <Brain className="h-4 w-4" />;
    if (generationProgress >= 15) return <Users className="h-4 w-4" />;
    return <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />;
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🖱️ Generate button clicked - opening modal!');
    setIsModalOpen(true);
  };

  const handleConfigConfirm = async (config: ScheduleConfig) => {
    console.log('🎯 Starting schedule generation with config:', config);
    setIsModalOpen(false);
    try {
      await onClick(config);
      console.log('✅ Generate schedule function completed');
    } catch (error) {
      console.error('❌ Generate schedule function failed:', error);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={handleButtonClick}
          disabled={isGenerating || isLoadingSettings}
          className="bg-violet-500 hover:bg-violet-600 text-white min-w-[250px]"
          title="Konfigurera och generera schema för nästa månad"
        >
          {isGenerating ? (
            <div className="flex items-center">
              {getProgressIcon()}
              <span className="ml-2">Genererar schema... {generationProgress}%</span>
            </div>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generera schema (nästa månad)
            </>
          )}
        </Button>
        
        {isGenerating && (
          <div className="w-full max-w-md">
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(generationProgress, 100)}%` }}
              ></div>
            </div>
            {/* Progress message */}
            <p className="text-sm text-gray-600 text-center min-h-[20px]">
              {progressMessage || "Förbereder optimering..."}
            </p>
          </div>
        )}
      </div>

      <ScheduleConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfigConfirm}
        currentConfig={{
          minStaffPerShift: 1,
          minExperiencePerShift: 1,
          includeWeekends: true,
        }}
      />
    </>
  );
};
