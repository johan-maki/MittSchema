
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { PageLoading } from "@/components/ui/loading";
import { getDetailedNetworkStatus } from "@/utils/networkStatus";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  retry: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // DEVELOPMENT MODE: Auto-login for testing
      // Enable for development, localhost, and the Vercel deployment for testing
      if (import.meta.env.DEV || 
          window.location.hostname === 'localhost' || 
          window.location.hostname === 'mitt-schema.vercel.app') {
        console.log('🚀 DEVELOPMENT MODE: Auto-logging in as test user');
        console.log('🌍 Environment:', {
          hostname: window.location.hostname,
          isDev: import.meta.env.DEV,
          mode: import.meta.env.MODE
        });
        
        const mockUser = {
          id: 'dev-user-123',
          email: 'test@vardschema.se',
          user_metadata: {
            full_name: 'Test User',
            role: 'admin'
          },
          app_metadata: {
            role: 'admin',
            permissions: ['schedule:read', 'schedule:write', 'employees:manage']
          },
          aud: 'authenticated',
          created_at: new Date().toISOString()
        };
        
        setUser(mockUser as any);
        setSession({
          user: mockUser,
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer'
        } as any);
        
        setLoading(false);
        console.log('✅ Logged in as Test User');
        return;
      }
      
      // Production auth logic
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );
      
      const authPromise = supabase.auth.getSession();
      
      const { data: { session }, error: sessionError } = await Promise.race([
        authPromise,
        timeoutPromise
      ]) as any;
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        setError('Fel vid inloggning. Försök igen.');
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError('Anslutningsproblem. Kontrollera din internetanslutning.');
    } finally {
      setLoading(false);
    }
  };

  const retry = async () => {
    setLoading(true);
    setError(null);
    
    // Check network status first for better error messages
    try {
      const detailedStatus = await getDetailedNetworkStatus();
      if (detailedStatus !== 'Anslutningen fungerar men autentisering misslyckades') {
        setError(detailedStatus);
        setLoading(false);
        return;
      }
    } catch (networkErr) {
      console.log('Network check failed, proceeding with auth attempt');
    }
    
    // Proceed with auth initialization
    initializeAuth();
  };

  useEffect(() => {
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setError(null); // Clear errors on successful auth state change
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, error, retry }}>
      {loading ? (
        <PageLoading text="Initialiserar applikation..." />
      ) : error ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Anslutningsfel</h3>
              <p className="text-sm text-gray-500 mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  type="button"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={retry}
                >
                  Försök igen
                </button>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-600">
                    <strong>Felsökning:</strong> Kontrollera att din internetanslutning fungerar och att inga brandväggar blockerar anslutningen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
