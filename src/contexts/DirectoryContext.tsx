
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const hasSession = !!data.session;
        console.log("Auth check - Has session:", hasSession);
        setIsAuthenticated(hasSession);
        
        // Subscribe to auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log("Auth state change:", event, !!session);
            setIsAuthenticated(!!session);
          }
        );
        
        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error: any) {
        console.error("Authentication error:", error.message);
      }
    };
    
    checkAuth();
  }, []);

  // Handle sign in
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in with:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        toast({
          title: "Inloggning misslyckades",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Inloggad",
        description: "Du är nu inloggad",
      });
      setIsAuthenticated(true);
      return data;
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  // Handle sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        toast({
          title: "Utloggning misslyckades",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Utloggad",
        description: "Du är nu utloggad",
      });
      setIsAuthenticated(false);
    } catch (error: any) {
      console.error("Sign out error:", error);
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
