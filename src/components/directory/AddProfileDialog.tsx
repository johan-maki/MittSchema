
import { InsertProfile } from "@/types/profile";
import { Dispatch, SetStateAction } from "react";
import { ProfileFormContent } from "./ProfileFormContent";

interface AddProfileDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  newProfile: InsertProfile;
  setNewProfile: Dispatch<SetStateAction<InsertProfile>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isEditing?: boolean;
  isProcessing?: boolean;
}

export const AddProfileDialog = ({
  isOpen,
  setIsOpen,
  newProfile,
  setNewProfile,
  onSubmit,
  isEditing = false,
  isProcessing = false
}: AddProfileDialogProps) => {
  return (
    <ProfileFormContent
      initialProfile={newProfile}
      onProfileChange={setNewProfile}
      onSubmit={onSubmit}
      onCancel={() => setIsOpen(false)}
      isEditing={isEditing}
      isProcessing={isProcessing}
    />
  );
};
