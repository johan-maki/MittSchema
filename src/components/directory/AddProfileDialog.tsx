
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { NewProfile } from "@/types/profile";
import { Dispatch, SetStateAction } from "react";

interface AddProfileDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  newProfile: NewProfile;
  setNewProfile: Dispatch<SetStateAction<NewProfile>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isEditing?: boolean;
}

export const AddProfileDialog = ({
  isOpen,
  setIsOpen,
  newProfile,
  setNewProfile,
  onSubmit,
  isEditing = false
}: AddProfileDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9]">
          <Plus className="w-4 h-4 mr-2" />
          Lägg till personal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Redigera personal" : "Lägg till ny personal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#1A1F2C] dark:text-gray-300">Förnamn</label>
            <Input
              required
              value={newProfile.first_name}
              onChange={e => setNewProfile(prev => ({ ...prev, first_name: e.target.value }))}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#1A1F2C] dark:text-gray-300">Efternamn</label>
            <Input
              required
              value={newProfile.last_name}
              onChange={e => setNewProfile(prev => ({ ...prev, last_name: e.target.value }))}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#1A1F2C] dark:text-gray-300">Yrkesroll</label>
            <Input
              required
              value={newProfile.role}
              onChange={e => setNewProfile(prev => ({ ...prev, role: e.target.value }))}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#1A1F2C] dark:text-gray-300">Avdelning</label>
            <Input
              value={newProfile.department || ''}
              onChange={e => setNewProfile(prev => ({ ...prev, department: e.target.value || null }))}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#1A1F2C] dark:text-gray-300">Telefonnummer</label>
            <Input
              value={newProfile.phone || ''}
              onChange={e => setNewProfile(prev => ({ ...prev, phone: e.target.value || null }))}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} 
              className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600">
              Avbryt
            </Button>
            <Button type="submit" className="bg-[#9b87f5] hover:bg-[#7E69AB] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED]">
              {isEditing ? "Spara ändringar" : "Lägg till"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
