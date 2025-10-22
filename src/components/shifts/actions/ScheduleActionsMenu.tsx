
import { Button } from "@/components/ui/button";
import { MoreVertical, CheckCircle2, Ban, PlusCircle, Settings, XCircle, AlertTriangle, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DialogTrigger } from "@/components/ui/dialog";

interface ScheduleActionsMenuProps {
  onPublishClick: () => void;
  onUnpublishClick: () => void;
  onClearClick: () => void;
  onSettingsClick: () => void;
  onEditPublishedClick?: () => void;
  hasPublishedShifts: boolean;
  isEditingPublished?: boolean;
}

export const ScheduleActionsMenu = ({
  onPublishClick,
  onUnpublishClick,
  onClearClick,
  onSettingsClick,
  onEditPublishedClick,
  hasPublishedShifts,
  isEditingPublished = false,
}: ScheduleActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <MoreVertical className="h-4 w-4" />
          {hasPublishedShifts && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Edit Published Schedule - shown when there's a published schedule */}
        {hasPublishedShifts && onEditPublishedClick && (
          <>
            <DropdownMenuItem 
              onClick={onEditPublishedClick} 
              className={`${
                isEditingPublished 
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Edit className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">
                  {isEditingPublished ? 'Redigerar publicerat schema...' : 'Redigera publicerat schema'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isEditingPublished ? 'Lägg till begränsningar och generera om' : 'Hantera sjukdom och frånvaro'}
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Publishing Section */}
        {!hasPublishedShifts ? (
          <DropdownMenuItem onClick={onPublishClick} className="text-green-600 hover:text-green-700 hover:bg-green-50">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">Publicera schema</span>
              <span className="text-xs text-muted-foreground">Gör schemat synligt för alla</span>
            </div>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onUnpublishClick} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
            <XCircle className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">Avpublicera schema</span>
              <span className="text-xs text-muted-foreground">Gör schemat redigerbart igen</span>
            </div>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Clear Schedule Section */}
        {!hasPublishedShifts ? (
          <DropdownMenuItem onClick={onClearClick} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <Ban className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">Rensa schema</span>
              <span className="text-xs text-muted-foreground">Ta bort alla opublicerade pass</span>
            </div>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled className="text-gray-400 cursor-not-allowed">
            <Ban className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">Rensa schema</span>
              <span className="text-xs text-muted-foreground flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Avpublicera först för att rensa
              </span>
            </div>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Management Section */}
        <DropdownMenuItem onClick={onSettingsClick} className="text-gray-600 hover:text-gray-700 hover:bg-gray-50">
          <Settings className="mr-2 h-4 w-4" />
          <span className="font-medium">Schemainställningar</span>
        </DropdownMenuItem>
        
        <DialogTrigger asChild>
          <DropdownMenuItem>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span className="font-medium">Lägg till pass</span>
          </DropdownMenuItem>
        </DialogTrigger>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
