
import { Link, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/ui/sidebar";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  
  const menuItems = [
    { name: "Översikt", href: "/", isActive: location.pathname === "/" },
    { name: "Schema", href: "/schedule", isActive: location.pathname === "/schedule" },
    { name: "Medarbetare", href: "/directory", isActive: location.pathname === "/directory" },
    { name: "Frånvaro", href: "/leave", isActive: location.pathname === "/leave" },
    { name: "Hjälp", href: "/help", isActive: location.pathname === "/help" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar menuItems={menuItems} mobileMenuItems={menuItems} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 border-b bg-white/80 backdrop-blur-sm">
          <h1 className="text-lg font-semibold">Vårdschema</h1>
          <div className="flex items-center gap-2">
            <NotificationsDropdown />
            <Link to="/profile" className="ml-2">
              <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-medium">
                A
              </div>
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};
