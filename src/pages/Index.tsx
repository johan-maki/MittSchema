
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Calendar, Users, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DashboardCard = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick,
  disabled 
}: { 
  icon: any, 
  title: string, 
  description: string,
  onClick?: () => void,
  disabled?: boolean 
}) => (
  <Card 
    className={`p-6 transition-all duration-200 animate-slideIn ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer hover:bg-indigo-50'
    }`}
    onClick={!disabled ? onClick : undefined}
  >
    <div className="flex items-start gap-4">
      <div className="p-3 bg-indigo-100 rounded-lg">
        <Icon className="w-6 h-6 text-indigo-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-indigo-900 mb-1">{title}</h3>
        <p className="text-sm text-indigo-600">{description}</p>
      </div>
    </div>
  </Card>
);

const Index = () => {
  const navigate = useNavigate();

  const dashboardCards = [
    {
      icon: Calendar,
      title: "Schemaläggning",
      description: "Skapa och hantera arbetspass med vårt intuitiva kalendergränssnitt",
      onClick: () => navigate('/schedule'),
      disabled: false
    },
    {
      icon: Users,
      title: "Personalkatalog",
      description: "Hitta kontaktuppgifter till dina kollegor",
      onClick: () => navigate('/directory'),
      disabled: false
    },
    {
      icon: Bell,
      title: "Företagsuppdateringar",
      description: "Håll dig uppdaterad med viktiga meddelanden och nyheter",
      disabled: true
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">Välkommen till ShiftConnect</h1>
          <p className="text-indigo-600">Hantera vårdpersonal enkelt och effektivt</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card, index) => (
            <DashboardCard key={index} {...card} />
          ))}
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-indigo-900 mb-6">Senaste uppdateringar</h2>
          <Card className="p-6 animate-slideIn bg-white border-indigo-100">
            <p className="text-indigo-600">Dina senaste uppdateringar och meddelanden visas här.</p>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
};

export default Index;
