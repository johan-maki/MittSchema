
import { Button } from "@/components/ui/button";
import { MoreVertical, CheckCircle2, Ban, PlusCircle, Settings, XCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DialogTrigger } from "@/components/ui/dialog";

interface ScheduleActionsMenuProps {
  onPublishClick: () => void;
  onUnpublishClick: () => void;
  onClearClick: () => void;
  onSettingsClick: () => void;
  hasPublishedShifts: boolean;
}

export const ScheduleActionsMenu = ({
  onPublishClick,
  onUnpublishClick,
  onClearClick,
  onSettingsClick,
  hasPublishedShifts,
}: ScheduleActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!hasPublishedShifts ? (
          <DropdownMenuItem onClick={onPublishClick} className="text-green-600">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Publicera
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onUnpublishClick} className="text-orange-600">
            <XCircle className="mr-2 h-4 w-4" />
            Avpublicera schema
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onClearClick} className="text-red-600">
          <Ban className="mr-2 h-4 w-4" />
          Rensa schema
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSettingsClick} className="text-gray-600">
          <Settings className="mr-2 h-4 w-4" />
          Schemainställningar
        </DropdownMenuItem>
        <DialogTrigger asChild>
          <DropdownMenuItem>
            <PlusCircle className="mr-2 h-4 w-4" />
            Lägg till pass
          </DropdownMenuItem>
        </DialogTrigger>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
