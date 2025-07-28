import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Trash2, Users } from "lucide-react";
import { AddProfileDialog } from "@/components/directory/AddProfileDialog";
import { useDirectory } from "@/contexts/DirectoryContext";
import { useToast } from "@/hooks/use-toast";
import { InsertProfile } from "@/types/profile";
import { addProfile, clearDatabase, generateTestData } from "@/services/profileService";
import { toast } from "sonner";

export function DirectoryControls() {
  const { roleFilter, setRoleFilter, searchQuery, setSearchQuery } = useDirectory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerating3, setIsGenerating3] = useState(false);
  const [isGenerating5, setIsGenerating5] = useState(false);
  const [isGenerating10, setIsGenerating10] = useState(false);
  const [isGenerating20, setIsGenerating20] = useState(false);
  const [newProfile, setNewProfile] = useState<InsertProfile>({
    id: '',
    first_name: '',
    last_name: '',
    role: '',
    department: '',
    phone: '',
    experience_level: 1,
    hourly_rate: 1000
  });
  
  const queryClient = useQueryClient();
  const { toast: showToast } = useToast();
  
  const handleAddProfile = async () => {
    try {
      await addProfile(newProfile);
      
      // Force complete cache refresh
      console.log('🔄 Forcing complete cache refresh after adding new profile...');
      
      await queryClient.removeQueries({ queryKey: ['profiles'] });
      await queryClient.removeQueries({ queryKey: ['all-employees'] });
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
      await queryClient.invalidateQueries({ queryKey: ['all-employees'] });
      await queryClient.refetchQueries({ queryKey: ['profiles'] });
      await queryClient.refetchQueries({ queryKey: ['all-employees'] });
      
      console.log('✅ Cache refresh completed - new employee should be visible');
      
      setNewProfile({
        id: '',
        first_name: '',
        last_name: '',
        role: '',
        department: '',
        phone: '',
        experience_level: 1,
        hourly_rate: 1000
      });
      
      setIsDialogOpen(false);
      toast.success('Employee added successfully');
      
    } catch (error) {
      console.error('Error adding profile:', error);
      toast.error('Failed to add employee');
    }
  };

  const handleClearDatabase = async () => {
    console.log('🗑️ Cleaning database for development purposes...');
    setIsClearing(true);
    try {
      await clearDatabase();
      
      console.log('🔄 Refreshing cache after database clear...');
      await queryClient.removeQueries({ queryKey: ['profiles'] });
      await queryClient.removeQueries({ queryKey: ['all-employees'] });
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
      await queryClient.invalidateQueries({ queryKey: ['all-employees'] });
      await queryClient.refetchQueries({ queryKey: ['profiles'] });
      await queryClient.refetchQueries({ queryKey: ['all-employees'] });
      console.log('✅ Database cleared and cache refreshed');
      
      showToast({
        title: "✅ Databas rensad",
        description: "All data har tagits bort från databasen"
      });
    } catch (error) {
      console.error('Error clearing database:', error);
      showToast({
        title: "❌ Fel",
        description: "Kunde inte rensa databasen",
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleGenerateTestData = async (count = 6) => {
    console.log(`🧪 Generating ${count} test employees for development...`);
    const setter = count === 3 ? setIsGenerating3 : 
                  count === 5 ? setIsGenerating5 : 
                  count === 10 ? setIsGenerating10 :
                  count === 20 ? setIsGenerating20 :
                  setIsGenerating;
    setter(true);
    try {
      await generateTestData(count);
      
      console.log('🔄 Refreshing cache after testdata generation...');
      await queryClient.removeQueries({ queryKey: ['profiles'] });
      await queryClient.removeQueries({ queryKey: ['all-employees'] });
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
      await queryClient.invalidateQueries({ queryKey: ['all-employees'] });
      await queryClient.refetchQueries({ queryKey: ['profiles'] });
      await queryClient.refetchQueries({ queryKey: ['all-employees'] });
      console.log(`✅ Generated ${count} test employees and refreshed cache`);
      
      showToast({
        title: "✅ Testdata genererad",
        description: `${count} test-anställda har lagts till i databasen`
      });
    } catch (error) {
      console.error('Error generating test data:', error);
      showToast({
        title: "❌ Fel", 
        description: "Kunde inte generera testdata",
        variant: "destructive"
      });
    } finally {
      setter(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Sök anställda..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrera efter roll" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla roller</SelectItem>
            <SelectItem value="Läkare">Läkare</SelectItem>
            <SelectItem value="Sjuksköterska">Sjuksköterska</SelectItem>
            <SelectItem value="Undersköterska">Undersköterska</SelectItem>
            <SelectItem value="Administratör">Administratör</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Lägg till anställd
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Lägg till ny anställd</DialogTitle>
            <DialogDescription>
              Fyll i information för den nya anställda
            </DialogDescription>
            <AddProfileDialog 
              isOpen={isDialogOpen}
              setIsOpen={setIsDialogOpen}
              newProfile={newProfile}
              setNewProfile={setNewProfile}
              onSubmit={async (e) => {
                e.preventDefault();
                await handleAddProfile();
              }}
              isProcessing={isProcessing}
            />
          </DialogContent>
        </Dialog>

        <Button 
          variant="destructive" 
          size="sm"
          onClick={handleClearDatabase}
          disabled={isClearing}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isClearing ? "Rensar..." : "Töm databas"}
        </Button>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleGenerateTestData(3)}
          disabled={isGenerating3}
        >
          <Users className="h-4 w-4 mr-2" />
          {isGenerating3 ? "Genererar..." : "Testdata (3)"}
        </Button>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleGenerateTestData(5)}
          disabled={isGenerating5}
        >
          <Users className="h-4 w-4 mr-2" />
          {isGenerating5 ? "Genererar..." : "Testdata (5)"}
        </Button>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleGenerateTestData(6)}
          disabled={isGenerating}
        >
          <Users className="h-4 w-4 mr-2" />
          {isGenerating ? "Genererar..." : "Testdata (6)"}
        </Button>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleGenerateTestData(10)}
          disabled={isGenerating10}
        >
          <Users className="h-4 w-4 mr-2" />
          {isGenerating10 ? "Genererar..." : "Testdata (10)"}
        </Button>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleGenerateTestData(20)}
          disabled={isGenerating20}
        >
          <Users className="h-4 w-4 mr-2" />
          {isGenerating20 ? "Genererar..." : "Testdata (20)"}
        </Button>
      </div>
    </div>
  );
}

export default DirectoryControls;
