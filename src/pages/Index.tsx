
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Calendar, Users } from "lucide-react";

const DashboardCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <Card className="p-6 hover:shadow-lg transition-all duration-200 animate-slideIn bg-white/80 backdrop-blur-sm">
    <div className="flex items-start gap-4">
      <div className="p-3 bg-primary bg-opacity-10 rounded-lg">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-secondary mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  </Card>
);

const Index = () => {
  const dashboardCards = [
    {
      icon: Calendar,
      title: "Schemahantering",
      description: "Skapa och hantera arbetspass med vår intuitiva kalender",
    },
    {
      icon: Users,
      title: "Personalkatalog",
      description: "Hantera teammedlemmar och kontaktinformation",
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-secondary mb-2">Välkommen till VårdSchema</h1>
          <p className="text-gray-600">Hantera ditt vårdteam effektivt</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboardCards.map((card, index) => (
            <DashboardCard key={index} {...card} />
          ))}
        </section>
      </div>
    </AppLayout>
  );
};

export default Index;
