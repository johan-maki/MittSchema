
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "@/pages/Index";
import Schedule from "@/pages/Schedule";
import Directory from "@/pages/Directory";
import EmployeeView from "@/pages/EmployeeView";
import ScheduleSettings from "@/pages/ScheduleSettings";
import Auth from "@/pages/Auth";
import Help from "@/pages/Help";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import LeaveManagement from "@/pages/LeaveManagement";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedule"
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
            <Route
              path="/leave"
              element={
                <ProtectedRoute>
                  <LeaveManagement />
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
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
