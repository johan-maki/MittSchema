
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Schedule from "./pages/Schedule";
import Auth from "./pages/Auth";
import Directory from "./pages/Directory";
import EmployeeView from "./pages/EmployeeView";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import ScheduleSettings from "./pages/ScheduleSettings";
import BasicCalendar from "./pages/BasicCalendar"; // New import
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
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
              path="/basic-calendar"
              element={
                <ProtectedRoute>
                  <BasicCalendar />
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
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
