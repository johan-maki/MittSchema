
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogDescription, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserPlus, LogIn, LogOut } from "lucide-react";
import { AddProfileDialog } from "@/components/directory/AddProfileDialog";
import { useDirectory } from "@/contexts/DirectoryContext";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InsertProfile } from "@/types/profile";

export function DirectoryControls() {
  const { roleFilter, setRoleFilter, searchQuery, setSearchQuery, isAuthenticated, signIn, signOut } = useDirectory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
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
      console.log("Adding new profile in development mode");
      
      // Generate a UUID for the new profile
      const newId = crypto.randomUUID();
      
      const profileData: InsertProfile = {
        id: newId,
        first_name: newProfile.first_name,
        last_name: newProfile.last_name,
        role: newProfile.role,
        department: newProfile.department || null,
        phone: newProfile.phone || null,
        experience_level: newProfile.experience_level
      };
      
      // In development mode, directly insert into profiles table
      // without worrying about the auth.users foreign key constraint
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select();
      
      if (error) {
        console.error('Error adding profile:', error);
        throw error;
      }
      
      console.log("Profile added successfully:", data);
      
      toast({
        title: "Profil tillagd",
        description: "Den nya personalen har lagts till",
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
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      await signIn(email, password);
      setIsLoginDialogOpen(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
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
      
      <div className="flex gap-2 w-full sm:w-auto">
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
            />
          </DialogContent>
        </Dialog>
        
        <Button 
          variant="outline"
          onClick={() => {
            toast({
              title: "Utvecklingsläge",
              description: "Du är alltid inloggad med fulla rättigheter i utvecklingsläge",
            });
          }}
          className="w-full sm:w-auto dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          Alltid admin
        </Button>
      </div>
    </div>
  );
}
