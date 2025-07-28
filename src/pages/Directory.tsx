
import { AppLayout } from "@/components/AppLayout";
import { DirectoryProvider } from "@/contexts/DirectoryContext";
import { DirectoryControls } from "@/components/directory/DirectoryControls";
import { DirectoryTable } from "@/components/directory/DirectoryTable";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Users, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Profile, DatabaseProfile, convertDatabaseProfile } from "@/types/profile";

// Create a client
const queryClient = new QueryClient();

const DirectoryStats = () => {
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*');
      
      if (error) throw error;
      return (data as DatabaseProfile[] || []).map(convertDatabaseProfile);
    }
  });

  const totalPersonal = profiles.length;
  const departments = new Set(profiles.map(p => p.department).filter(d => d)).size;
  const seniorStaff = profiles.filter(p => p.experience_level >= 4).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Total Personal</p>
            <p className="text-2xl font-bold text-slate-900">{totalPersonal}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Building2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Avdelningar</p>
            <p className="text-2xl font-bold text-slate-900">{departments}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Users className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Seniora Medarbetare</p>
            <p className="text-2xl font-bold text-slate-900">{seniorStaff}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Directory = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <DirectoryProvider>
        <AppLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Modern Header with Better Visual Hierarchy */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Personalkatalog</h1>
                    <p className="text-slate-600 mt-1">Hantera och övervaka vårdpersonalen</p>
                  </div>
                </div>
                
                {/* Stats Cards */}
                <DirectoryStats />
              </div>
              
              {/* Controls with Better Spacing */}
              <div className="mb-6">
                <DirectoryControls />
              </div>
              
              {/* Table Container with Modern Styling */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 overflow-hidden">
                <DirectoryTable />
              </div>
            </div>
          </div>
        </AppLayout>
      </DirectoryProvider>
    </QueryClientProvider>
  );
};

export default Directory;
