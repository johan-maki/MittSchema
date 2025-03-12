
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Profile } from "@/types/profile";

interface DeleteProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profileToDelete: Profile | null;
  onConfirmDelete: () => Promise<void>;
  isProcessing: boolean;
}

export function DeleteProfileDialog({
  isOpen,
  onOpenChange,
  profileToDelete,
  onConfirmDelete,
  isProcessing
}: DeleteProfileDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ta bort medarbetare</AlertDialogTitle>
          <AlertDialogDescription>
            Är du säker på att du vill ta bort {profileToDelete?.first_name} {profileToDelete?.last_name}? 
            Denna åtgärd kan inte ångras.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Avbryt</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isProcessing}
          >
            {isProcessing ? "Tar bort..." : "Ta bort"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
