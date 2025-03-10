
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface GenerateButtonProps {
  isGenerating: boolean;
  isLoadingSettings: boolean;
  onClick: () => void;
}

export const GenerateButton = ({
  isGenerating,
  isLoadingSettings,
  onClick
}: GenerateButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          disabled={isGenerating || isLoadingSettings}
          className="bg-violet-500 hover:bg-violet-600 text-white"
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
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Optimera schema med OR-Tools AI</p>
      </TooltipContent>
    </Tooltip>
  );
};
