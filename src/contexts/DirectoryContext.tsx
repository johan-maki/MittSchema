
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DirectoryContextType {
  roleFilter: string;
  setRoleFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const DirectoryContext = createContext<DirectoryContextType | undefined>(undefined);

export function DirectoryProvider({ children }: { children: ReactNode }) {
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Alltid autentiserad i utvecklingsläge
  const { toast } = useToast();

  // Check authentication status - i utvecklingsläge alltid autentiserad
  useEffect(() => {
    console.log("Development mode: Always authenticated");
    setIsAuthenticated(true);
    
    // För att vara konsekvent, låtsas lyssna på auth-förändringar
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change (ignored in dev mode):", event, !!session);
        // Ignorera auth-förändringar i utvecklingsläge
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Handle sign in - i utvecklingsläge alltid lyckat
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Development mode: Auto sign-in successful");
      
      toast({
        title: "Inloggad",
        description: "Du är automatiskt inloggad i utvecklingsläge (alla rättigheter)",
      });
      
      setIsAuthenticated(true);
      
      // Typmässigt korrekt returnering av void
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: "Inloggning misslyckades",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle sign out - i utvecklingsläge egentligen ingen effekt
  const signOut = async () => {
    try {
      console.log("Development mode: Sign out attempted (but staying authenticated)");
      
      toast({
        title: "Notera",
        description: "I utvecklingsläge förblir du alltid inloggad med alla rättigheter",
      });
      
      // Vi behåller inloggningsstatus i utvecklingsläge
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Utloggning misslyckades",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <DirectoryContext.Provider
      value={{
        roleFilter,
        setRoleFilter,
        searchQuery,
        setSearchQuery,
        isAuthenticated,
        signIn,
        signOut
      }}
    >
      {children}
    </DirectoryContext.Provider>
  );
}

export function useDirectory() {
  const context = useContext(DirectoryContext);
  if (context === undefined) {
    throw new Error('useDirectory must be used within a DirectoryProvider');
  }
  return context;
}
