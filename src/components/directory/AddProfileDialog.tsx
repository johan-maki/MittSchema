
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { NewProfile } from "@/types/profile";

interface AddProfileDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  newProfile: NewProfile;
  setNewProfile: (profile: NewProfile) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const AddProfileDialog = ({
  isOpen,
  setIsOpen,
  newProfile,
  setNewProfile,
  onSubmit
}: AddProfileDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED]">
          <Plus className="w-4 h-4 mr-2" />
          Lägg till personal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lägg till ny personal</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#1A1F2C]">Förnamn</label>
            <Input
              required
              value={newProfile.first_name}
              onChange={e => setNewProfile(prev => ({ ...prev, first_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#1A1F2C]">Efternamn</label>
            <Input
              required
              value={newProfile.last_name}
              onChange={e => setNewProfile(prev => ({ ...prev, last_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#1A1F2C]">Yrkesroll</label>
            <Input
              required
              value={newProfile.role}
              onChange={e => setNewProfile(prev => ({ ...prev, role: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#1A1F2C]">Avdelning</label>
            <Input
              value={newProfile.department || ''}
              onChange={e => setNewProfile(prev => ({ ...prev, department: e.target.value || null }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#1A1F2C]">Telefonnummer</label>
            <Input
              value={newProfile.phone || ''}
              onChange={e => setNewProfile(prev => ({ ...prev, phone: e.target.value || null }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Avbryt
            </Button>
            <Button type="submit" className="bg-[#9b87f5] hover:bg-[#7E69AB]">
              Lägg till
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
