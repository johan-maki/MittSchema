
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Profile } from "@/types/profile";

interface ProfileActionsProps {
  profile: Profile;
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
}

export function ProfileActions({ profile, onEdit, onDelete }: ProfileActionsProps) {
  return (
    <div className="flex justify-end space-x-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onEdit(profile)}
        aria-label={`Redigera ${profile.first_name} ${profile.last_name}`}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onDelete(profile)} 
        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        aria-label={`Ta bort ${profile.first_name} ${profile.last_name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
