import { AppLayout } from "@/components/AppLayout";
import { Link as ScrollLink } from "react-scroll";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Navigation2, 
  HelpCircle, 
  Mail,
  Download,
  LogOut,
  Settings,
  Users,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Shield,
  Zap,
  Brain,
  Target,
  BarChart3,
  UserCog,
  CalendarCheck,
  CalendarX,
  AlertTriangle,
  FileSpreadsheet
} from "lucide-react";

const Help = () => {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Hero Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Hjälpcenter
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Allt du behöver veta om vårt AI-drivna schemaläggningssystem. 
              Från grundläggande navigation till avancerade optimeringsfunktioner.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <Card className="border-indigo-100 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">AI-driven</p>
                    <p className="text-sm text-gray-600">Gurobi-optimering</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-purple-100 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">100%</p>
                    <p className="text-sm text-gray-600">Automatiserad</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-100 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">Rättvist</p>
                    <p className="text-sm text-gray-600">Balanserad bemanning</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table of Contents */}
          <Card className="mb-12 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation2 className="h-5 w-5 text-indigo-600" />
                Snabbnavigering
              </CardTitle>
              <CardDescription>Hoppa direkt till det du söker</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { title: "Hur fungerar schemaläggningen?", id: "hur-fungerar-schemaläggningen", icon: Brain },
                  { title: "3-nivå begränsningssystem", id: "begränsningssystem", icon: Target },
                  { title: "Navigera i systemet", id: "navigera-i-systemet", icon: Navigation2 },
                  { title: "Schemagenereringsprocess", id: "schema-process", icon: Zap },
                  { title: "Anställdas preferenser", id: "preferenser", icon: UserCog },
                  { title: "Vanliga frågor (FAQ)", id: "vanliga-frågor-faq", icon: HelpCircle },
                  { title: "Optimeringsalgoritmen", id: "optimering", icon: BarChart3 },
                  { title: "Support", id: "support", icon: Mail }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <ScrollLink
                      key={item.id}
                      to={item.id}
                      smooth={true}
                      duration={500}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer group border border-transparent hover:border-indigo-200"
                    >
                      <Icon className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </ScrollLink>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* How Scheduling Works */}
          <section id="hur-fungerar-schemaläggningen" className="scroll-mt-20 mb-12">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Brain className="h-6 w-6 text-indigo-600" />
                  Hur fungerar schemaläggningen?
                </CardTitle>
                <CardDescription>
                  Vårt system använder Gurobi - en världsledande matematisk optimerare
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-indigo-900 mb-1">Automatisk generering</h4>
                      <p className="text-sm text-indigo-700">
                        Systemet skapar automatiskt ett optimalt schema baserat på personalens 
                        tillgänglighet, erfarenhet och arbetskapacitet.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <Target className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-900 mb-1">Rättvis fördelning</h4>
                      <p className="text-sm text-purple-700">
                        AI:n balanserar arbetsbelastning mellan alla medarbetare och säkerställer 
                        att varje pass uppfyller erfarenhetskrav.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <Settings className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Anpassningsbara inställningar</h4>
                      <p className="text-sm text-blue-700">
                        Justera minsta erfarenhetspoäng, antal anställda per pass, 
                        arbetsbelastning och schemaperiod.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                    <Zap className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-emerald-900 mb-1">Snabb optimering</h4>
                      <p className="text-sm text-emerald-700">
                        Gurobi löser komplexa schemaläggningsproblem på sekunder genom 
                        avancerade matematiska algoritmer.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Vad optimerar systemet?
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        <strong>Maximal täckning:</strong> Fyller så många pass som möjligt med kompetent personal
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        <strong>Rättvis fördelning:</strong> Balanserar totala antalet pass mellan medarbetare
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        <strong>Passtyps-balans:</strong> Sprider dag/kväll/natt-pass jämnt
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        <strong>Helgbalans:</strong> Säkerställer rättvis fördelning av helgarbete
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        <strong>Respekterar preferenser:</strong> Tar hänsyn till anställdas önskemål när det är möjligt
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 3-Level Constraints System */}
          <section id="begränsningssystem" className="scroll-mt-20 mb-12">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Target className="h-6 w-6 text-indigo-600" />
                  3-nivå begränsningssystem
                </CardTitle>
                <CardDescription>
                  Anställda kan uttrycka sina preferenser i tre nivåer - från önskemål till absoluta begränsningar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Level 1: Soft Preferences */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-emerald-600 rounded-lg">
                      <CalendarCheck className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-emerald-900 mb-1">
                        Nivå 1: Mjuka preferenser (Gröna)
                      </h4>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 mb-2">
                        Låg prioritet • Respekteras när möjligt
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-emerald-800">
                      <strong>Användning:</strong> "Jag föredrar att jobba dessa pass/dagar"
                    </p>
                    <p className="text-sm text-emerald-700">
                      <strong>Hur det fungerar:</strong> Systemet försöker respektera dessa önskemål men kan 
                      åsidosätta dem för att säkerställa god täckning och rättvis fördelning.
                    </p>
                    <div className="bg-white/60 p-3 rounded-lg">
                      <p className="text-xs text-emerald-800 font-medium">Exempel:</p>
                      <ul className="text-xs text-emerald-700 mt-1 space-y-1">
                        <li>• Föredrar dagpass framför kvällspass</li>
                        <li>• Vill helst jobba måndag-fredag</li>
                        <li>• Önskar färre nattpass</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Level 2: Medium Preferences */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-200">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-amber-600 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-amber-900 mb-1">
                        Nivå 2: Starka preferenser (Gula)
                      </h4>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 mb-2">
                        Medelhög prioritet • Max 3 per månad
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-amber-800">
                      <strong>Användning:</strong> "Jag vill helst undvika detta pass, men det går om det är nödvändigt"
                    </p>
                    <p className="text-sm text-amber-700">
                      <strong>Hur det fungerar:</strong> Systemet lägger stor vikt vid att undvika dessa pass. 
                      Schemaläggs endast om det behövs för att uppfylla täckningskrav.
                    </p>
                    <div className="bg-white/60 p-3 rounded-lg">
                      <p className="text-xs text-amber-800 font-medium">Exempel:</p>
                      <ul className="text-xs text-amber-700 mt-1 space-y-1">
                        <li>• Tandläkartid (kan omboka om absolut nödvändigt)</li>
                        <li>• Familjeevenemang (inte kritiskt)</li>
                        <li>• Önskar undvika specifik dag men kan flexibla</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Level 3: Hard Blocks */}
                <div className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-xl border border-red-200">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-red-600 rounded-lg">
                      <CalendarX className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-red-900 mb-1">
                        Nivå 3: Hårda begränsningar (Röda)
                      </h4>
                      <Badge variant="secondary" className="bg-red-100 text-red-700 mb-2">
                        Högsta prioritet • Max 3 per månad • Absolut
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-red-800">
                      <strong>Användning:</strong> "Jag kan INTE jobba detta pass under några omständigheter"
                    </p>
                    <p className="text-sm text-red-700">
                      <strong>Hur det fungerar:</strong> Systemet kan matematiskt ALDRIG schemalägga dig på dessa pass. 
                      Detta är en absolut begränsning som alltid respekteras.
                    </p>
                    <div className="bg-white/60 p-3 rounded-lg">
                      <p className="text-xs text-red-800 font-medium">Exempel:</p>
                      <ul className="text-xs text-red-700 mt-1 space-y-1">
                        <li>• Semester/ledighet</li>
                        <li>• Viktig medicinsk undersökning</li>
                        <li>• Juridiska/familjerättsliga förpliktelser</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Comparison Table */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-slate-600" />
                    Jämförelsetabell
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left py-2 px-3 font-semibold text-slate-700">Aspekt</th>
                          <th className="text-left py-2 px-3 font-semibold text-emerald-700">Mjuka</th>
                          <th className="text-left py-2 px-3 font-semibold text-amber-700">Starka</th>
                          <th className="text-left py-2 px-3 font-semibold text-red-700">Hårda</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-2 px-3 font-medium text-slate-600">Prioritet</td>
                          <td className="py-2 px-3 text-emerald-700">Låg (8-12)</td>
                          <td className="py-2 px-3 text-amber-700">Medel (30)</td>
                          <td className="py-2 px-3 text-red-700">Absolut (∞)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium text-slate-600">Max antal</td>
                          <td className="py-2 px-3 text-emerald-700">Obegränsat</td>
                          <td className="py-2 px-3 text-amber-700">3/månad</td>
                          <td className="py-2 px-3 text-red-700">3/månad</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium text-slate-600">Kan åsidosättas?</td>
                          <td className="py-2 px-3 text-emerald-700">Ja, ofta</td>
                          <td className="py-2 px-3 text-amber-700">Endast om kritiskt</td>
                          <td className="py-2 px-3 text-red-700">Aldrig</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium text-slate-600">Implementation</td>
                          <td className="py-2 px-3 text-emerald-700">Toggle-knappar</td>
                          <td className="py-2 px-3 text-amber-700">Kalender-dialog</td>
                          <td className="py-2 px-3 text-red-700">Kalender-dialog</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* System Navigation */}
          <section id="navigera-i-systemet" className="scroll-mt-20 mb-12">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Navigation2 className="h-6 w-6 text-indigo-600" />
                  Navigera i systemet
                </CardTitle>
                <CardDescription>
                  En guide till alla huvudfunktioner i systemet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Schema */}
                  <Card className="border-indigo-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-indigo-600" />
                        Schema
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                          <span>Visa schema i dag/vecka/månadsvy</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                          <span>Generera nytt schema för nästa månad</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                          <span>Lägg till, redigera eller ta bort pass</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                          <span>Publicera schema för medarbetare</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Personalkatalog */}
                  <Card className="border-purple-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5 text-purple-600" />
                        Personalkatalog
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>Hantera alla medarbetare</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>Ställ in erfarenhetsnivåer (1-10)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>Konfigurera arbetsbelastning (%)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>Tilldela roller och avdelningar</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Anställdas vy */}
                  <Card className="border-blue-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <UserCog className="h-5 w-5 text-blue-600" />
                        Anställdas vy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Se eget schema</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Ange arbetsönskemål (3-nivå system)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Markera hårda/starka begränsningar</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Konfigurera tillgängliga dagar</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Slingplanering */}
                  <Card className="border-emerald-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Navigation2 className="h-5 w-5 text-emerald-600" />
                        Slingplanering
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>AI-driven ruttoptimering för hemtjänst</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>Minimera körsträcka/tid mellan besök</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>Hantera kunder och prioriteter</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>Exportera rutt-instruktioner</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Schema Generation Process */}
          <section id="schema-process" className="scroll-mt-20 mb-12">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Zap className="h-6 w-6 text-indigo-600" />
                  Schemagenereringsprocess
                </CardTitle>
                <CardDescription>
                  Steg-för-steg hur systemet skapar det optimala schemat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full font-bold">
                        1
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Samla data</h4>
                      <p className="text-sm text-gray-600">
                        Systemet hämtar all personaldata: erfarenhetsnivåer, arbetsbelastning (%), 
                        preferenser (mjuka/starka/hårda) och tillgänglighet.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-600 rounded-full font-bold">
                        2
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Konfigurera begränsningar</h4>
                      <p className="text-sm text-gray-600">
                        Hårda begränsningar (röda) tillämpas som absoluta constraints. 
                        Starka preferenser (gula) får högre viktning i optimeringen. 
                        Mjuka preferenser (gröna) beaktas när möjligt.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-bold">
                        3
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Gurobi-optimering</h4>
                      <p className="text-sm text-gray-600">
                        Matematisk lösare beräknar det optimala schemat baserat på viktade mål: 
                        täckning (100x), rättvisa (50x), starka preferenser (30x), helgbalans (20x), etc.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full font-bold">
                        4
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Validering & generering</h4>
                      <p className="text-sm text-gray-600">
                        Systemet validerar att alla hårda constraints är uppfyllda, 
                        skapar schemat och visar täckningsstatistik och rättvisemått.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 bg-amber-100 text-amber-600 rounded-full font-bold">
                        5
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Granskning & publicering</h4>
                      <p className="text-sm text-gray-600">
                        Chef granskar schemat, kan göra manuella justeringar om behövs, 
                        och publicerar sedan schemat för medarbetarna.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-indigo-900 mb-1">Tidsåtgång</h4>
                      <p className="text-sm text-indigo-700">
                        En typisk schemagenereringsprocess för 20-30 medarbetare över en månad 
                        tar <strong>15-45 sekunder</strong> beroende på komplexitet och antal begränsningar.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Employee Preferences */}
          <section id="preferenser" className="scroll-mt-20 mb-12">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <UserCog className="h-6 w-6 text-indigo-600" />
                  Hur anställda anger preferenser
                </CardTitle>
                <CardDescription>
                  Guide för medarbetare att uttrycka sina arbetstid-önskemål
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-indigo-600" />
                    Steg 1: Grundinställningar
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-white/60 p-4 rounded-lg">
                      <p className="font-medium text-sm text-indigo-900 mb-2">Arbetsbelastning</p>
                      <p className="text-sm text-gray-700">
                        Ställ in din arbetsbelastning i procent (25%, 50%, 75%, 100%). 
                        Detta påverkar hur många pass systemet schemalägger dig för.
                      </p>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg">
                      <p className="font-medium text-sm text-indigo-900 mb-2">Föredragna passtyper</p>
                      <p className="text-sm text-gray-700">
                        Välj vilka passtyper du föredrar: Dag (06:00-14:00), Kväll (14:00-22:00), 
                        Natt (22:00-06:00) via toggle-knappar.
                      </p>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg">
                      <p className="font-medium text-sm text-indigo-900 mb-2">Tillgängliga dagar</p>
                      <p className="text-sm text-gray-700">
                        Markera vilka veckodagar du är tillgänglig att arbeta (Mån-Sön). 
                        Detta är en mjuk preferens som systemet respekterar när det är möjligt.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-100">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Steg 2: Starka preferenser (Gula)
                  </h4>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">
                      Klicka på "Arbetstillfällen jag helst avstår" för att markera specifika datum/pass 
                      du vill undvika men kan flexibla med vid behov.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">1.</span>
                        <span>Öppna kalendern och klicka på datum</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">2.</span>
                        <span>Välj vilka pass (dag/kväll/natt eller hela dagen)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">3.</span>
                        <span>Max 3 st per månad</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-xl border border-red-100">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <CalendarX className="h-5 w-5 text-red-600" />
                    Steg 3: Hårda begränsningar (Röda)
                  </h4>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">
                      Klicka på "Arbetstillfällen jag ej kan jobba" för absoluta begränsningar 
                      som systemet ALDRIG kan åsidosätta.
                    </p>
                    <div className="bg-white/60 p-4 rounded-lg">
                      <p className="font-medium text-sm text-red-900 mb-2">⚠️ Viktigt att veta</p>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>• Används endast för absoluta omöjligheter (semester, medicinska skäl)</li>
                        <li>• Max 3 st per månad för att inte begränsa schemat för mycket</li>
                        <li>• Systemet kan INTE schemalägga dig på dessa pass</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>


          {/* Optimization Algorithm */}
          <section id="optimering" className="scroll-mt-20 mb-12">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                  Optimeringsalgoritmen
                </CardTitle>
                <CardDescription>
                  Teknisk förklaring av hur Gurobi löser schemaläggningsproblemet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
                  <h4 className="font-semibold text-lg mb-3">Objektivfunktion (Prioriterad ordning)</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white/60 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">1. Maximal täckning</span>
                      <Badge className="bg-indigo-600">100x</Badge>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">2. Rättvis totalfördelning</span>
                      <Badge className="bg-purple-600">50x</Badge>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">3. Starka preferenser (gula)</span>
                      <Badge className="bg-amber-600">30x</Badge>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">4. Helgbalans</span>
                      <Badge className="bg-blue-600">20x</Badge>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">5. Önskade dagar (gröna)</span>
                      <Badge className="bg-emerald-600">12x</Badge>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">6. Passtyps-balans</span>
                      <Badge className="bg-slate-600">8x</Badge>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">7. Önskade pass (gröna)</span>
                      <Badge className="bg-green-600">8x</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h5 className="font-semibold text-sm text-blue-900 mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Hårda constraints
                    </h5>
                    <ul className="space-y-1 text-xs text-blue-700">
                      <li>• Hårda begränsningar (röda): shifts == 0</li>
                      <li>• Minsta personal per pass</li>
                      <li>• Minsta erfarenhetspoäng per pass</li>
                      <li>• Max 5 pass per vecka (standard)</li>
                      <li>• Max 2 nattpass i rad</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <h5 className="font-semibold text-sm text-amber-900 mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Mjuka constraints
                    </h5>
                    <ul className="space-y-1 text-xs text-amber-700">
                      <li>• Starka preferenser (gula): penalties</li>
                      <li>• Önskade dagar/pass (gröna): bonuses</li>
                      <li>• Rättvis fördelning: minimize range</li>
                      <li>• Balansera passtyper mellan personal</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h5 className="font-semibold text-sm text-slate-900 mb-2">💡 Varför denna ordning?</h5>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Viktningen säkerställer att <strong>täckning kommer först</strong> (alla pass ska bemannas), 
                    följt av <strong>rättvisa</strong> (ingen ska jobba mycket mer än andra). 
                    Starka preferenser (30x) väger tyngre än mjuka (8-12x) men kan åsidosättas vid behov. 
                    Hårda begränsningar är absoluta och bryts aldrig.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* FAQ */}
          <section id="vanliga-frågor-faq" className="scroll-mt-20 mb-12">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <HelpCircle className="h-6 w-6 text-indigo-600" />
                  Vanliga frågor (FAQ)
                </CardTitle>
                <CardDescription>
                  Svar på de vanligaste frågorna
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-5 rounded-lg border border-indigo-100">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-indigo-600" />
                    Hur skapas schemat?
                  </h3>
                  <p className="text-sm text-gray-700">
                    Schemat genereras automatiskt med Gurobi-optimering som balanserar täckning, 
                    rättvisa och preferenser. Systemet tar hänsyn till arbetsbelastning, erfarenhet, 
                    och alla tre nivåerna av begränsningar.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-100">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-600" />
                    Kan jag manuellt ändra schemat?
                  </h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Ja! Efter att schemat genererats kan du klicka på enskilda pass för att redigera eller ta bort dem. 
                    Du kan också lägga till nya pass manuellt.
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Tips: Manuella ändringar påverkar inte automatisk regenerering
                  </Badge>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-5 rounded-lg border border-amber-100">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    Varför har vissa anställda inga/få pass?
                  </h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Detta kan bero på flera faktorer:
                  </p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      <span><strong>Låg arbetsbelastning:</strong> Kontrollera att arbetsbelastning % är korrekt satt</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      <span><strong>För många begränsningar:</strong> För många hårda/starka blockeringar begränsar möjligheterna</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      <span><strong>Låg erfarenhet:</strong> Systemet kan ha svårt att uppfylla erfarenhetskrav</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      <span><strong>Begränsad tillgänglighet:</strong> För få tillgängliga dagar</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-5 rounded-lg border border-emerald-100">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                    Hur exporterar jag schemat till Excel?
                  </h3>
                  <p className="text-sm text-gray-700">
                    Efter att schemat har genererats, klicka på "Exportera schema" eller "Ladda ner schema som Excel" 
                    för att få en .xlsx-fil med alla pass, anställda, tider och avdelningar.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-lg border border-blue-100">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Hur publicerar jag schemat?
                  </h3>
                  <p className="text-sm text-gray-700">
                    När du är nöjd med schemat, publicera det så att medarbetarna kan se sina pass. 
                    Opublicerade pass visas med "utkast"-etikett och är endast synliga för chefer.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-rose-50 p-5 rounded-lg border border-red-100">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Vad händer om schemat inte kan genereras?
                  </h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Om Gurobi inte kan hitta en lösning kan det bero på:
                  </p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600">•</span>
                      <span><strong>För få anställda:</strong> Fler medarbetare behövs för täckning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600">•</span>
                      <span><strong>Omöjliga krav:</strong> Minsta erfarenhetskrav kan vara för högt</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600">•</span>
                      <span><strong>Konflikt constraints:</strong> För många hårda begränsningar överlappar</span>
                    </li>
                  </ul>
                  <div className="mt-2 text-xs bg-red-100 p-2 rounded">
                    <strong>Lösning:</strong> Justera krav nedåt, öka arbetsbelastning, eller be anställda ta bort några begränsningar.
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Support */}
          <section id="support" className="scroll-mt-20 mb-12">
            <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl text-white">
                  <Mail className="h-6 w-6" />
                  Behöver du hjälp?
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Vi finns här för att hjälpa dig
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg border border-white/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Kontakta support
                  </h4>
                  <p className="text-sm text-indigo-100 mb-3">
                    Om du har problem eller frågor som inte besvaras här, vänligen kontakta IT-support:
                  </p>
                  <a 
                    href="mailto:support@sjukhusschema.se" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium text-sm"
                  >
                    <Mail className="h-4 w-4" />
                    support@sjukhusschema.se
                  </a>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg border border-white/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Ytterligare resurser
                  </h4>
                  <ul className="space-y-2 text-sm text-indigo-100">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Användarguider och video-tutorials (kommer snart)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Teknisk dokumentation för administratörer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Best practices för optimal schemaläggning</span>
                    </li>
                  </ul>
                </div>

                <div className="text-center pt-4">
                  <p className="text-lg font-medium text-white mb-1">
                    Tack för att du använder Vårdschema! 
                  </p>
                  <p className="text-sm text-indigo-200 flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI-drivet schemaläggningssystem för modern sjukvård
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

        </div>
      </div>
    </AppLayout>
  );
};

export default Help;
