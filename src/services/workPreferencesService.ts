import { supabase } from "@/integrations/supabase/client";
import { WorkPreferences, convertWorkPreferences } from "@/types/profile";
import type { Json } from "@/integrations/supabase/types";
import { QueryClient } from "@tanstack/react-query";

/**
 * Service för att hantera work_percentage uppdateringar konsekvent.
 * 
 * Denna service säkerställer att work_percentage alltid uppdateras på båda ställen:
 * 1. work_percentage kolumnen direkt (för admin interface)
 * 2. work_preferences.work_percentage (för employee interface)
 * 
 * Detta håller data synkroniserat mellan chefsidan och anställdas vy.
 */
export class WorkPreferencesService {
  /**
   * Invaliderar alla relevanta cache keys efter work_percentage uppdateringar
   */
  static async refreshCache(queryClient: QueryClient, employeeId?: string): Promise<void> {
    console.log('🔄 WorkPreferencesService: Refreshing cache...');
    
    // Centraliserad cache invalidation för konsistens
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['profiles'] }),           // Admin interface
      queryClient.invalidateQueries({ queryKey: ['work-preferences'] }),   // Employee interface
      queryClient.invalidateQueries({ queryKey: ['all-employees'] }),      // General employee lists
      ...(employeeId ? [
        queryClient.invalidateQueries({ queryKey: ['employee-profile', employeeId] })
      ] : [])
    ]);
    
    console.log('✅ WorkPreferencesService: Cache refreshed');
  }
  /**
   * Uppdaterar work_percentage för en anställd och håller båda källor synkroniserade
   */
  static async updateWorkPercentage(
    employeeId: string, 
    newWorkPercentage: number,
    existingWorkPreferences?: WorkPreferences
  ): Promise<void> {
    console.log(`🔄 WorkPreferencesService: Updating work_percentage for employee ${employeeId} to ${newWorkPercentage}%`);
    
    // Hämta befintliga work_preferences om de inte är tillgängliga
    let currentWorkPreferences = existingWorkPreferences;
    if (!currentWorkPreferences) {
      const { data: currentProfile, error: fetchError } = await supabase
        .from('employees')
        .select('work_preferences')
        .eq('id', employeeId)
        .single();
      
      if (fetchError) {
        console.error('❌ WorkPreferencesService: Error fetching current work_preferences:', fetchError);
        throw fetchError;
      }
      
      currentWorkPreferences = convertWorkPreferences(currentProfile.work_preferences);
    }
    
    // Uppdatera work_preferences.work_percentage
    const updatedWorkPreferences: WorkPreferences = {
      ...currentWorkPreferences,
      work_percentage: newWorkPercentage
    };
    
    // Uppdatera BÅDA fälten samtidigt för konsistens
    const { data, error } = await supabase
      .from('employees')
      .update({
        work_percentage: newWorkPercentage,                       // Direkt kolumn för admin interface
        work_preferences: updatedWorkPreferences as unknown as Json  // JSON fält för employee interface
      })
      .eq('id', employeeId)
      .select('work_percentage, work_preferences');
    
    if (error) {
      console.error('❌ WorkPreferencesService: Error updating work_percentage:', error);
      throw error;
    }
    
    console.log('✅ WorkPreferencesService: Successfully updated work_percentage in both locations:', data);
  }
  
  /**
   * Uppdaterar hela work_preferences objektet och synkroniserar work_percentage kolumnen
   */
  static async updateWorkPreferences(
    employeeId: string, 
    newWorkPreferences: WorkPreferences
  ): Promise<void> {
    console.log(`🔄 WorkPreferencesService: Updating full work_preferences for employee ${employeeId}`);
    
    // Uppdatera BÅDA fälten samtidigt för konsistens
    const { data, error } = await supabase
      .from('employees')
      .update({
        work_percentage: newWorkPreferences.work_percentage,   // Synkronisera direkt kolumn
        work_preferences: newWorkPreferences as unknown as Json  // Uppdatera JSON fält
      })
      .eq('id', employeeId)
      .select('work_percentage, work_preferences');
    
    if (error) {
      console.error('❌ WorkPreferencesService: Error updating work_preferences:', error);
      throw error;
    }
    
    console.log('✅ WorkPreferencesService: Successfully updated work_preferences and synced work_percentage:', data);
  }
  
  /**
   * Hämtar work_preferences för en anställd
   */
  static async getWorkPreferences(employeeId: string): Promise<WorkPreferences | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('work_preferences')
      .eq('id', employeeId)
      .single();
    
    if (error) {
      console.error('❌ WorkPreferencesService: Error fetching work_preferences:', error);
      throw error;
    }
    
    return data?.work_preferences ? convertWorkPreferences(data.work_preferences) : null;
  }
}
