
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { AddProfileDialog } from "@/components/directory/AddProfileDialog";
import { useDirectory } from "@/contexts/DirectoryContext";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function DirectoryControls() {
  const { roleFilter, setRoleFilter, searchQuery, setSearchQuery } = useDirectory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProfile, setNewProfile] = useState({
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
    
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{
          first_name: newProfile.first_name,
          last_name: newProfile.last_name,
          role: newProfile.role,
          department: newProfile.department || null,
          phone: newProfile.phone || null,
          experience_level: newProfile.experience_level
        }]);
      
      if (error) throw error;
      
      toast({
        title: "Profil tillagd",
        description: "Den nya personalen har lagts till",
      });
      
      // Reset form
      setNewProfile({
        id: '',
        first_name: '',
        last_name: '',
        role: '',
        department: '',
        phone: '',
        experience_level: 1
      });
      
      // Refresh the profiles data
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding profile:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte lägga till profilen",
        variant: "destructive",
      });
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9]">
            <UserPlus className="w-4 h-4 mr-2" />
            Lägg till personal
          </Button>
        </DialogTrigger>
        <DialogContent>
          <AddProfileDialog 
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            newProfile={newProfile}
            setNewProfile={setNewProfile}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
