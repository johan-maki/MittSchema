
import { useProfileDirectory } from "./hooks/useProfileDirectory";
import { ProfilesTable } from "./ProfilesTable";
import { EditProfileDialog } from "./EditProfileDialog";
import { DeleteProfileDialog } from "./DeleteProfileDialog";

export function DirectoryTable() {
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
        profiles={profiles} 
        onEdit={handleEditProfile} 
        onDelete={handleDeleteProfile} 
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
    </div>
  );
}
