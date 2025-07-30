import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/toaster";
import { seedSupabaseData } from "./utils/seedData";
import Schedule from "./pages/Schedule";
import Auth from "./pages/Auth";
import Directory from "./pages/Directory";
import EmployeeView from "./pages/EmployeeView";
import RouteOptimization from "./pages/RouteOptimization";
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
  
  // Debug environment variables
  console.log('🔍 Environment check:', {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE
  });
  
  // Seed data only in development
  if (import.meta.env.DEV) {
    console.log('🌱 Development mode: Seeding Supabase data...');
    seedSupabaseData().then(result => {
      if (result.success) {
        console.log('✅ Data seeding result:', result.message);
      } else {
        console.warn('⚠️ Data seeding failed:', result.error);
      }
    }).catch(error => {
      console.error('💥 Data seeding error:', error);
    });
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
                path="/route-planning"
                element={
                  <ProtectedRoute>
                    <RouteOptimization />
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
