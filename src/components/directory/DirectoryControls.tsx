
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { AddProfileDialog } from "@/components/directory/AddProfileDialog";
import { useDirectory } from "@/contexts/DirectoryContext";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { InsertProfile } from "@/types/profile";
import { addProfile } from "@/services/profileService";

export function DirectoryControls() {
  const { roleFilter, setRoleFilter, searchQuery, setSearchQuery } = useDirectory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newProfile, setNewProfile] = useState<InsertProfile>({
    id: '',
    first_name: '',
    last_name: '',
    role: '',
    department: '',
    phone: '',
    experience_level: 1
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      console.log("Adding new profile with data:", newProfile);
      
      // Create profile data object without the ID (will be generated in the service)
      const profileData = {
        first_name: newProfile.first_name,
        last_name: newProfile.last_name,
        role: newProfile.role,
        department: newProfile.department || null,
        phone: newProfile.phone || null,
        experience_level: newProfile.experience_level
      };
      
      // Use the profile service to add the profile
      const addedProfile = await addProfile(profileData);
      
      console.log("Profile added successfully:", addedProfile);
      
      toast({
        title: "Profil tillagd",
        description: `${profileData.first_name} ${profileData.last_name} har lagts till`,
      });
      
      setNewProfile({
        id: '',
        first_name: '',
        last_name: '',
        role: '',
        department: '',
        phone: '',
        experience_level: 1
      });
      
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding profile:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte lägga till profilen",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Input
          placeholder="Sök personal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-[300px] dark:bg-gray-800 dark:text-white dark:border-gray-700"
        />
        <Select
          value={roleFilter}
          onValueChange={setRoleFilter}
        >
          <SelectTrigger className="w-full sm:w-[200px] dark:bg-gray-800 dark:text-white dark:border-gray-700">
            <SelectValue placeholder="Alla roller" />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800 dark:text-white dark:border-gray-700">
            <SelectItem value="all">Alla roller</SelectItem>
            <SelectItem value="Läkare">Läkare</SelectItem>
            <SelectItem value="Sjuksköterska">Sjuksköterska</SelectItem>
            <SelectItem value="Undersköterska">Undersköterska</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-full sm:w-auto">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9]">
              <UserPlus className="w-4 h-4 mr-2" />
              Lägg till personal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Lägg till ny personal</DialogTitle>
            <DialogDescription>Lägg till information om den nya medarbetaren nedan.</DialogDescription>
            <AddProfileDialog 
              isOpen={isDialogOpen}
              setIsOpen={setIsDialogOpen}
              newProfile={newProfile}
              setNewProfile={setNewProfile}
              onSubmit={handleSubmit}
              isProcessing={isProcessing}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
