
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
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader className="text-center sm:text-left">
          <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Ta bort medarbetare
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            Är du säker på att du vill ta bort{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {profileToDelete?.first_name} {profileToDelete?.last_name}
            </span>
            ? Denna åtgärd kan inte ångras och all data för denna medarbetare kommer att raderas permanent.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3 sm:gap-2">
          <AlertDialogCancel 
            disabled={isProcessing}
            className="px-4 py-2"
          >
            Avbryt
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirmDelete}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Tar bort...
              </div>
            ) : (
              "Ta bort medarbetare"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
