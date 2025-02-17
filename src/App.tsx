
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Schedule from "@/pages/Schedule";
import Directory from "@/pages/Directory";
import NotFound from "@/pages/NotFound";

const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoute><Index /></ProtectedRoute>
  },
  {
    path: "/auth",
    element: <Auth />
  },
  {
    path: "/schedule",
    element: <ProtectedRoute><Schedule /></ProtectedRoute>
  },
  {
    path: "/directory",
    element: <ProtectedRoute><Directory /></ProtectedRoute>
  },
  {
    path: "*",
    element: <NotFound />
  }
]);

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
