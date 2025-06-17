import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { testSupabaseConnection } from "@/utils/connectionTest";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import "../styles/auth-overrides.css";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');

  // Test connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      const result = await testSupabaseConnection();
      setConnectionStatus(result.success ? 'connected' : 'failed');
      
      if (!result.success && !result.warning) {
        toast({
          title: "Anslutningsproblem",
          description: `Kunde inte ansluta till servern: ${result.error}`,
          variant: "destructive"
        });
      } else if (result.warning) {
        toast({
          title: "Offline-läge",
          description: "Arbetar med lokala data. Vissa funktioner kan vara begränsade.",
          variant: "default"
        });
        setConnectionStatus('connected'); // Allow app to continue
      }
    };
    
    checkConnection();
  }, [toast]);

  useEffect(() => {
    if (user) {
      navigate("/");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      
      switch (event) {
        case 'SIGNED_IN':
          navigate("/");
          break;
        case 'SIGNED_OUT':
          navigate("/auth");
          break;
        case 'USER_UPDATED':
          console.log('User updated:', session?.user);
          break;
        case 'PASSWORD_RECOVERY':
          toast({
            title: "Återställning av lösenord",
            description: "Följ instruktionerna i e-postmeddelandet för att återställa ditt lösenord."
          });
          break;
        default:
          // Kontrollera specifika felkoder från supabase
          const error = (session as any)?.error;
          if (error) {
            let errorMessage = "Ett fel uppstod. Försök igen.";
            
            if (error.message.includes("User already registered")) {
              errorMessage = "E-postadressen är redan registrerad. Försök logga in istället.";
            } else if (error.message.includes("Invalid login credentials")) {
              errorMessage = "Felaktig e-postadress eller lösenord.";
            }
            
            toast({
              title: "Autentiseringsfel",
              description: errorMessage,
              variant: "destructive"
            });
          }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#1A1F2C]">Välkommen till Vårdschema</h1>
          <p className="text-gray-600 mt-2">Logga in för att hantera ditt schema</p>
          
          {/* Connection Status Indicator */}
          <div className="mt-4 flex items-center justify-center space-x-2">
            {connectionStatus === 'checking' && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-500">Kontrollerar anslutning...</span>
              </>
            )}
            {connectionStatus === 'connected' && (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Ansluten till servern</span>
              </>
            )}
            {connectionStatus === 'failed' && (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">Anslutningsproblem</span>
              </>
            )}
          </div>
        </div>
        
        {connectionStatus !== 'failed' && (
          <SupabaseAuth 
            supabaseClient={supabase} 
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#9b87f5',
                    brandAccent: '#7E69AB',
                    defaultButtonBackground: '#9b87f5',
                    defaultButtonBackgroundHover: '#7E69AB',
                    inputText: '#1A1F2C',
                    inputBackground: '#ffffff',
                    inputBorder: '#e2e8f0',
                    inputBorderHover: '#cbd5e1',
                    inputBorderFocus: '#9b87f5'
                  },
                  fontSizes: {
                    baseBodySize: '14px',
                    baseInputSize: '16px'
                  }
                }
              },
              style: {
                button: {
                  borderRadius: '8px',
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: '600'
                },
                input: {
                  borderRadius: '8px',
                  height: '48px',
                  fontSize: '16px',
                  color: '#1F2937 !important',
                  backgroundColor: '#ffffff !important',
                  border: '2px solid #d1d5db !important',
                  padding: '12px 16px'
                },
                label: {
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                },
                message: {
                  fontSize: '14px',
                  marginTop: '8px'
                }
              }
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'E-postadress',
                  password_label: 'Lösenord',
                  button_label: 'Logga in',
                  loading_button_label: 'Loggar in...',
                  email_input_placeholder: 'Din e-postadress',
                  password_input_placeholder: 'Ditt lösenord'
                },
                sign_up: {
                  email_label: 'E-postadress',
                  password_label: 'Lösenord',
                  button_label: 'Registrera',
                  loading_button_label: 'Registrerar...',
                  email_input_placeholder: 'Din e-postadress',
                  password_input_placeholder: 'Skapa ett lösenord'
                },
                forgotten_password: {
                  email_label: 'E-postadress',
                  button_label: 'Skicka återställningslänk',
                  loading_button_label: 'Skickar...',
                  link_text: 'Glömt lösenord?'
                }
              }
            }}
            providers={[]}
          />
        )}
        
        {connectionStatus === 'failed' && (
          <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Anslutningsproblem</h3>
            <p className="text-red-700 text-sm mb-4">
              Kunde inte ansluta till servern. Kontrollera din internetanslutning och försök igen.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Försök igen
              </button>
              <button
                onClick={() => {
                  setConnectionStatus('connected');
                  toast({
                    title: "Offline-läge aktiverat",
                    description: "Använder lokala data. Vissa funktioner kan vara begränsade.",
                    variant: "default"
                  });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Fortsätt offline
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Auth;
