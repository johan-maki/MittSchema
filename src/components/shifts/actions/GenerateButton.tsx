
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
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
}

export const GenerateButton = ({
  isGenerating,
  isLoadingSettings,
  onClick
}: GenerateButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debug logging to see what's happening
  console.log('🔘 GenerateButton render:', {
    isGenerating,
    isLoadingSettings,
    disabled: isGenerating || isLoadingSettings
  });

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🖱️ Generate button clicked - opening modal!');
    setIsModalOpen(true);
  };

  const handleConfigConfirm = async (config: ScheduleConfig) => {
    console.log('🎯 Starting schedule generation with config:', config);
    try {
      await onClick(config);
      console.log('✅ Generate schedule function completed');
    } catch (error) {
      console.error('❌ Generate schedule function failed:', error);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleButtonClick}
        disabled={isGenerating || isLoadingSettings}
        className="bg-violet-500 hover:bg-violet-600 text-white"
        title="Konfigurera och generera schema för nästa månad"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            Genererar schema...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Generera schema (nästa månad)
          </>
        )}
      </Button>

      <ScheduleConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfigConfirm}
        currentConfig={{
          minStaffPerShift: 2,
          minExperiencePerShift: 1,
          includeWeekends: true,
        }}
      />
    </>
  );
};
