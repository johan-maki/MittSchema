
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "@/pages/Auth";
import Schedule from "@/pages/Schedule";
import Directory from "@/pages/Directory";
import EmployeeView from "@/pages/EmployeeView";
import NotFound from "@/pages/NotFound";
import ScheduleSettings from "@/pages/ScheduleSettings";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { DirectoryProvider } from "@/contexts/DirectoryContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DirectoryProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Auth />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Schedule />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/directory"
                element={
                  <ProtectedRoute>
                    <Directory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/:id"
                element={
                  <ProtectedRoute>
                    <EmployeeView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/schedule"
                element={
                  <ProtectedRoute>
                    <ScheduleSettings />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </DirectoryProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
