
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface GenerateButtonProps {
  isGenerating: boolean;
  isLoadingSettings: boolean;
  onClick: () => Promise<boolean> | void;
}

export const GenerateButton = ({
  isGenerating,
  isLoadingSettings,
  onClick
}: GenerateButtonProps) => {
  // Debug logging to see what's happening
  console.log('🔘 GenerateButton render:', {
    isGenerating,
    isLoadingSettings,
    disabled: isGenerating || isLoadingSettings
  });

  return (
    <Button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Generate button clicked!');
        try {
          await onClick();
          console.log('✅ Generate schedule function completed');
        } catch (error) {
          console.error('❌ Generate schedule function failed:', error);
        }
      }}
      disabled={isGenerating || isLoadingSettings}
      className="bg-violet-500 hover:bg-violet-600 text-white"
      title="Optimera schema med OR-Tools AI"
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
