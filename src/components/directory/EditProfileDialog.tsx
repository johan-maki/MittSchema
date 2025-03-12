
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddProfileDialog } from "./AddProfileDialog";
import { InsertProfile } from "@/types/profile";
import { Dispatch, SetStateAction } from "react";

interface EditProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingProfile: InsertProfile;
  setEditingProfile: Dispatch<SetStateAction<InsertProfile>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isProcessing: boolean;
}

export function EditProfileDialog({
  isOpen,
  onOpenChange,
  editingProfile,
  setEditingProfile,
  onSubmit,
  isProcessing
}: EditProfileDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redigera personal</DialogTitle>
        </DialogHeader>
        <AddProfileDialog
          isOpen={isOpen}
          setIsOpen={onOpenChange}
          newProfile={editingProfile}
          setNewProfile={setEditingProfile}
          onSubmit={onSubmit}
          isEditing={true}
          isProcessing={isProcessing}
        />
      </DialogContent>
    </Dialog>
  );
}
