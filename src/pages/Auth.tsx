
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
          if (!session) {
            toast({
              title: "Ett fel uppstod",
              description: "Kunde inte logga in. Kontrollera dina uppgifter och försök igen.",
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
        </div>
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
                  defaultButtonBackgroundHover: '#7E69AB'
                }
              }
            },
            style: {
              button: {
                borderRadius: '6px',
                height: '40px'
              },
              input: {
                borderRadius: '6px',
                height: '40px'
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
      </Card>
    </div>
  );
};

export default Auth;
