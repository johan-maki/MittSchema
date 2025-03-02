
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Profile, DatabaseProfile, convertDatabaseProfile } from "@/types/profile";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { AddProfileDialog } from "./AddProfileDialog";
import { useDirectory } from "@/contexts/DirectoryContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function getInitials(profile: Profile) {
  return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`;
}

export function DirectoryTable() {
  const { roleFilter, searchQuery, isAuthenticated } = useDirectory();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState({
    id: '',
    first_name: '',
    last_name: '',
    role: '',
    department: '',
    phone: '',
    experience_level: 1
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: profiles = [], isLoading, error } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      console.log("Fetching profiles from database...");
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
        
        if (error) {
          console.error('Error fetching profiles:', error);
          throw error;
        }
        
        console.log("Profiles fetched:", data);
        // Convert the raw database profiles to our internal Profile type
        return (data as DatabaseProfile[] || []).map(convertDatabaseProfile);
      } catch (err) {
        console.error("Failed to fetch profiles:", err);
        return [];
      }
    },
    enabled: isAuthenticated // Only fetch when authenticated
  });

  // Filter profiles based on search query and role filter
  const filteredProfiles = profiles.filter((profile) => {
    const searchRegex = new RegExp(searchQuery, "i");
    const matchesSearch =
      searchRegex.test(profile.first_name) ||
      searchRegex.test(profile.last_name) ||
      searchRegex.test(profile.role);

    const matchesRole =
      roleFilter === "all" || profile.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleEditProfile = (profile: Profile) => {
    if (!isAuthenticated) {
      toast({
        title: "Inte inloggad",
        description: "Du måste logga in för att redigera personal",
        variant: "destructive",
      });
      return;
    }
    
    setEditingProfile({
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      department: profile.department || '',
      phone: profile.phone || '',
      experience_level: profile.experience_level
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteProfile = (profile: Profile) => {
    if (!isAuthenticated) {
      toast({
        title: "Inte inloggad",
        description: "Du måste logga in för att ta bort personal",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Setting profile to delete:", profile);
    setProfileToDelete(profile);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!profileToDelete) {
      console.error("No profile to delete!");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log("Deleting profile with ID:", profileToDelete.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileToDelete.id);
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      console.log("Delete response:", data);
      
      toast({
        title: "Medarbetare borttagen",
        description: `${profileToDelete.first_name} ${profileToDelete.last_name} har tagits bort`,
      });
      
      // Refresh the profiles data
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
      
      // Close the dialog and reset state
      setIsDeleteDialogOpen(false);
      setProfileToDelete(null);
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte ta bort medarbetaren",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      console.log("Updating profile with ID:", editingProfile.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: editingProfile.first_name,
          last_name: editingProfile.last_name,
          role: editingProfile.role,
          department: editingProfile.department || null,
          phone: editingProfile.phone || null,
          experience_level: editingProfile.experience_level
        })
        .eq('id', editingProfile.id)
        .select();
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      console.log("Update response:", data);
      
      toast({
        title: "Profil uppdaterad",
        description: "Ändringar har sparats framgångsrikt",
      });
      
      // Refresh the profiles data
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte uppdatera profilen",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium">Inloggning krävs</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Du måste logga in för att visa och hantera personalkatalogen.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center">Laddar personal...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Ett fel uppstod: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="w-full">
      <ProfilesTable 
        profiles={filteredProfiles} 
        onEdit={handleEditProfile} 
        onDelete={handleDeleteProfile} 
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera personal</DialogTitle>
          </DialogHeader>
          <AddProfileDialog
            isOpen={isEditDialogOpen}
            setIsOpen={setIsEditDialogOpen}
            newProfile={editingProfile}
            setNewProfile={setEditingProfile}
            onSubmit={handleSubmit}
            isEditing={true}
            isProcessing={isProcessing}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort medarbetare</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort {profileToDelete?.first_name} {profileToDelete?.last_name}? 
              Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing ? "Tar bort..." : "Ta bort"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProfilesTable({ 
  profiles, 
  onEdit, 
  onDelete 
}: { 
  profiles: Profile[]; 
  onEdit: (profile: Profile) => void; 
  onDelete: (profile: Profile) => void;
}) {
  return (
    <table className="min-w-full divide-y divide-gray-300">
      <ProfilesTableHeader />
      <ProfilesTableBody 
        profiles={profiles} 
        onEdit={onEdit} 
        onDelete={onDelete} 
      />
    </table>
  );
}

function ProfilesTableHeader() {
  return (
    <thead>
      <tr>
        <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
          Personal
        </th>
        <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
          Roll
        </th>
        <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell dark:text-gray-100">
          Avdelning
        </th>
        <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell dark:text-gray-100">
          Erfarenhet
        </th>
        <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell dark:text-gray-100">
          Telefon
        </th>
        <th scope="col" className="relative py-3.5 pl-3 pr-6">
          <span className="sr-only">Åtgärder</span>
        </th>
      </tr>
    </thead>
  );
}

function ProfilesTableBody({ 
  profiles, 
  onEdit, 
  onDelete 
}: { 
  profiles: Profile[]; 
  onEdit: (profile: Profile) => void; 
  onDelete: (profile: Profile) => void;
}) {
  return (
    <tbody className="divide-y divide-gray-200 bg-white dark:bg-gray-800 dark:divide-gray-700">
      {profiles.length === 0 ? (
        <tr>
          <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
            Inga medarbetare hittades
          </td>
        </tr>
      ) : (
        profiles.map((profile) => (
          <ProfileTableRow 
            key={profile.id} 
            profile={profile} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))
      )}
    </tbody>
  );
}

function ProfileTableRow({ 
  profile, 
  onEdit, 
  onDelete 
}: { 
  profile: Profile; 
  onEdit: (profile: Profile) => void; 
  onDelete: (profile: Profile) => void;
}) {
  return (
    <tr key={profile.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(profile)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {profile.first_name} {profile.last_name}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
        {profile.role}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell dark:text-gray-400">
        {profile.department || "-"}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell dark:text-gray-400">
        {profile.experience_level} år
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell dark:text-gray-400">
        {profile.phone || "-"}
      </td>
      <td className="py-4 pl-3 pr-6 text-right text-sm font-medium">
        <ProfileActions 
          profile={profile} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />
      </td>
    </tr>
  );
}

function ProfileActions({ 
  profile, 
  onEdit, 
  onDelete 
}: { 
  profile: Profile; 
  onEdit: (profile: Profile) => void; 
  onDelete: (profile: Profile) => void;
}) {
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
