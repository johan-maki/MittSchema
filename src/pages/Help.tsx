import { AppLayout } from "@/components/AppLayout";
import { Link as ScrollLink } from "react-scroll";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Navigation2, 
  HelpCircle, 
  Mail,
  Download,
  LogOut,
  Settings,
  Users,
  User
} from "lucide-react";

const Help = () => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-8">
          {/* Header */}
                    <header className="text-center">
            <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
              📌 Hjälpsida för optimeringsalgoritm-drivet Schemaläggningssystem
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Välkommen till hjälpsidan för optimeringsalgoritm-drivet schemaläggningssystem! Här hittar du svar på vanliga frågor, 
              instruktioner för att navigera i systemet och kontaktinformation för support.</p>
          </header>

          <Separator />

          {/* Table of Contents */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">📖 Innehållsförteckning</h2>
            <nav className="space-y-2">
              {[
                { title: "Hur fungerar schemaläggningen?", id: "hur-fungerar-schemaläggningen" },
                { title: "Navigera i systemet", id: "navigera-i-systemet" },
                { title: "Vanliga frågor (FAQ)", id: "vanliga-frågor-faq" },
                { title: "Support", id: "support" }
              ].map((item) => (
                <div key={item.id}>
                  <ScrollLink
                    to={item.id}
                    smooth={true}
                    duration={500}
                    className="text-indigo-600 hover:text-indigo-800 cursor-pointer block"
                  >
                    {item.title}
                  </ScrollLink>
                </div>
              ))}
            </nav>
          </section>

          <Separator />

          {/* How Scheduling Works */}
          <section id="hur-fungerar-schemaläggningen" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Hur fungerar schemaläggningen?
            </h2>
            <ul className="space-y-3 text-gray-600">
              <li>• Systemet genererar automatiskt ett schema baserat på tillgänglig personal, deras erfarenhet och arbetskapacitet.</li>
              <li>• Schemat använder en optimeringsalgoritm, stöttat av AI, för att ta hänsyn till minsta totala erfarenhet per pass och se till att varje skift har en balanserad bemanning.</li>
              <li>• Du kan justera inställningar såsom minsta erfarenhetspoäng per pass, antal anställda per skift och periodens längd.</li>
            </ul>
          </section>

          <Separator />

          {/* System Navigation */}
          <section id="navigera-i-systemet" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Navigation2 className="h-6 w-6" />
              Navigera i systemet
            </h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Chefsida
                </h3>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Lägga till, redigera och ta bort anställda.</li>
                  <li>Justera inställningar för schemaläggning.</li>
                  <li>Generera ett nytt schema.</li>
                  <li>Exportera schemat till Excel.</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Medarbetarsida
                </h3>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Se sitt schema.</li>
                  <li>Kontrollera vilka skift de är schemalagda för.</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Inställningar
                </h3>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Anpassa skift-tider.</li>
                  <li>Välja periodens start- och slutdatum.</li>
                  <li>Ställa in krav på erfarenhet och minsta antal anställda per pass.</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Navigation2 className="h-5 w-5" />
                  Slingplanering
                </h3>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Optimera besöksordning för hemtjänst med AI-driven ruttplanering.</li>
                  <li>Lägg till kunder med adresser, servicetider och prioriteter.</li>
                  <li>Optimera slingor för kortast körsträcka eller tid.</li>
                  <li>Exportera detaljerade rutt-instruktioner.</li>
                  <li>Använd demo-kunder för att testa funktionaliteten.</li>
                </ul>
              </div>
            </div>
          </section>

          <Separator />

          {/* FAQ */}
          <section id="vanliga-frågor-faq" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="h-6 w-6" />
              Vanliga frågor (FAQ)
            </h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2">🔹 Hur skapas schemat?</h3>
                <p className="text-gray-600">
                  Schemat genereras automatiskt utifrån de inställningar som chefen har angett. 
                  Systemet försöker fördela passen jämnt mellan medarbetarna och ser till att varje pass uppfyller erfarenhetskraven.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2">🔹 Kan jag manuellt ändra schemat?</h3>
                <p className="text-gray-600">
                  För tillfället är schemat automatiskt genererat, men framtida versioner kan inkludera manuell justering av pass.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2">🔹 Varför har vissa anställda inga pass?</h3>
                <p className="text-gray-600">
                  Om en anställd har mycket låg erfarenhet kan systemet ha svårt att hitta en kombination där erfarenhetskravet uppfylls. 
                  Se över inställningarna för att möjliggöra en mer balanserad fördelning.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Hur exporterar jag schemat?
                </h3>
                <p className="text-gray-600">
                  Efter att schemat har genererats kan du klicka på "📥 Ladda ner schema som Excel" för att ladda ner en fil med schemat.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Hur loggar jag ut?
                </h3>
                <p className="text-gray-600">
                  Klicka på "🚪 Logga ut" för att avsluta din session.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Support */}
          <section id="support" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Support
            </h2>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-gray-600 mb-4">
                Om du har problem eller frågor som inte besvaras här, vänligen kontakta IT-support på{" "}
                <a href="mailto:support@sjukhusschema.se" className="text-indigo-600 hover:text-indigo-800">
                  support@sjukhusschema.se
                </a>{" "}
                eller prata med din administratör.
              </p>
              <p className="text-gray-600 font-medium">
                Tack för att du använder AI-drivet schemaläggningssystem! 👨‍⚕️👩‍⚕️
              </p>
            </div>
          </section>

        </div>
      </div>
    </AppLayout>
  );
};

export default Help;
