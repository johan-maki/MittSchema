
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GenerateScheduleButtonProps {
  isGenerating: boolean;
  isLoadingSettings: boolean;
  onGenerate: () => Promise<boolean>;
}

export const GenerateScheduleButton = ({
  isGenerating,
  isLoadingSettings,
  onGenerate
}: GenerateScheduleButtonProps) => {
  const navigate = useNavigate();

  const handleClick = async () => {
    const success = await onGenerate();
    if (!success) {
      navigate('/schedule/settings');
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isGenerating || isLoadingSettings}
    >
      {isGenerating ? (
        <>
          <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          Genererar schema...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" />
          Generera schema
        </>
      )}
    </Button>
  );
};
