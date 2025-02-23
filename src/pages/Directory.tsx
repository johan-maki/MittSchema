
import { AppLayout } from "@/components/AppLayout";
import { DirectoryProvider } from "@/contexts/DirectoryContext";
import { DirectoryControls } from "@/components/directory/DirectoryControls";
import { DirectoryTable } from "@/components/directory/DirectoryTable";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

const Directory = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <DirectoryProvider>
        <AppLayout>
          <div className="max-w-[95%] mx-auto">
            <header className="mb-4 sm:mb-8 bg-gradient-to-r from-[#F2FCE2] to-[#E5DEFF] p-4 sm:p-8 rounded-2xl">
              <div className="bg-white/90 p-4 sm:p-6 rounded-xl backdrop-blur-sm">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1F2C] mb-2">Personalkatalog</h1>
                <p className="text-[#6E59A5]">Här hittar du all information om vårdpersonalen</p>
              </div>
            </header>
            
            <div className="grid gap-4 sm:gap-8">
              <DirectoryControls />
              <div className="bg-white rounded-lg shadow overflow-x-auto">
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
