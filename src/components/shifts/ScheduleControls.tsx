
import { Button } from "@/components/ui/button";
import { CheckCircle2, Ban } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ScheduleControls = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePublishSchedule = async () => {
    try {
      const { error: updateError } = await supabase
        .from('shifts')
        .update({ is_published: true })
        .filter('is_published', 'is', null);

      if (updateError) throw updateError;

      toast({
        title: "Schema publicerat",
        description: "Alla schemalagda pass har publicerats.",
      });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (error) {
      console.error('Error publishing schedule:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte publicera schemat. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleClearUnpublished = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .filter('is_published', 'is', null);

      if (deleteError) throw deleteError;

      toast({
        title: "Schema rensat",
        description: "Alla opublicerade pass har tagits bort.",
      });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (error) {
      console.error('Error clearing schedule:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte rensa schemat. Försök igen.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="bg-green-800 text-white hover:bg-green-900"
        onClick={handlePublishSchedule}
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Publicera
      </Button>

      <Button
        variant="outline"
        className="border-red-500 text-red-500 hover:bg-red-50"
        onClick={handleClearUnpublished}
      >
        <Ban className="mr-2 h-4 w-4" />
        Rensa opublicerat
      </Button>
    </>
  );
};
