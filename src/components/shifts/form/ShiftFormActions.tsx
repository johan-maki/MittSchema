
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ShiftFormActionsProps {
  editMode?: boolean;
  onDelete: () => Promise<void>;
  onCancel: () => void;
}

export const ShiftFormActions = ({ 
  editMode, 
  onDelete, 
  onCancel 
}: ShiftFormActionsProps) => {
  return (
    <DialogFooter className="gap-2">
      {editMode && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Är du säker?</AlertDialogTitle>
              <AlertDialogDescription>
                Detta kommer att permanent ta bort arbetspasset från schemat.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Ta bort
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <Button type="button" variant="outline" onClick={onCancel}>
        Avbryt
      </Button>
      <Button type="submit" className="bg-[#9b87f5] hover:bg-[#7E69AB]">
        {editMode ? "Spara ändringar" : "Skapa pass"}
      </Button>
    </DialogFooter>
  );
};
