
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // If user is authenticated, redirect to home page
    if (user) {
      navigate("/");
    }

    // Lyssna på auth-events för att visa feedback till användaren
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        toast({
          title: "Inloggning lyckades",
          description: "Välkommen tillbaka!",
        });
      } else if (event === 'SIGNED_OUT') {
        toast({
          title: "Utloggad",
          description: "Du har loggat ut från systemet",
        });
      } else if (event === 'USER_UPDATED') {
        toast({
          title: "Konto uppdaterat",
          description: "Ditt konto har uppdaterats",
        });
      } else if (event === 'PASSWORD_RECOVERY') {
        toast({
          title: "Återställning av lösenord",
          description: "Kontrollera din e-post för instruktioner",
        });
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
          <h1 className="text-2xl font-bold text-secondary">Välkommen till VårdSchema</h1>
          <p className="text-gray-600 mt-2">Logga in för att hantera ditt vårdteam</p>
        </div>
        <SupabaseAuth 
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#6366F1',
                  brandAccent: '#4F46E5',
                }
              }
            }
          }}
          providers={[]}
          localization={{
            variables: {
              sign_up: {
                email_label: 'Email',
                password_label: 'Lösenord',
                button_label: 'Skapa konto',
                loading_button_label: 'Skapar konto...',
                social_provider_text: 'Logga in med {{provider}}',
                link_text: 'Har du inget konto? Skapa ett här',
              },
              sign_in: {
                email_label: 'Email',
                password_label: 'Lösenord',
                button_label: 'Logga in',
                loading_button_label: 'Loggar in...',
                social_provider_text: 'Logga in med {{provider}}',
                link_text: 'Har du redan ett konto? Logga in här',
              },
            },
          }}
        />
      </Card>
    </div>
  );
};

export default Auth;
