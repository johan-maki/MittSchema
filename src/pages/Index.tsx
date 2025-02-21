
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  ArrowRight, 
  ClipboardCheck, 
  UserCircle2,
  Sparkles 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const DashboardCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  disabled
}: {
  icon: any;
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={!disabled ? { scale: 1.02 } : undefined}
    transition={{ duration: 0.2 }}
  >
    <Card 
      className={`group p-6 h-full transition-all duration-200 border-transparent bg-white/80 backdrop-blur-sm hover:bg-white/90 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`} 
      onClick={!disabled ? onClick : undefined}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            {title}
            {!disabled && (
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
            )}
          </h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Card>
  </motion.div>
);

const Index = () => {
  const navigate = useNavigate();
  const dashboardCards = [{
    icon: Calendar,
    title: "Schemaläggning",
    description: "Skapa och hantera arbetspass med vårt intuitiva kalendergränssnitt",
    onClick: () => navigate('/schedule'),
    disabled: false
  }, {
    icon: Users,
    title: "Personalkatalog",
    description: "Hitta kontaktuppgifter till dina kollegor",
    onClick: () => navigate('/directory'),
    disabled: false
  }];

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-56px)] relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50/50 to-pink-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.1),transparent_50%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <motion.header 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/30 backdrop-blur-sm rounded-full">
                <Sparkles className="w-12 h-12 text-indigo-600" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
              Välkommen till Vårdschema
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hantera vårdpersonal enkelt och effektivt med vårt moderna schemaläggningssystem
            </p>
          </motion.header>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {dashboardCards.map((card, index) => (
              <DashboardCard key={index} {...card} />
            ))}
          </motion.section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
