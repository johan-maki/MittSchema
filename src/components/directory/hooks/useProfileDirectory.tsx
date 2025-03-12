
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Profile, InsertProfile, DatabaseProfile, convertDatabaseProfile } from "@/types/profile";
import { useDirectory } from "@/contexts/DirectoryContext";

export function useProfileDirectory() {
  const { roleFilter, searchQuery } = useDirectory();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState<InsertProfile>({
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
          .from('employees')
          .select('*');
        
        if (error) {
          console.error('Error fetching profiles:', error);
          throw error;
        }
        
        console.log("Profiles fetched:", data);
        return (data as DatabaseProfile[] || []).map(convertDatabaseProfile);
      } catch (err) {
        console.error("Failed to fetch profiles:", err);
        return [];
      }
    },
    enabled: true
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
        .from('employees')
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
      
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
      
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      console.log("Updating profile with ID:", editingProfile.id);
      
      const { data, error } = await supabase
        .from('employees')
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

  return {
    profiles: filteredProfiles,
    isLoading,
    error,
    editingProfile,
    setEditingProfile,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    profileToDelete,
    isProcessing,
    handleEditProfile,
    handleDeleteProfile,
    confirmDelete,
    handleUpdateProfile
  };
}
