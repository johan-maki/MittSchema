import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/toaster";
import { addTestEmployeesForDevelopment } from "./utils/devEmployees";
import { addSampleEmployeesForProduction } from "./utils/productionEmployees";
import Schedule from "./pages/Schedule";
import Auth from "./pages/Auth";
import Directory from "./pages/Directory";
import EmployeeView from "./pages/EmployeeView";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import ScheduleSettings from "./pages/ScheduleSettings";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  console.log('🔧 App component loading...');
  
  // Add test employees in development mode
  if (import.meta.env.DEV) {
    console.log('🔧 Development mode - adding test employees...');
    addTestEmployeesForDevelopment().catch(error => {
      console.error('Failed to add development employees:', error);
    });
  } else {
    console.log('🌐 Production mode - adding sample employees...');
    // Add sample employees in production mode
    try {
      addSampleEmployeesForProduction().catch(error => {
        console.warn('Failed to add production employees (non-critical):', error);
      });
    } catch (error) {
      console.warn('Failed to call production employee function (non-critical):', error);
    }
  }

  console.log('🔧 Rendering App component...');
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/schedule"
                element={
                  <ProtectedRoute>
                    <Schedule />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schedule/settings"
                element={
                  <ProtectedRoute>
                    <ScheduleSettings />
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
                path="/employee"
                element={
                  <ProtectedRoute>
                    <EmployeeView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/help"
                element={
                  <ProtectedRoute>
                    <Help />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
