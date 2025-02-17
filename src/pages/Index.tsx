
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Calendar, Users, Bell } from "lucide-react";

const DashboardCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <Card className="p-6 hover:shadow-lg transition-all duration-200 animate-slideIn">
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
      title: "Schedule Management",
      description: "Create and manage shifts with our intuitive calendar interface",
    },
    {
      icon: Users,
      title: "Employee Directory",
      description: "Access contact information and manage team members",
    },
    {
      icon: Bell,
      title: "Company Updates",
      description: "Stay informed with real-time notifications and announcements",
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-secondary mb-2">Welcome to ShiftConnect</h1>
          <p className="text-gray-600">Manage your healthcare workforce efficiently</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card, index) => (
            <DashboardCard key={index} {...card} />
          ))}
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-secondary mb-6">Recent Updates</h2>
          <Card className="p-6 animate-slideIn">
            <p className="text-gray-600">Your recent updates and notifications will appear here.</p>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
};

export default Index;
