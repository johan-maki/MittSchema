
import { useState } from "react";
import { useProfileDirectory } from "./hooks/useProfileDirectory";
import { ProfilesTable } from "./ProfilesTable";
import { EditProfileDialog } from "./EditProfileDialog";
import { DeleteProfileDialog } from "./DeleteProfileDialog";
import { EmployeePreferencesModal } from "./EmployeePreferencesModal";
import { Profile } from "@/types/profile";

export function DirectoryTable() {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);

  const {
    profiles,
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
  } = useProfileDirectory();

  const handleViewPreferences = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsPreferencesModalOpen(true);
  };

  const handleClosePreferencesModal = () => {
    setIsPreferencesModalOpen(false);
    setSelectedProfile(null);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Laddar personal...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Ett fel uppstod</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ProfilesTable 
        profiles={profiles} 
        onEdit={handleEditProfile} 
        onDelete={handleDeleteProfile} 
        onViewPreferences={handleViewPreferences}
      />

      {/* Edit Dialog */}
      <EditProfileDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingProfile={editingProfile}
        setEditingProfile={setEditingProfile}
        onSubmit={handleUpdateProfile}
        isProcessing={isProcessing}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteProfileDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        profileToDelete={profileToDelete}
        onConfirmDelete={confirmDelete}
        isProcessing={isProcessing}
      />

      {/* Preferences Modal */}
      <EmployeePreferencesModal
        employee={selectedProfile}
        isOpen={isPreferencesModalOpen}
        onClose={handleClosePreferencesModal}
      />
    </div>
  );
}
