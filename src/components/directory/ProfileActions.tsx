
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
    <div className="flex justify-end space-x-1">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onEdit(profile)}
        aria-label={`Redigera ${profile.first_name} ${profile.last_name}`}
        className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onDelete(profile)} 
        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-colors"
        aria-label={`Ta bort ${profile.first_name} ${profile.last_name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
