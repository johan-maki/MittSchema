import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Trash2, Users } from "lucide-react";
import { AddProfileDialog } from "@/components/directory/AddProfileDialog";
import { useDirectory } from "@/contexts/DirectoryContext";
import { useProfileDirectory } from "@/components/directory/hooks/useProfileDirectory";
import { useToast } from "@/hooks/use-toast";
import { InsertProfile } from "@/types/profile";
import { addProfile, clearDatabase, generateTestData } from "@/services/profileService";
import { toast } from "sonner";

export function DirectoryControls() {
  const { roleFilter, setRoleFilter, searchQuery, setSearchQuery } = useDirectory();
  const { forceRefresh } = useProfileDirectory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerating3, setIsGenerating3] = useState(false);
  const [isGenerating4, setIsGenerating4] = useState(false);
  const [isGenerating10, setIsGenerating10] = useState(false);
  const [isGenerating20, setIsGenerating20] = useState(false);
  const [isGenerating50, setIsGenerating50] = useState(false);
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
    setIsProcessing(true);
    try {
      const newProfileResult = await addProfile(newProfile);
      
      // Force immediate cache update for instant UI feedback
      console.log('🔄 Profile added successfully:', newProfileResult);
      console.log('🔄 Forcing immediate and aggressive cache update...');
      
      // Multiple strategies to ensure UI updates immediately
      
      // Strategy 1: Remove all cached data
      await queryClient.removeQueries({ queryKey: ['profiles'] });
      await queryClient.removeQueries({ queryKey: ['all-employees'] });
      
      // Strategy 2: Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
      await queryClient.invalidateQueries({ queryKey: ['all-employees'] });
      
      // Strategy 3: Force refetch with specific options
      await queryClient.refetchQueries({ 
        queryKey: ['profiles'], 
        type: 'active',
        exact: false 
      });
      await queryClient.refetchQueries({ 
        queryKey: ['all-employees'], 
        type: 'active',
        exact: false 
      });
      
      // Strategy 4: Reset all queries to force complete refresh
      await queryClient.resetQueries({ queryKey: ['profiles'] });
      
      console.log('✅ All cache update strategies completed, UI should refresh now');
      
      // Small delay to allow cache updates to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Final fallback: Force refresh through state change
      console.log("🔄 Triggering force refresh as final fallback...");
      forceRefresh();
      
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
      toast.success('Medarbetare tillagd framgångsrikt!');
      
    } catch (error) {
      console.error('Error adding profile:', error);
      toast.error('Kunde inte lägga till medarbetare');
    } finally {
      setIsProcessing(false);
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
                  count === 4 ? setIsGenerating4 : 
                  count === 10 ? setIsGenerating10 :
                  count === 20 ? setIsGenerating20 :
                  count === 50 ? setIsGenerating50 :
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
          onClick={() => handleGenerateTestData(4)}
          disabled={isGenerating4}
        >
          <Users className="h-4 w-4 mr-2" />
          {isGenerating4 ? "Genererar..." : "Testdata (4)"}
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

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleGenerateTestData(50)}
          disabled={isGenerating50}
        >
          <Users className="h-4 w-4 mr-2" />
          {isGenerating50 ? "Genererar..." : "Testdata (50)"}
        </Button>
      </div>
    </div>
  );
}

export default DirectoryControls;
