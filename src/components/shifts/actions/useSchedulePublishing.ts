
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSchedulePublishing = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePublishSchedule = async () => {
    try {
      const { error: updateError } = await supabase
        .from('shifts')
        .update({ is_published: true })
        .eq('is_published', false);

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

  const handleUnpublishSchedule = async () => {
    // Add confirmation dialog for safety
    const confirmed = window.confirm(
      "Är du säker på att du vill avpublicera schemat? Det kommer att bli redigerbart igen."
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      const { error: updateError } = await supabase
        .from('shifts')
        .update({ is_published: false })
        .eq('is_published', true);

      if (updateError) throw updateError;

      toast({
        title: "Schema avpublicerat",
        description: "Schemat är nu redigerbart igen.",
      });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (error) {
      console.error('Error unpublishing schedule:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte avpublicera schemat. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleClearUnpublished = async () => {
    // Add confirmation dialog for safety
    const confirmed = window.confirm(
      "Är du säker på att du vill rensa hela schemat? Detta kan inte ångras."
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .eq('is_published', false);

      if (deleteError) throw deleteError;

      toast({
        title: "Schema rensat",
        description: "Hela schemat har rensats och är nu tomt.",
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

  return {
    handlePublishSchedule,
    handleUnpublishSchedule,
    handleClearUnpublished,
  };
};
