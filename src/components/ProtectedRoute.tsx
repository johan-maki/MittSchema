
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  console.log("ProtectedRoute render:", { user, loading });

  // Om vi laddar, visa laddningsindikator
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" role="status">
            <span className="sr-only">Laddar...</span>
          </div>
          <p className="mt-2 text-sm text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  // Om användaren inte är inloggad, omdirigera till /auth
  if (!user) {
    console.log("User not authenticated, redirecting to /auth");
    return <Navigate to="/auth" />;
  }

  // Om användaren är inloggad, visa innehållet
  console.log("User authenticated, showing content");
  return <>{children}</>;
};
