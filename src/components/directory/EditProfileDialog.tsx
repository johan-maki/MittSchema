
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InsertProfile } from "@/types/profile";
import { Dispatch, SetStateAction } from "react";
import { ProfileFormContent } from "./ProfileFormContent";

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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            Redigera medarbetare
          </DialogTitle>
        </DialogHeader>
        <ProfileFormContent
          initialProfile={editingProfile}
          onProfileChange={setEditingProfile}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isEditing={true}
          isProcessing={isProcessing}
        />
      </DialogContent>
    </Dialog>
  );
}
